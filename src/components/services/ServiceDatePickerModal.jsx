import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { formatSlashDate } from '../../utils/serviceDateUtils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Standard Month-by-Month Calendar Picker View (bookingLimitPerDay == 0)
const CalendarPickerView = ({ availableDates = [], onSelectDate, primaryColor = '#900000' }) => {
  const [viewDate, setViewDate] = useState(() => {
    if (availableDates.length > 0 && availableDates[0] instanceof Date) {
      return new Date(availableDates[0]);
    }
    return new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const availableDateTimestamps = useMemo(() => {
    return new Set(
      availableDates
        .filter((d) => d instanceof Date && !isNaN(d.getTime()))
        .map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime())
    );
  }, [availableDates]);

  const daysCount = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysCount }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="w-full">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
          aria-label="Previous Month"
        >
          ‹
        </button>
        <span className="text-sm sm:text-base font-bold text-gray-800">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
          aria-label="Next Month"
        >
          ›
        </button>
      </div>

      {/* Weekday Row */}
      <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-gray-400">
        {WEEKDAY_NAMES.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day Cells Grid */}
      <div className="grid grid-cols-7 gap-1">
        {blankDays.map((_, idx) => (
          <div key={`blank-${idx}`} className="h-9 w-9" />
        ))}
        {days.map((day) => {
          const currentMidnight = new Date(year, month, day).getTime();
          const isSelectable = availableDateTimestamps.has(currentMidnight);

          return (
            <button
              key={`day-${day}`}
              type="button"
              disabled={!isSelectable}
              onClick={() => onSelectDate(new Date(year, month, day))}
              className={`h-9 w-9 mx-auto rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all ${
                isSelectable
                  ? 'text-gray-800 hover:text-white cursor-pointer active:scale-95'
                  : 'text-gray-300 cursor-not-allowed opacity-30 select-none'
              }`}
              style={{
                backgroundColor: isSelectable ? undefined : undefined,
              }}
              onMouseEnter={(e) => {
                if (isSelectable) e.currentTarget.style.backgroundColor = primaryColor;
              }}
              onMouseLeave={(e) => {
                if (isSelectable) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

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

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
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
              {isCustomSlot ? 'Service Availability' : 'Select Service Date'}
            </p>
            <h3
              id="service-date-picker-title"
              className="text-lg font-bold text-[#900000] truncate max-w-xs sm:max-w-sm"
            >
              {serviceTitle || 'Temple Service'}
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close date picker"
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#900000] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Occurrences Banner */}
        {occurrencesNotice && (
          <div className="my-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium flex items-center gap-2">
            <span>ℹ️</span>
            <span>{occurrencesNotice}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="py-3 flex-1 overflow-y-auto min-h-[160px]">
          {!availableDates || availableDates.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <span className="text-3xl mb-2">📅</span>
              <p className="text-gray-600 text-sm font-semibold">
                No available slots right now.
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Please check back later or contact the temple desk.
              </p>
            </div>
          ) : isCustomSlot ? (
            /* Custom Slot List View (Rule #9 when bookingLimitPerDay > 0) */
            <ul className="flex flex-col gap-2 p-0 m-0 list-none" role="listbox">
              {availableDates.map((date, idx) => {
                if (!(date instanceof Date) || isNaN(date.getTime())) return null;

                const formatted = formatSlashDate(date);
                const dayName = (() => {
                  try {
                    return date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  } catch {
                    return formatted;
                  }
                })();

                const booked = availabilityMap[formatted] || 0;
                const remaining = Math.max(0, Number(bookingLimitPerDay) - booked);
                const isBookable = remaining > 0;

                return (
                  <li key={`${formatted}-${idx}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      disabled={!isBookable}
                      onClick={() => onSelectDate(date)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left focus:outline-none focus:ring-2 focus:ring-[#900000] ${
                        isBookable
                          ? 'border-gray-200 hover:border-[#900000] hover:bg-red-50/40 cursor-pointer active:scale-[0.99]'
                          : 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed select-none'
                      }`}
                    >
                      <span className="font-semibold text-gray-800 text-sm">
                        {dayName}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold tracking-wide ${
                          isBookable
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}
                      >
                        {isBookable ? `${remaining} Slots Left` : 'Fully Booked'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            /* Standard Month Calendar View ( bookingLimitPerDay == 0) */
            <CalendarPickerView
              availableDates={availableDates}
              onSelectDate={onSelectDate}
              primaryColor="#900000"
            />
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors focus:outline-none cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};



