import {useState, useEffect, useMemo, useCallback } from "react";

const formatTo12Hour = (time24) =>{
  if(!time24 || !time24.includes(':')) return '' ;
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr.padStart(2, 0);
  const period = h >= 12 ? 'PM' : 'AM';

  if(h === 0) h = 12;
  else if(h > 12) h -= 12;

  return `${String(h).padStart(2, 0)}:${m} ${period}`;
};

const normalizeDateEntry = (item) => {
  if(!item) return { date: null, paksha: '', tithiDesc: ''};
  if(item instanceof Date) return { date: item, paksha: "", tithiDesc: "" };

  const date = item?.date instanceof Date ? item?.date : item?.date ? new Date(item.date) : null;
  return {
    date: date && !NaN(date.getTime()) ? date : null,
    paksha: item?.paksha || '',
    tithiDesc: item?.tithiDesc || ''
  };
};

export const DonationSlotModal = ({
  dateModal,
  timeModal,
  isTithiLoading = false,
  onCloseDate,
  onSelectDate,
  onCloseTime,
  onSelectTime,
  getRemainingSlots,
  primaryColor = "#900000",
}) => {
  const isAnyModalOpen = Boolean(dateModal?.isOpen || timeModal?.isOpen);

  const [nativeTime, setNativeTime] = useState("09:00");

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

  const formatDateLabel = useCallback((date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const occurrencesNotice = useMemo(() => {
    const occ = parseInt(dateModal?.item?.serviceOccurrencesNo, 10) || 1;
    if (occ > 1) {
      return `Selecting a start date will automatically reserve ${occ} consecutive recurring service occurrences.`;
    }
    return null;
  }, [dateModal?.item?.serviceOccurrencesNo]);

  const handleConfirmTime = () => {
    const formatted = formatTo12Hour(nativeTime);
    onSelectTime(formatted);
  };

  if (!isAnyModalOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* 1. DATE SELECTION DIALOG */}
      {dateModal?.isOpen && (
        <div
          className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
          aria-labelledby="date-dialog-title"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="date-dialog-title"
                  className="text-base sm:text-lg font-bold text-gray-900 font-serif"
                >
                  Select Service Date
                </h3>
                {dateModal?.tithiKeyword && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    {dateModal.tithiKeyword} Tithi
                  </span>
                )}
              </div>
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

          {occurrencesNotice && (
            <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-100 text-amber-800 text-xs font-medium flex items-center gap-2">
              <svg
                className="w-4 h-4 text-amber-600 shrink-0"
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

          <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 max-h-[60vh]">
            {isTithiLoading ? (
              <div className="space-y-3 py-4">
                <div className="flex items-center justify-center gap-2 text-amber-800 text-xs font-semibold pb-2">
                  <svg
                    className="w-4 h-4 animate-spin text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  <span>Calculating Lunar Panchangam Dates...</span>
                </div>
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="w-full h-14 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : !dateModal.availableDates ||
              dateModal.availableDates.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-amber-700 font-serif text-lg font-bold mb-2">
                  ॐ
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  No available dates found
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                  There are no active dates or upcoming Tithi occurrences for
                  this service within the booking window.
                </p>
              </div>
            ) : (
              dateModal.availableDates.map((rawEntry, idx) => {
                const {
                  date: dateObj,
                  paksha,
                  tithiDesc,
                } = normalizeDateEntry(rawEntry);
                if (!dateObj) return null;

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
                    className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-xl border text-left transition-all duration-150 ${
                      isFullyBooked
                        ? "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                        : "bg-white border-gray-200 hover:border-red-300 hover:bg-red-50/20 active:scale-[0.99] cursor-pointer shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                        style={{
                          backgroundColor: isFullyBooked
                            ? "#9ca3af"
                            : primaryColor,
                        }}
                      >
                        {dateObj.getDate()}
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-semibold text-gray-800 leading-snug">
                          {formatDateLabel(dateObj)}
                        </div>

                        {(paksha || tithiDesc) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {paksha && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-purple-50 text-purple-700 border border-purple-200">
                                {paksha}
                              </span>
                            )}
                            {tithiDesc && (
                              <span className="text-[10px] font-medium text-gray-500">
                                {tithiDesc}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {dateModal.isCustomSlot && (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ml-2 ${
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

      {/* 2. TIME SELECTION DIALOG */}
      {timeModal?.isOpen && (
        <div
          className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          aria-labelledby="time-dialog-title"
        >
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

          {/* Clock Picker Input */}
          <div className="p-6 text-center">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Pick Time From Clock
            </label>

            <div className="inline-flex items-center justify-center p-3 bg-gray-50 rounded-2xl border border-gray-200 shadow-inner">
              <input
                type="time"
                min="09:00"
                max="21:00"
                value={nativeTime}
                onChange={(e) => setNativeTime(e.target.value)}
                className="text-2xl sm:text-3xl font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>

            <p className="text-xs text-gray-500 mt-3 font-medium">
              Selected:{" "}
              <span className="text-[#900000] font-bold">
                {formatTo12Hour(nativeTime)}
              </span>
            </p>
          </div>

          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCloseTime}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-200/60 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmTime}
              className="px-5 py-2 text-xs font-bold text-white rounded-lg transition-all shadow-xs hover:opacity-95 active:scale-95 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              Confirm Time
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
