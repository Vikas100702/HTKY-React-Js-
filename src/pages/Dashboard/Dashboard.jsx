import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CreditCard,
  Flame,
  HandHeart,
  Repeat,
  Sparkles,
} from "lucide-react";
import { useDashboard } from "../../hooks/queries/Dashboard/useDashboard";
import { DashboardSummaryCard } from "../../components/dashboard/DashboardSummaryCard";
import { APP_COLORS } from "../../constants/appColors";
import membershipImage from "../../assets/membership.png";

export const Dashboard = () => {
  const navigate = useNavigate();
  const {
    membership,
    pujaBookingsSummary,
    donationsSummary,
    sponsorsSummary,
    paymentsSummary,
    recurringDonationsSummary,
    isLoading,
    isError,
  } = useDashboard();

  if (isLoading) {
    return (
      <div
        className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8 shadow-sm animate-pulse space-y-6"
        aria-busy="true"
        aria-label="Loading Devotee Dashboard"
      >
        <div className="h-6 bg-stone-200 rounded w-2/3" />
        <div className="h-12 bg-emerald-50 rounded-xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="h-44 bg-stone-100 rounded-xl" />
          <div className="md:col-span-2 h-44 bg-stone-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const hasLeftBadgeColumn = Boolean(
    membership.membershipName || membership.membershipType,
  );
  const hasRightDetailsRows = Boolean(
    membership.hasStatus || membership.hasStartDate || membership.hasExpiryDate,
  );

  return (
    <div className="w-full space-y-6">
      <section
        aria-labelledby="dashboard-greeting-heading"
        className="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-5 sm:p-7 space-y-6"
      >
        {/* Welcome Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
          <h1
            id="dashboard-greeting-heading"
            className="text-lg sm:text-xl md:text-xl font-serif font-bold tracking-wide"
            style={{ color: APP_COLORS.primary }}
          >
            Namaskaram {membership.fullName}, Welcome To The Devotee Dashboard
          </h1>
        </div>

        {/* Non-Blocking API Fallback Alert */}
        {isError && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Unable to refresh latest membership details. Showing cached
              session info.
            </span>
          </div>
        )}

        {/* Lifetime Membership Accumulated Banner */}
        <div
          role="status"
          aria-live="polite"
          className="w-full rounded-xl bg-emerald-100/90 border border-emerald-200 px-4 py-3 flex items-center justify-center gap-2.5 text-center shadow-2xs"
        >
          <img
            src={membershipImage}
            alt="Lifetime Membership Medal"
            className="w-6 h-6 object-contain shrink-0"
          />
          <p className="text-xs sm:text-sm font-bold text-[#900000]">
            Your total transactions accumulated towards Lifetime Membership with
            HTKY so far is{" "}
            <span className="font-extrabold">
              $ {membership.accumulatedAmount}
            </span>
          </p>
        </div>

        {/* Membership Details Card */}
        {membership.hasMembershipCardData ? (
          <div className="rounded-2xl border border-stone-200/90 bg-gradient-to-br from-white via-[#fdfbf8] to-[#f8f4ec] p-5 sm:p-7 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: Membership Medal Badge (Rendered only if plan name/type exists) */}
              {hasLeftBadgeColumn && (
                <div
                  className={`${
                    hasRightDetailsRows || !membership.isActive
                      ? "md:col-span-4 md:border-r md:border-stone-200/80 md:pr-6"
                      : "md:col-span-12"
                  } flex flex-col items-center justify-center text-center`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <img
                      src={membershipImage}
                      alt={membership.membershipName || "Temple Membership"}
                      className="w-20 h-20 object-contain drop-shadow-xs"
                    />
                  </div>
                  {membership.membershipName && (
                    <h2 className="text-base sm:text-lg font-bold text-stone-800 uppercase tracking-wide leading-snug">
                      {membership.membershipName}
                    </h2>
                  )}
                  {membership.membershipType && (
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-widest mt-1">
                      {membership.membershipType}
                    </span>
                  )}
                </div>
              )}

              {/* Right Column: Non-Blank Membership Status Rows & Non-Active CTA */}
              {(hasRightDetailsRows || !membership.isActive) && (
                <div
                  className={`${
                    hasLeftBadgeColumn ? "md:col-span-8" : "md:col-span-12"
                  } space-y-4`}
                >
                  {hasRightDetailsRows && (
                    <div className="divide-y divide-stone-200/80 border-t border-b border-stone-200/80 text-xs sm:text-sm">
                      {membership.hasStatus && (
                        <div className="py-3 px-2 flex items-center justify-between gap-4">
                          <span className="font-bold text-stone-700">
                            Membership Status
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider text-white shadow-2xs ${
                              membership.isActive
                                ? "bg-emerald-600"
                                : "bg-amber-600"
                            }`}
                          >
                            {membership.membershipStatus}
                          </span>
                        </div>
                      )}

                      {membership.hasStartDate && (
                        <div className="py-3 px-2 flex items-center justify-between gap-4">
                          <span className="font-bold text-stone-700">
                            Membership Start Date
                          </span>
                          <span className="font-semibold text-stone-800">
                            {membership.membershipStartDate}
                          </span>
                        </div>
                      )}

                      {membership.hasExpiryDate && (
                        <div className="py-3 px-2 flex items-center justify-between gap-4">
                          <span className="font-bold text-stone-700">
                            Membership Expiry Date
                          </span>
                          <span className="font-semibold text-stone-800">
                            {membership.memberShipExpiryDate}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show Renew / Enroll CTA strictly when membership is NOT ACTIVE */}
                  {!membership.isActive && (
                    <div className="pt-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => navigate("/membership")}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer"
                      >
                        {membership.hasStatus ? "RENEW NOW" : "BECOME A MEMBER"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Clean Non-Member State (No Blank Rows) */
          <div className="rounded-2xl border border-stone-200/90 bg-gradient-to-br from-white via-[#fdfbf8] to-[#f8f4ec] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <img
                src={membershipImage}
                alt="Temple Membership"
                className="w-16 h-16 object-contain shrink-0"
              />
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                  Become an HTKY Temple Member
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                  Enjoy member discounts on priestly services, hall rentals, and
                  special temple gatherings.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/membership")}
              className="bg-[#900000] hover:bg-[#780000] text-amber-200 text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
            >
              Explore Memberships
            </button>
          </div>
        )}

        {/* Devotee Activity Summary Cards Grid */}
        <div aria-label="Devotee Activity Overview" className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-serif font-bold text-stone-800 tracking-wide">
              Your Activity Overview
            </h2>
            <span className="text-[11px] font-semibold text-stone-500">
              Current Month Summary
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <DashboardSummaryCard
              title="My Puja Bookings"
              count={pujaBookingsSummary.formattedCount}
              subtitle="This Month"
              icon={Flame}
              variant="crimson"
              isLoading={pujaBookingsSummary.isLoading}
              actionLabel="View All"
              onAction={() => navigate("/account/puja-bookings")}
            />

            <DashboardSummaryCard
              title="My Donations"
              count={donationsSummary.formattedCount}
              subtitle="This Month"
              icon={HandHeart}
              variant="amber"
              isLoading={donationsSummary.isLoading}
              actionLabel="View All"
              onAction={() => navigate("/account/donations")}
            />

            <DashboardSummaryCard
              title="My Sponsors"
              count={sponsorsSummary.formattedCount}
              subtitle="This Month"
              icon={Sparkles}
              variant="saffron"
              isLoading={sponsorsSummary.isLoading}
              actionLabel="View All"
              onAction={() => navigate("/account/sponsors")}
            />

            <DashboardSummaryCard
              title="My Payments"
              count={paymentsSummary.formattedCount}
              subtitle="All Transactions"
              icon={CreditCard}
              variant="crimson"
              isLoading={paymentsSummary.isLoading}
              actionLabel="View All"
              onAction={() => navigate("/account/payments")}
            />

            <DashboardSummaryCard
              title="Recurring Donations"
              count={recurringDonationsSummary.formattedCount}
              subtitle="Auto-Debit Plans"
              icon={Repeat}
              variant="amber"
              isLoading={recurringDonationsSummary.isLoading}
              actionLabel="View All"
              onAction={() => navigate("/account/recurring-donations")}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
