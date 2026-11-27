import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  MapPin,
} from "lucide-react";
import { PREFERRED_LANGUAGES } from "../../../hooks/queries/Facilities/useFacilityForm";
import { CustomTimePicker } from "../../../components/ui/CustomTimePicker";
import { APP_COLORS } from "../../../constants/appColors";

const MONTH_NAMES = Object.freeze([
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]);

const WEEKDAY_LABELS = Object.freeze([
  "Su",
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
  "Sa",
]);

const formatMmDdYyyy = (dateObj) => {
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

const parseMmDdYyyy = (str) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(str || "").trim());
  if (!match) return null;
  const month = Number(match[1]) - 1;
  const day = Number(match[2]);
  const year = Number(match[3]);
  const dt = new Date(year, month, day, 0, 0, 0, 0);
  return dt.getMonth() === month && dt.getDate() === day ? dt : null;
};

const EventDatePopover = ({ value, onSelect, onClose }) => {
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const initialDate = useMemo(
    () => parseMmDdYyyy(value) || today,
    [value, today],
  );
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const selectedDate = useMemo(() => parseMmDdYyyy(value), [value]);

  const calendarCells = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push(new Date(viewYear, viewMonth, d, 0, 0, 0, 0));
    }
    return cells;
  }, [viewYear, viewMonth]);

  const isPrevMonthDisabled =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth <= today.getMonth());

  const handlePrevMonth = () => {
    if (isPrevMonthDisabled) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div
      className="absolute left-0 top-full mt-2 z-40 w-72 bg-white rounded-md shadow-2xl border border-stone-300 p-2 select-none"
      role="dialog"
      aria-label="Select Event Date"
    >
      <div
        className="flex items-center justify-between px-2 py-2 rounded-t text-white font-bold text-sm"
        style={{ backgroundColor: APP_COLORS.primary }}
      >
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={isPrevMonthDisabled}
          className={`w-7 h-7 rounded flex items-center justify-center transition-opacity ${
            isPrevMonthDisabled
              ? "bg-white/25 text-white/50 cursor-not-allowed"
              : "bg-white text-[#900000] hover:bg-stone-100 cursor-pointer"
          }`}
          aria-label="Previous Month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          className="w-7 h-7 rounded bg-white text-[#900000] hover:bg-stone-100 flex items-center justify-center cursor-pointer"
          aria-label="Next Month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center py-2 text-xs font-bold text-amber-500">
        {WEEKDAY_LABELS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
        {calendarCells.map((cellDate, index) => {
          if (!cellDate) {
            return <span key={`empty-${index}`} className="h-8" />;
          }

          const isPast = cellDate.getTime() < today.getTime();
          const isSelected =
            selectedDate && cellDate.getTime() === selectedDate.getTime();

          return (
            <button
              key={cellDate.toISOString()}
              type="button"
              disabled={isPast}
              onClick={() => {
                onSelect(formatMmDdYyyy(cellDate));
                onClose();
              }}
              className={`h-8 rounded transition-colors ${
                isPast
                  ? "bg-[#d9a7a7] text-white/90 cursor-not-allowed"
                  : isSelected
                    ? "bg-[#600000] text-white ring-2 ring-amber-400 cursor-pointer"
                    : "bg-[#900000] hover:bg-[#730000] text-white cursor-pointer"
              }`}
            >
              {cellDate.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const FloatingFieldset = ({
  label,
  required = false,
  error = "",
  children,
  className = "",
}) => {
  return (
    <div className={className}>
      <fieldset
        className={`relative rounded-md border px-3.5 pt-1.5 pb-2.5 transition-colors bg-white ${
          error
            ? "border-red-600 ring-1 ring-red-600/20"
            : "border-stone-700 focus-within:border-[#900000]"
        }`}
      >
        <legend className="px-1.5 text-xs font-semibold text-stone-800 leading-none">
          {label}
          {required && <span className="text-red-600 font-bold ml-0.5">*</span>}
        </legend>
        {children}
      </fieldset>
      {error && (
        <p className="mt-1 text-[11px] font-semibold text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export const FacilityEventDetailsStep = ({
  eventDetails,
  fieldErrors,
  readOnlyAddress,
  isAddressLoading,
  isPriestSectionActive,
  priestServices,
  isPriestServicesLoading,
  serviceTimeSlots,
  activeServiceTime24,
  availablePriests,
  isPriestsLoading,
  onUpdateField,
  onSelectPriestService,
  onSelectPreferredPriest,
  onSelectPriestChoice,
  onNext,
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const dateContainerRef = useRef(null);

  useEffect(() => {
    if (!isDatePickerOpen) return undefined;
    const handleOutsideClick = (e) => {
      if (
        dateContainerRef.current &&
        !dateContainerRef.current.contains(e.target)
      ) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isDatePickerOpen]);

  return (
    <fieldset className="rounded-xl border border-stone-800 bg-white p-4 sm:p-7 shadow-sm">
      <legend className="px-2 text-base sm:text-lg font-bold text-stone-900">
        Event Details
      </legend>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-1">
        {/* 1. Event Name * */}
        <FloatingFieldset
          label="Event Name"
          required
          error={fieldErrors.eventName}
        >
          <input
            type="text"
            value={eventDetails.eventName}
            onChange={(e) => onUpdateField("eventName", e.target.value)}
            placeholder="Enter Event Name"
            className="w-full text-sm font-medium text-[#900000] placeholder:text-[#900000]/80 bg-transparent outline-none py-0.5"
          />
        </FloatingFieldset>

        {/* 2. Event Date * (Custom Calendar Popover) */}
        <div ref={dateContainerRef} className="relative">
          <FloatingFieldset
            label="Event Date"
            required
            error={fieldErrors.eventDate}
          >
            <div className="flex items-center gap-2.5 py-0.5">
              <button
                type="button"
                onClick={() => setIsDatePickerOpen((prev) => !prev)}
                className="text-stone-800 hover:text-[#900000] focus:outline-none cursor-pointer"
                aria-label="Open Event Date Calendar"
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
              <input
                type="text"
                readOnly
                value={eventDetails.eventDate}
                onClick={() => setIsDatePickerOpen((prev) => !prev)}
                placeholder="MM/DD/YYYY"
                className="w-full text-sm font-medium text-[#900000] placeholder:text-[#900000]/85 bg-transparent outline-none cursor-pointer"
              />
            </div>
          </FloatingFieldset>

          {isDatePickerOpen && (
            <EventDatePopover
              value={eventDetails.eventDate}
              onSelect={(formattedDate) =>
                onUpdateField("eventDate", formattedDate)
              }
              onClose={() => setIsDatePickerOpen(false)}
            />
          )}
        </div>

        {/* 3. Event Time * (Reusable CustomTimePicker) */}
        <FloatingFieldset
          label="Event Time"
          required
          error={fieldErrors.eventTime}
        >
          <CustomTimePicker
            value={eventDetails.eventTime}
            onChange={(time24) => onUpdateField("eventTime", time24)}
            disablePastForDate={eventDetails.eventDate}
            placeholder="00:00"
            ariaLabel="Select Event Time"
          />
        </FloatingFieldset>

        {/* 4. Preferred Language */}
        <FloatingFieldset label="Preferred Language">
          <div className="relative flex items-center">
            <select
              value={eventDetails.preferredLanguage}
              onChange={(e) =>
                onUpdateField("preferredLanguage", e.target.value)
              }
              className="w-full appearance-none text-sm font-medium text-stone-800 bg-white border border-stone-400 rounded px-3 py-1.5 pr-8 outline-none focus:border-[#900000] cursor-pointer"
            >
              <option value="">Select Preferred Language</option>
              {PREFERRED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-stone-600 pointer-events-none absolute right-2.5" />
          </div>
        </FloatingFieldset>

        {/* 5. Estimated Number of Attendees * */}
        <FloatingFieldset
          label="Estimated Number of Attendees"
          required
          error={fieldErrors.attendeesCount}
        >
          <input
            type="number"
            min="1"
            step="1"
            value={eventDetails.attendeesCount}
            onChange={(e) => onUpdateField("attendeesCount", e.target.value)}
            placeholder="No of Attendees"
            className="w-full text-sm font-medium text-[#900000] placeholder:text-[#900000]/80 bg-transparent outline-none py-0.5"
          />
        </FloatingFieldset>

        {/* 6. Street Address (Read-only from getclientInfoById) */}
        <FloatingFieldset label="Street Address">
          <div className="flex items-center gap-2 py-0.5">
            <MapPin className="w-4 h-4 text-stone-800 flex-shrink-0" />
            {isAddressLoading ? (
              <span className="text-xs text-stone-400 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading...
              </span>
            ) : (
              <input
                type="text"
                readOnly
                value={readOnlyAddress.streetAddress}
                aria-readonly="true"
                className="w-full text-sm font-medium text-stone-900 bg-transparent outline-none cursor-default"
              />
            )}
          </div>
        </FloatingFieldset>

        {/* 7. State (Read-only from getclientInfoById) */}
        <FloatingFieldset label="State">
          <input
            type="text"
            readOnly
            value={isAddressLoading ? "" : readOnlyAddress.state}
            aria-readonly="true"
            className="w-full text-sm font-medium text-stone-900 bg-transparent outline-none py-0.5 cursor-default"
          />
        </FloatingFieldset>

        {/* 8. City (Read-only from getclientInfoById) */}
        <FloatingFieldset label="City">
          <input
            type="text"
            readOnly
            value={isAddressLoading ? "" : readOnlyAddress.city}
            aria-readonly="true"
            className="w-full text-sm font-medium text-stone-900 bg-transparent outline-none py-0.5 cursor-default"
          />
        </FloatingFieldset>

        {/* 9. Zip Code (Read-only from getclientInfoById) */}
        <FloatingFieldset label="Zip Code">
          <div className="flex items-center gap-2 py-0.5">
            <FileText className="w-4 h-4 text-stone-800 flex-shrink-0" />
            <input
              type="text"
              readOnly
              value={isAddressLoading ? "" : readOnlyAddress.zipCode}
              aria-readonly="true"
              className="w-full text-sm font-medium text-stone-900 bg-transparent outline-none cursor-default"
            />
          </div>
        </FloatingFieldset>
      </div>

      {/* 10. Event Description (Full Width) */}
      <div className="mt-4">
        <FloatingFieldset label="Event Description">
          <div className="flex items-start gap-2 pt-0.5">
            <FileText className="w-4 h-4 text-stone-800 mt-0.5 flex-shrink-0" />
            <textarea
              rows={2}
              value={eventDetails.eventDescription}
              onChange={(e) =>
                onUpdateField("eventDescription", e.target.value)
              }
              placeholder="Enter Event Description"
              className="w-full text-sm font-medium text-[#900000] placeholder:text-[#900000]/80 bg-transparent outline-none resize-y"
            />
          </div>
        </FloatingFieldset>
      </div>

      {/* 11. Priest Services Question (Yes / No) */}
      <div className="mt-5">
        <p className="text-sm sm:text-base font-bold text-stone-900">
          Would you like to add Priest Services to your Facility Booking?
        </p>

        <div className="flex items-center gap-6 mt-2.5">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={eventDetails.addPriestServices === "YES"}
              onChange={() => onSelectPriestChoice("YES")}
              className="w-5 h-5 rounded border-2 border-amber-400 text-[#900000] focus:ring-[#900000] cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-semibold text-stone-800">
              Yes
            </span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={eventDetails.addPriestServices === "NO"}
              onChange={() => onSelectPriestChoice("NO")}
              className="w-5 h-5 rounded border-2 border-amber-400 text-[#900000] focus:ring-[#900000] cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-semibold text-stone-800">
              No
            </span>
          </label>
        </div>

        {fieldErrors.addPriestServices && (
          <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{fieldErrors.addPriestServices}</span>
          </p>
        )}

        {/* Conditional Priest Services Form */}
        {isPriestSectionActive && (
          <div className="mt-5 pt-4 border-t border-stone-200 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            {/* 1. Service * Dropdown */}
            <FloatingFieldset
              label="Service"
              required
              error={fieldErrors.selectedServiceId}
            >
              <div className="relative flex items-center py-0.5">
                <select
                  value={eventDetails.selectedServiceId}
                  disabled={isPriestServicesLoading}
                  onChange={(e) => onSelectPriestService(e.target.value)}
                  className="w-full appearance-none text-sm font-medium text-stone-900 bg-transparent pr-7 outline-none cursor-pointer disabled:opacity-60"
                >
                  <option value="">
                    {isPriestServicesLoading
                      ? "Loading Services..."
                      : "Select Service"}
                  </option>
                  {priestServices.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.refDataName} (${srv.serviceAmount})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-stone-600 pointer-events-none absolute right-1" />
              </div>
            </FloatingFieldset>

            {/* 2. Service Amount * (Read-only) */}
            <div>
              <fieldset
                className={`relative rounded-md border px-3.5 pt-1.5 pb-2.5 transition-colors bg-stone-200/80 ${
                  fieldErrors.serviceAmount
                    ? "border-red-600 ring-1 ring-red-600/20"
                    : "border-stone-700"
                }`}
              >
                <legend className="px-1.5 text-xs font-semibold text-stone-800 leading-none">
                  Service Amount
                  <span className="text-red-600 font-bold ml-0.5">*</span>
                </legend>
                <input
                  type="text"
                  readOnly
                  aria-readonly="true"
                  value={
                    eventDetails.serviceAmount
                      ? `$ ${eventDetails.serviceAmount}`
                      : ""
                  }
                  placeholder="Service Amount*"
                  className="w-full text-sm font-semibold text-stone-900 placeholder:text-[#900000] bg-transparent outline-none py-0.5 cursor-default"
                />
              </fieldset>
              {fieldErrors.serviceAmount && (
                <p className="mt-1 text-[11px] font-semibold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.serviceAmount}</span>
                </p>
              )}
            </div>

            {/* 3. Service Time * Dropdown */}
            <FloatingFieldset
              label="Service Time"
              required
              error={fieldErrors.serviceTime}
            >
              <div className="relative flex items-center gap-2 py-0.5">
                <Clock className="w-4 h-4 text-stone-800 flex-shrink-0" />
                <select
                  value={activeServiceTime24}
                  onChange={(e) => onUpdateField("serviceTime", e.target.value)}
                  className="w-full appearance-none text-sm font-medium text-stone-900 bg-transparent pr-7 outline-none cursor-pointer"
                >
                  {serviceTimeSlots.length === 0 ? (
                    <option value="">Select Event Time First</option>
                  ) : (
                    serviceTimeSlots.map((slot) => (
                      <option key={slot.value24} value={slot.value24}>
                        {slot.label12}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="w-4 h-4 text-stone-600 pointer-events-none absolute right-1" />
              </div>
            </FloatingFieldset>

            {/* 4. Priests * Dropdown */}
            <FloatingFieldset
              label="Priests"
              required
              error={fieldErrors.selectedPriestId}
            >
              <div className="relative flex items-center py-0.5">
                <select
                  value={eventDetails.selectedPriestId}
                  disabled={isPriestsLoading}
                  onChange={(e) => onSelectPreferredPriest(e.target.value)}
                  className="w-full appearance-none text-sm font-medium text-stone-900 bg-transparent pr-7 outline-none cursor-pointer disabled:opacity-60"
                >
                  <option value="">
                    {isPriestsLoading
                      ? "Checking Priest Availability..."
                      : "Select Preferred Priest"}
                  </option>
                  {availablePriests.map((priest) => (
                    <option
                      key={priest.id}
                      value={priest.id}
                      disabled={!priest.isAvailable}
                    >
                      {priest.refDataName}
                      {!priest.isAvailable ? ` (${priest.availability})` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-stone-600 pointer-events-none absolute right-1" />
              </div>
            </FloatingFieldset>
          </div>
        )}
      </div>

      {/* Next Button */}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="px-7 py-2.5 rounded-md text-white text-xs sm:text-sm font-bold tracking-wide shadow-sm hover:opacity-95 transition-all cursor-pointer"
          style={{ backgroundColor: APP_COLORS.primary }}
        >
          Next
        </button>
      </div>
    </fieldset>
  );
};

export default FacilityEventDetailsStep;
