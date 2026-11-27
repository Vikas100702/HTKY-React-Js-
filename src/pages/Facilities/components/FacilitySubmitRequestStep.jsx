/**
 * @file src/pages/Facilities/components/FacilitySubmitRequestStep.jsx
 * @description Modular Step 3 (`Submit Request`) View Component for Temple Facility Booking.
 * Renders the read-only Request Summary fieldset (`Event Name`, `Event Date`, `Event Address`,
 * `Event State`, `Event City`, `Adults`, `Zip`), itemized Facilities & optional Priest Services
 * pricing table, Subtotal, Membership Discount (or `/membership` enrollment redirect CTA),
 * Facility Security Amount, Sale Total bar, and `Previous` / `Book Now` controls.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 */

import { Link } from "react-router-dom";
import { APP_COLORS } from "../../../constants/appColors";

/**
 * Formats 24-hour `"HH:mm"` into `"hh:mm AM/PM"` for read-only display.
 *
 * @param {string} time24
 * @returns {string}
 */
const formatTimeLabel = (time24) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(time24 || "").trim());
  if (!match) return "";
  const h24 = Number(match[1]);
  const min = match[2];
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, "0")}:${min} ${period}`;
};

const SummaryReadOnlyField = ({ label, value }) => (
  <fieldset className="rounded-md border border-stone-700 bg-white px-3.5 pt-1.5 pb-2.5">
    <legend className="px-1.5 text-xs font-semibold text-stone-800 leading-none">
      {label}
    </legend>
    <input
      type="text"
      readOnly
      aria-readonly="true"
      value={value || ""}
      className="w-full text-sm font-medium text-stone-900 bg-transparent outline-none py-0.5 cursor-default"
    />
  </fieldset>
);

/**
 * Renders Step 3 (`Submit Request`) summary and financial breakdown.
 *
 * @param {Object} props
 * @param {Object} props.eventDetails
 * @param {Object} props.readOnlyAddress
 * @param {boolean} props.isMemberActive
 * @param {Object} props.membershipStatusInfo
 * @param {Object} props.step3PricingSummary
 * @param {boolean} [props.isSubmitting=false]
 * @param {() => void} props.onPrevious
 * @param {() => void} props.onSubmitRequest
 */
export const FacilitySubmitRequestStep = ({
  eventDetails,
  readOnlyAddress,
  isMemberActive = false,
  membershipStatusInfo = {},
  step3PricingSummary = {},
  isSubmitting = false,
  onPrevious,
  onSubmitRequest,
}) => {
  const {
    itemizedRentals = [],
    priestServiceAmount = 0,
    subtotal = 0,
    totalMembershipDiscount = 0,
    securityDepositAmount = 0,
    saleTotal = 0,
  } = step3PricingSummary;

  const hasPriestService =
    eventDetails?.addPriestServices === "YES" &&
    Boolean(eventDetails?.selectedServiceName);

  return (
    <div className="space-y-6">
      {/* ================= REQUEST SUMMARY FIELDSET ================= */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-3">
          Request Summary
        </h2>

        <div className="rounded-xl border-2 border-stone-800 bg-white p-4 sm:p-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
            <SummaryReadOnlyField
              label="Event Name"
              value={eventDetails?.eventName}
            />
            <SummaryReadOnlyField
              label="Event Date"
              value={eventDetails?.eventDate}
            />
            <SummaryReadOnlyField
              label="Event Address"
              value={readOnlyAddress?.streetAddress}
            />
            <SummaryReadOnlyField
              label="Event State"
              value={readOnlyAddress?.state}
            />
            <SummaryReadOnlyField
              label="Event City"
              value={readOnlyAddress?.city}
            />
            <SummaryReadOnlyField
              label="Adults"
              value={String(eventDetails?.attendeesCount || "")}
            />
            <SummaryReadOnlyField
              label="Zip"
              value={readOnlyAddress?.zipCode}
            />
          </div>
        </div>
      </div>

      {/* ================= ITEMIZED FACILITIES & PRICING TABLE ================= */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Table Column Header */}
        <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between">
          <span
            className="text-base sm:text-lg font-bold"
            style={{ color: APP_COLORS.primary }}
          >
            Facilities
          </span>
          <span
            className="text-base sm:text-lg font-bold"
            style={{ color: APP_COLORS.primary }}
          >
            Price
          </span>
        </div>

        {/* Selected Facility Rental Rows */}
        <div className="divide-y divide-stone-200">
          {itemizedRentals.map((item) => {
            const start12 = formatTimeLabel(item.startTime);
            const end12 = formatTimeLabel(item.endTime);

            return (
              <div
                key={item.facilityId}
                className="px-5 py-4 flex items-start justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <p className="text-sm sm:text-base font-bold text-stone-900">
                    {item.serviceName}
                    {item.qty > 1 ? ` × ${item.qty}` : ""}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-stone-700">
                    Event Type: {item.refDataCode || "RENTALS"}
                  </p>
                  {(item.selectedTierKey || (start12 && end12)) && (
                    <p className="text-xs text-stone-500">
                      {item.selectedTierKey ? `${item.selectedTierKey}` : ""}
                      {item.selectedTierKey && start12 && end12 ? " • " : ""}
                      {start12 && end12 ? `${start12} - ${end12}` : ""}
                    </p>
                  )}
                  {item.lineDiscountTotal > 0 && (
                    <p className="text-xs font-semibold text-emerald-700">
                      Member Discount Applied: -$
                      {item.lineDiscountTotal.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  {item.lineDiscountTotal > 0 ? (
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-stone-400 line-through">
                        $ {item.lineOriginalTotal.toFixed(2)}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-stone-900">
                        $ {item.lineFinalTotal.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm sm:text-base font-bold text-stone-900">
                      $ {item.lineOriginalTotal.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Optional Priest Service Row (when Yes was selected in Step 1) */}
          {hasPriestService && (
            <div className="px-5 py-4 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm sm:text-base font-bold text-stone-900">
                  {eventDetails.selectedServiceName}
                </p>
                <p className="text-xs sm:text-sm font-medium text-stone-700">
                  Event Type: PRIEST SERVICE
                  {eventDetails.selectedPriestName
                    ? ` • Priest: ${eventDetails.selectedPriestName}`
                    : ""}
                </p>
              </div>
              <span className="text-sm sm:text-base font-bold text-stone-900">
                $ {Number(priestServiceAmount).toFixed(2)}
              </span>
            </div>
          )}

          {/* Subtotal Row */}
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm sm:text-base font-bold text-stone-900">
              Subtotal
            </span>
            <span className="text-sm sm:text-base font-bold text-stone-900">
              $ {Number(subtotal).toFixed(2)}
            </span>
          </div>

          {/* Membership Discount Row (Active Members) */}
          {isMemberActive && totalMembershipDiscount > 0 && (
            <div className="px-5 py-3.5 bg-emerald-50/70 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-emerald-800">
                Membership Discount
                {membershipStatusInfo?.membershipName
                  ? ` (${membershipStatusInfo.membershipName})`
                  : ""}
              </span>
              <span className="text-sm sm:text-base font-bold text-emerald-700">
                - $ {Number(totalMembershipDiscount).toFixed(2)}
              </span>
            </div>
          )}

          {/* Facility Security Amount Row + Non-Member Membership CTA */}
          <div className="px-5 py-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base font-bold text-stone-900">
                Facility Security Amount
              </span>
              <span className="text-sm sm:text-base font-bold text-stone-900">
                $ {Number(securityDepositAmount).toFixed(2)}
              </span>
            </div>

            {!isMemberActive && (
              <div>
                <Link
                  to="/membership"
                  className="inline-block text-xs sm:text-sm font-bold hover:underline"
                  style={{ color: APP_COLORS.primary }}
                >
                  ** Become an annual member to avail discounts? Click here **
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sale Total Shaded Bar */}
        <div className="px-5 py-4 bg-stone-200/90 border-t border-stone-300 flex items-center justify-between">
          <span className="text-base sm:text-lg font-bold text-stone-900">
            Sale Total
          </span>
          <span className="text-base sm:text-lg font-bold text-stone-900">
            $ {Number(saleTotal).toFixed(2)}
          </span>
        </div>
      </div>

      {/* ================= STEP 3 FOOTER NAVIGATION: PREVIOUS & BOOK NOW ================= */}
      <div className="pt-1 flex items-center justify-between">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onPrevious}
          className="px-6 py-2.5 rounded-md border border-stone-400 bg-white text-stone-800 text-xs sm:text-sm font-bold hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-60"
        >
          Previous
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={onSubmitRequest}
          className="px-7 py-2.5 rounded-md text-white text-xs sm:text-sm font-bold tracking-wide shadow-sm hover:opacity-95 transition-all cursor-pointer disabled:opacity-60"
          style={{ backgroundColor: APP_COLORS.primary }}
        >
          {isSubmitting ? "Submitting..." : "Book Now"}
        </button>
      </div>
    </div>
  );
};

export default FacilitySubmitRequestStep;
