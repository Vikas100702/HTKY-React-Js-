/**
 * @file src/components/ui/CustomDatePicker.jsx
 * @description A reusable, isolated, and accessible DatePicker UI component.
 * Adheres to Clean Architecture by maintaining its own internal visual state
 * while bubbling the actual data up via the `onChange` prop.
 */

import { useState, useRef, useEffect } from "react";

const MONTHS = [
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
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const CustomDatePicker = ({
  name,
  value,
  onChange,
  primaryColor = "#900000",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    value
      ? new Date(value)
      : new Date(new Date().setFullYear(new Date().getFullYear() - 25)),
  );

  const calendarRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysCount }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const handleDayClick = (day) => {
    try {
      const selected = new Date(year, month, day);
      const y = selected.getFullYear();
      const m = String(selected.getMonth() + 1).padStart(2, "0");
      const d = String(selected.getDate()).padStart(2, "0");

      // Fire synthetic event matching standard input behavior
      onChange({ target: { name, value: `${y}-${m}-${d}` } });
      setIsOpen(false);
    } catch (error) {
      console.error(`[DatePicker UI Error] ${new Date().toISOString()}`, error);
    }
  };

  const displayValue = value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="relative w-full" ref={calendarRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-gray-50 border ${
          isOpen ? "border-gray-400 ring-2" : "border-gray-200"
        } rounded-xl px-4 py-3.5 text-[15px] font-medium cursor-pointer transition-all flex items-center justify-between`}
        style={{
          borderColor: isOpen ? primaryColor : undefined,
          boxShadow: isOpen ? `0 0 0 2px ${primaryColor}30` : undefined,
        }}
      >
        <span className={displayValue ? "text-gray-800" : "text-gray-400"}>
          {displayValue || "DD / MM / YYYY"}
        </span>
        <svg
          className="w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 p-5 bg-white rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.12)] border border-gray-100 z-50 w-[320px] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-5">
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="flex items-center gap-1.5 font-bold text-gray-800 text-[16px]">
              <span>{MONTHS[month]}</span>
              <select
                value={year}
                onChange={(e) =>
                  setCurrentDate(new Date(Number(e.target.value), month, 1))
                }
                className="bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 appearance-none cursor-pointer outline-none hover:border-gray-300 transition-colors"
                style={{ color: primaryColor }}
              >
                {Array.from(
                  { length: 100 },
                  (_, i) => new Date().getFullYear() - i,
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[13px] font-extrabold text-gray-400 pb-2"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2 gap-x-1">
            {blanks.map((_, i) => (
              <div key={`blank-${i}`} className="w-10 h-10"></div>
            ))}
            {days.map((day) => {
              const currentDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = value === currentDateStr;
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center text-[14px] font-bold transition-all hover:-translate-y-0.5 ${isSelected ? "text-white shadow-md" : "text-gray-700 hover:bg-gray-100"}`}
                  style={{
                    backgroundColor: isSelected ? primaryColor : undefined,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
