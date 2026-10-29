import { useEffect, useRef, useCallback, useMemo } from "react";
import { formatSlashDate } from "../../utils/serviceDateUtils";

export const ServiceDatePickerModal = ({
  isOpen,
  onClose,
  serviceTitle,
  availableDates = [],
  bookingLimitPerDay = 0,
  availabilityMap = {},
  serviceOccurrencesNo = 1,
  onSelectDate,
}) => {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const isCustomSlot = Number(bookingLimitPerDay) > 0;

  // Consecutive occurrences notice
  const occurrencesNotice = useMemo(() => {
    const occ = parseInt(serviceOccurrencesNo, 10) || 1;
    if (occ > 1) {
      return `Selecting a date will automatically book ${occ} consecutive recurring occurrences.`;
    }
    return null;
  }, [serviceOccurrencesNo]);

  // Handle ESC key dismiss
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  // Focus trap & body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-date-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      {/* Backdrop click dismiss */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col max-h-[85vh] border border-gray-100 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="pr-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Service Availability
            </p>
            <h3
              id="service-date-picker-title"
              className="text-lg font-bold text-[#800000] truncate max-w-xs sm:max-w-sm"
            >
              {serviceTitle || "Temple Service"}
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close date picker"
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#800000]"
          >
            ✕
          </button>
        </div>

        {/* Rule #13 Occurrences Banner */}
        {occurrencesNotice && (
          <div className="my-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium flex items-center gap-2">
            <span>ℹ️</span>
            <span>{occurrencesNotice}</span>
          </div>
        )}

        {/* Content Section: Slot / Date List */}
        <div className="py-3 flex-1 overflow-y-auto min-h-[160px]">
          {!availableDates || availableDates.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <span className="text-3xl mb-2">📅</span>
              <p className="text-gray-500 text-sm font-medium">
                No available dates or slots found for this service.
              </p>
            </div>
          ) : (
            <ul
              className="flex flex-col gap-2 p-0 m-0 list-none"
              role="listbox"
            >
              {availableDates.map((date, idx) => {
                if (!(date instanceof Date) || isNaN(date.getTime())) {
                  return null;
                }

                const formatted = formatSlashDate(date);
                const dayName = (() => {
                  try {
                    return date.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  } catch {
                    return formatted;
                  }
                })();

                let remaining = null;
                let isBookable = true;

                // Daily limit quota math
                if (isCustomSlot) {
                  const booked = availabilityMap[formatted] || 0;
                  remaining = Math.max(0, Number(bookingLimitPerDay) - booked);
                  isBookable = remaining > 0;
                }

                return (
                  <li key={`${formatted}-${idx}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      disabled={!isBookable}
                      onClick={() => onSelectDate(date)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left focus:outline-none focus:ring-2 focus:ring-[#800000] ${
                        isBookable
                          ? "border-gray-200 hover:border-[#800000] hover:bg-red-50/40 cursor-pointer active:scale-[0.99]"
                          : "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed select-none"
                      }`}
                    >
                      <span className="font-semibold text-gray-800 text-sm">
                        {dayName}
                      </span>

                      {isCustomSlot && (
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold tracking-wide ${
                            isBookable
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-red-100 text-red-700 border border-red-200"
                          }`}
                        >
                          {isBookable
                            ? `${remaining} ${remaining === 1 ? "Slot" : "Slots"} Left`
                            : "Fully Booked"}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


