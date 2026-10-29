import { useState, useEffect, useRef, useCallback } from "react";

export const ServiceTimePickerModal = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectTime,
}) => {
  const [timeVal, setTimeVal] = useState("09:00");
  const [errorMsg, setErrorMsg] = useState("");
  const dialogRef = useRef(null);
  const timeInputRef = useRef(null);

  const handleClose = useCallback(() => {
    setErrorMsg("");
    onClose();
  }, [onClose]);

  // Handle ESC key dismiss
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        handleClose();
      }
    },
    [handleClose],
  );

  // Focus trap & body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      setTimeout(() => {
        timeInputRef.current?.focus();
      }, 50);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setErrorMsg("");

    if (!timeVal || !timeVal.includes(":")) {
      setErrorMsg("Please enter a valid time.");
      return;
    }

    const [hoursStr, minsStr] = timeVal.split(":");
    const hour = parseInt(hoursStr, 10);
    const minute = parseInt(minsStr, 10);

    if (isNaN(hour) || isNaN(minute)) {
      setErrorMsg("Invalid time format entered.");
      return;
    }

    // Operating hours check: strictly between 9:00 AM and 9:00 PM
    if (hour < 9 || hour > 21 || (hour === 21 && minute > 0)) {
      setErrorMsg("Please select a time between 9:00 AM and 9:00 PM.");
      return;
    }

    // Past-time check for today
    const now = new Date();
    const isToday =
      selectedDate instanceof Date &&
      !isNaN(selectedDate.getTime()) &&
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate();

    if (isToday) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const pickedMinutes = hour * 60 + minute;
      if (pickedMinutes < currentMinutes) {
        setErrorMsg("You cannot select a past time for today.");
        return;
      }
    }

    // Convert 24h to 12h format e.g. "10:30 AM"
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    const formattedDisplay = `${displayHour}:${String(minute).padStart(2, "0")} ${ampm}`;

    onSelectTime(formattedDisplay);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-time-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      {/* Backdrop dismiss */}
      <div
        className="fixed inset-0 -z-10"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4 border border-gray-100 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between border-b pb-3 border-gray-100">
          <h3
            id="service-time-picker-title"
            className="font-bold text-gray-900 text-base"
          >
            Select Service Time
          </h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close time picker"
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#800000]"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Service bookings are permitted between 9:00 AM and 9:00 PM.
        </p>

        <div className="py-2">
          <input
            ref={timeInputRef}
            type="time"
            value={timeVal}
            onChange={(e) => {
              setTimeVal(e.target.value);
              setErrorMsg("");
            }}
            className="w-full text-center text-3xl font-extrabold py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl focus:outline-none focus:border-[#800000] focus:ring-2 focus:ring-red-100 transition-all text-gray-900"
          />
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
            ⚠️ {errorMsg}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#800000] hover:bg-red-900 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#800000]"
          >
            Confirm Time
          </button>
        </div>
      </div>
    </div>
  );
};
