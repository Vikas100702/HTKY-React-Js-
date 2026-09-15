/**
 * @file src/pages/Donation/components/DonationSlotModal.jsx
 * @description 100% Pure Presentational Modal Component for Date & Time slot selection.
 * Adheres strictly to responsive web standards, mobile touch constraints, ARIA accessibility,
 * and memory-safe window event disposal.
 */

import { useEffect, useMemo, useCallback } from "react";

// Pre-calculated operating hour slots (09:00 AM to 09:00 PM) at 30-minute intervals
const OPERATING_TIME_SLOTS = Object.freeze([
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
  "06:00 PM",
  "06:30 PM",
  "07:00 PM",
  "07:30 PM",
  "08:00 PM",
  "08:30 PM",
  "09:00 PM",
]);

export const DonationSlotModal = ({
  dateModal,
  timeModal,
  onCloseDate,
  onSelectDate,
  onCloseTime,
  onSelectTime,
  getRemainingSlots,
  primaryColor = "#900000",
}) => {
  const isAnyModalOpen = dateModal?.isOpen || timeModal?.isOpen;

  // --------------------------------------------------------------------------
  // DOM & MEMORY RESILIENCE: Viewport Scroll Lock & Keyboard Handling
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isAnyModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (dateModal?.isOpen) onCloseDate();
        if (timeModal?.isOpen) onCloseTime();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isAnyModalOpen,
    dateModal?.isOpen,
    timeModal?.isOpen,
    onCloseDate,
    onCloseTime,
  ]);

  // Format human-readable date strings
  const formatDateLabel = useCallback((date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  // Format occurrence note helper
  const occurrencesNotice = useMemo(() => {
    const occ = parseInt(dateModal?.item?.serviceOccurrencesNo, 10) || 1;
    if (occ > 1) {
      return `Selecting a start date will automatically reserve ${occ} consecutive recurring service occurrences.`;
    }
    return null;
  }, [dateModal?.item?.serviceOccurrencesNo]);

  if (!isAnyModalOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* ==================================================================== */}
      {/* 1. DATE SELECTION DIALOG                                             */}
      {/* ==================================================================== */}
      {dateModal?.isOpen && (
        <div
          className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
          aria-labelledby="date-dialog-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div>
              <h3
                id="date-dialog-title"
                className="text-base sm:text-lg font-bold text-gray-900 font-serif"
              >
                Select Service Date
              </h3>
              <p className="text-xs text-gray-500 truncate max-w-[280px] sm:max-w-sm mt-0.5">
                {dateModal?.item?.refDataName || "Donation Service"}
              </p>
            </div>
            <button
              type="button"
              onClick={onCloseDate}
              aria-label="Close date modal"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Subtitle / Occurrence Notice */}
          {occurrencesNotice && (
            <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-100 text-amber-800 text-xs font-medium flex items-center gap-2">
              <svg
                className="w-4 h-4 text-amber-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{occurrencesNotice}</span>
            </div>
          )}

          {/* Available Dates List */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 max-h-[60vh]">
            {!dateModal.availableDates ||
            dateModal.availableDates.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p className="text-sm font-medium">
                  No available dates found for this service.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Please check back later or contact the temple desk.
                </p>
              </div>
            ) : (
              dateModal.availableDates.map((dateObj, idx) => {
                const remainingSlots =
                  dateModal.isCustomSlot && getRemainingSlots
                    ? getRemainingSlots(
                        dateObj,
                        dateModal.item?.bookingLimitPerDay,
                      )
                    : null;

                const isFullyBooked =
                  remainingSlots !== null && remainingSlots <= 0;

                return (
                  <button
                    key={`${dateObj.toISOString()}-${idx}`}
                    type="button"
                    disabled={isFullyBooked}
                    onClick={() => onSelectDate(dateObj)}
                    className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-150 ${
                      isFullyBooked
                        ? "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                        : "bg-white border-gray-200 hover:border-red-300 hover:bg-red-50/20 active:scale-[0.99] cursor-pointer shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{
                          backgroundColor: isFullyBooked
                            ? "#9ca3af"
                            : primaryColor,
                        }}
                      >
                        {dateObj.getDate()}
                      </div>
                      <span className="text-sm sm:text-base font-semibold text-gray-800">
                        {formatDateLabel(dateObj)}
                      </span>
                    </div>

                    {/* Slot badge indicator */}
                    {dateModal.isCustomSlot && (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          isFullyBooked
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isFullyBooked
                          ? "Fully Booked"
                          : `${remainingSlots} Slots Left`}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button
              type="button"
              onClick={onCloseDate}
              className="px-5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-200/60 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. TIME SELECTION DIALOG                                             */}
      {/* ==================================================================== */}
      {timeModal?.isOpen && (
        <div
          className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
          aria-labelledby="time-dialog-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div>
              <h3
                id="time-dialog-title"
                className="text-base sm:text-lg font-bold text-gray-900 font-serif"
              >
                Select Service Time
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Operating Hours: 09:00 AM – 09:00 PM
              </p>
            </div>
            <button
              type="button"
              onClick={onCloseTime}
              aria-label="Close time modal"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Time Slots Grid */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {OPERATING_TIME_SLOTS.map((slotTime) => (
                <button
                  key={slotTime}
                  type="button"
                  onClick={() => onSelectTime(slotTime)}
                  className="py-2.5 px-3 rounded-xl border border-gray-200 bg-gray-50/50 text-xs sm:text-sm font-semibold text-gray-800 hover:border-red-300 hover:bg-red-50 hover:text-red-900 transition-all duration-150 active:scale-95 text-center focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  {slotTime}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button
              type="button"
              onClick={onCloseTime}
              className="px-5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-200/60 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
