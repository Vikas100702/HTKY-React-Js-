import { useState, useEffect, useRef, useCallback } from "react";

export const ServiceTimePickerModal = ({
  isOpen,
  onClose,
  serviceTitle,
  selectedDate,
  onSelectTime,
}) => {
  // Default to 09:00 AM
  const [timeVal, setTimeVal] = useState("09:00");
  const [errorMsg, setErrorMsg] = useState("");
  const dialogRef = useRef(null);
  const timeInputRef = useRef(null);

  const handleClose = useCallback(() => {
    setErrorMsg("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          handleClose();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      setTimeout(() => timeInputRef.current?.focus(), 50);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, handleClose]);

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

    // Operating hours between 9:00 AM (09:00) and 9:00 PM (21:00)
    if (hour < 9 || hour > 21 || (hour === 21 && minute > 0)) {
      setErrorMsg("Please select a time between 9:00 AM and 9:00 PM.");
      return;
    }

    // Past time check if selected date is today
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

    // Convert 24-hr string to 12-hr format (e.g., "10:15 AM")
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    const formattedDisplay = `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm}`;

    onSelectTime(formattedDisplay);
    handleClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="time-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="fixed inset-0 -z-10" onClick={handleClose} aria-hidden="true" />

      <div
        ref={dialogRef}
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4 border border-gray-100"
      >
        <div className="flex items-center justify-between border-b pb-3 border-gray-100">
          <div>
            <h3 id="time-modal-title" className="font-bold text-gray-900 text-base">
              Select Service Time
            </h3>
            {serviceTitle && (
              <p className="text-xs text-gray-500 truncate max-w-[220px]">{serviceTitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Operating Hours: <span className="font-semibold text-gray-700">09:00 AM – 09:00 PM</span>
        </p>

        {/* Free-form native time input */}
        <div className="py-2 flex justify-center">
          <input
            ref={timeInputRef}
            type="time"
            min="09:00"
            max="21:00"
            value={timeVal}
            onChange={(e) => {
              setTimeVal(e.target.value);
              setErrorMsg("");
            }}
            className="text-3xl font-extrabold py-2 px-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#900000] text-gray-900 cursor-pointer text-center"
          />
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
            ⚠️ {errorMsg}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#900000] hover:bg-[#7a0000] rounded-lg shadow-sm"
          >
            Confirm Time
          </button>
        </div>
      </div>
    </div>
  );
};



