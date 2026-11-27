/**
 * @file src/components/ui/CustomTimePicker.jsx
 * @description Reusable, zero-dependency Analog Clock Time Picker primitive for HTKY.
 * Supports pointer drag & click on a round clock dial, AM/PM toggle, and conditional
 * validation guards (`minTime`, `maxTime`, `disablePastForDate`, `disabled`, `hasError`).
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Critical Architectural Non-Negotiables #1, #2, #3, and #4.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { APP_COLORS } from "../../constants/appColors";

const DIAL_HOURS = Object.freeze([12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
const DIAL_MINUTES = Object.freeze([
  0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
]);

/**
 * Parses `"HH:mm"` (24h) or `"hh:mm AM/PM"` into `{ hour12, minute, period }`.
 *
 * @param {string} rawTime
 * @returns {{ hour12: number, minute: number, period: "AM"|"PM" }}
 */
const parseTimeParts = (rawTime) => {
  const str = String(rawTime || "")
    .trim()
    .toUpperCase();
  if (!str) return { hour12: 9, minute: 0, period: "AM" };

  const amPmMatch = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/.exec(str);
  if (amPmMatch) {
    const h = Math.min(12, Math.max(1, Number(amPmMatch[1]) || 12));
    const m = Math.min(59, Math.max(0, Number(amPmMatch[2]) || 0));
    return { hour12: h, minute: m, period: amPmMatch[3] };
  }

  const h24Match = /^(\d{1,2}):(\d{2})$/.exec(str);
  if (h24Match) {
    const h24 = Math.min(23, Math.max(0, Number(h24Match[1])));
    const m = Math.min(59, Math.max(0, Number(h24Match[2])));
    const period = h24 >= 12 ? "PM" : "AM";
    const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return { hour12, minute: m, period };
  }

  return { hour12: 9, minute: 0, period: "AM" };
};

/**
 * Converts `{ hour12, minute, period }` to total minutes from midnight (`0..1439`).
 */
const toTotalMinutes = ({ hour12, minute, period }) => {
  let h24 = hour12 % 12;
  if (period === "PM") h24 += 12;
  return h24 * 60 + minute;
};

/**
 * Converts total minutes from midnight (`0..1439`) into `{ hour12, minute, period }`.
 */
const fromTotalMinutes = (totalMins) => {
  const clamped = Math.min(23 * 60 + 59, Math.max(0, Math.floor(totalMins)));
  const h24 = Math.floor(clamped / 60);
  const minute = clamped % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hour12, minute, period };
};

/**
 * Converts `{ hour12, minute, period }` into 24-hour `"HH:mm"`.
 */
const formatTo24Hour = ({ hour12, minute, period }) => {
  let h24 = hour12 % 12;
  if (period === "PM") h24 += 12;
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

/**
 * Converts `{ hour12, minute, period }` into 12-hour `"hh:mm AM/PM"`.
 */
const formatTo12Hour = ({ hour12, minute, period }) =>
  `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;

/**
 * Checks if a `"MM/DD/YYYY"` or `"YYYY-MM-DD"` date string matches today's local date.
 */
const isTodayDateString = (dateStr) => {
  const clean = String(dateStr || "").trim();
  if (!clean) return false;
  const now = new Date();
  const todaySlash = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(
    now.getDate(),
  ).padStart(2, "0")}/${now.getFullYear()}`;
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getDate()).padStart(2, "0")}`;
  return clean === todaySlash || clean === todayIso;
};

/**
 * Reusable Round Analog Clock Time Picker Component.
 *
 * @param {Object} props
 * @param {string} [props.value] - Current time (`"HH:mm"` 24h or `"hh:mm AM/PM"`)
 * @param {(time24: string) => void} props.onChange - Emits `"HH:mm"` 24-hour string
 * @param {(time12: string) => void} [props.onChange12Hour] - Optional `"hh:mm AM/PM"` emitter
 * @param {string} [props.placeholder="00:00"] - Placeholder when empty
 * @param {string} [props.minTime] - Optional lower bound `"HH:mm"` (e.g., `"09:00"`)
 * @param {string} [props.maxTime] - Optional upper bound `"HH:mm"` (e.g., `"21:00"`)
 * @param {string} [props.disablePastForDate] - Optional date (`"MM/DD/YYYY"` or `"YYYY-MM-DD"`); disables past times if date is today
 * @param {boolean} [props.disabled=false] - Disables interaction when true
 * @param {string} [props.ariaLabel="Select Time"] - Accessible label
 * @param {string} [props.inputClassName=""] - Optional custom input styling classes
 */
export const CustomTimePicker = ({
  value = "",
  onChange,
  onChange12Hour,
  placeholder = "00:00",
  minTime = "",
  maxTime = "",
  disablePastForDate = "",
  disabled = false,
  ariaLabel = "Select Time",
  inputClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);

  const initialParts = useMemo(() => parseTimeParts(value), [value]);
  const [hour12, setHour12] = useState(initialParts.hour12);
  const [minute, setMinute] = useState(initialParts.minute);
  const [period, setPeriod] = useState(initialParts.period);
  const [previousValue, setPreviousValue] = useState(value);
  const [mode, setMode] = useState("HOUR"); // "HOUR" | "MINUTE"
  const [isDragging, setIsDragging] = useState(false);
  const [constraintNotice, setConstraintNotice] = useState("");

  const containerRef = useRef(null);
  const dialRef = useRef(null);

  // Update dial state during render when the external value changes.
  if (value !== previousValue) {
    setPreviousValue(value);
    if (value) {
      const next = parseTimeParts(value);
      setHour12(next.hour12);
      setMinute(next.minute);
      setPeriod(next.period);
    }
  }

  // Close popover on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Compute effective minute bounds (`minAllowedMinutes` .. `maxAllowedMinutes`)
  const { minAllowedMinutes, maxAllowedMinutes, isTodaySelected } =
    useMemo(() => {
      let minMins = minTime ? toTotalMinutes(parseTimeParts(minTime)) : 0;
      const maxMins = maxTime
        ? toTotalMinutes(parseTimeParts(maxTime))
        : 23 * 60 + 59;
      const isToday = Boolean(
        disablePastForDate && isTodayDateString(disablePastForDate),
      );

      if (isToday) {
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes() + 1;
        if (nowMins > minMins) minMins = nowMins;
      }

      return {
        minAllowedMinutes: minMins,
        maxAllowedMinutes: maxMins,
        isTodaySelected: isToday,
      };
    }, [minTime, maxTime, disablePastForDate]);

  // Clear or clamp `value` automatically if user switches `Event Date` to today
  // after already picking a past time
  useEffect(() => {
    if (!value || !isTodaySelected) return;
    const selectedMins = toTotalMinutes(parseTimeParts(value));
    if (selectedMins < minAllowedMinutes) {
      if (typeof onChange === "function") onChange("");
      if (typeof onChange12Hour === "function") onChange12Hour("");
    }
  }, [isTodaySelected, minAllowedMinutes, value, onChange, onChange12Hour]);

  const isCandidateAllowed = (candidateParts) => {
    const mins = toTotalMinutes(candidateParts);
    return mins >= minAllowedMinutes && mins <= maxAllowedMinutes;
  };

  const emitChange = (parts) => {
    if (typeof onChange === "function") {
      onChange(formatTo24Hour(parts));
    }
    if (typeof onChange12Hour === "function") {
      onChange12Hour(formatTo12Hour(parts));
    }
  };

  const applyTime = (nextH, nextM, nextP, { autoClampToMin = false } = {}) => {
    const candidate = { hour12: nextH, minute: nextM, period: nextP };
    const candidateMins = toTotalMinutes(candidate);

    if (
      candidateMins < minAllowedMinutes ||
      candidateMins > maxAllowedMinutes
    ) {
      if (autoClampToMin && minAllowedMinutes <= maxAllowedMinutes) {
        const clampedParts = fromTotalMinutes(minAllowedMinutes);
        setConstraintNotice("");
        setHour12(clampedParts.hour12);
        setMinute(clampedParts.minute);
        setPeriod(clampedParts.period);
        emitChange(clampedParts);
        return true;
      }

      setConstraintNotice(
        isTodaySelected
          ? "Cannot select a past time for today."
          : "Selected time is outside available hours.",
      );
      return false;
    }

    setConstraintNotice("");
    setHour12(nextH);
    setMinute(nextM);
    setPeriod(nextP);
    emitChange(candidate);
    return true;
  };

  const handlePeriodSwitch = (nextPeriod) => {
    const periodStart = nextPeriod === "AM" ? 0 : 12 * 60;
    const periodEnd = nextPeriod === "AM" ? 11 * 60 + 59 : 23 * 60 + 59;

    if (periodEnd < minAllowedMinutes || periodStart > maxAllowedMinutes) {
      setConstraintNotice(
        isTodaySelected
          ? `${nextPeriod} has already passed for today.`
          : `${nextPeriod} is outside available hours.`,
      );
      return;
    }

    const candidate = { hour12, minute, period: nextPeriod };
    if (isCandidateAllowed(candidate)) {
      applyTime(hour12, minute, nextPeriod);
      return;
    }

    // Snap smoothly to the earliest valid time within the chosen AM/PM period
    const clampedMins = Math.max(periodStart, minAllowedMinutes);
    const snapped = fromTotalMinutes(clampedMins);
    applyTime(snapped.hour12, snapped.minute, nextPeriod);
  };

  const resolveAngleValue = (clientX, clientY, currentMode) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let deg = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;

    if (currentMode === "HOUR") {
      const pickedHour = Math.round(deg / 30) % 12 || 12;
      // If the picked hour is valid for some minute (e.g. current hour today), snap to earliest valid minute
      const sameHourCandidate = { hour12: pickedHour, minute, period };
      if (isCandidateAllowed(sameHourCandidate)) {
        applyTime(pickedHour, minute, period);
      } else {
        const firstValidMinute = Array.from({ length: 60 }, (_, m) => m).find(
          (m) => isCandidateAllowed({ hour12: pickedHour, minute: m, period }),
        );
        if (firstValidMinute !== undefined) {
          applyTime(pickedHour, firstValidMinute, period);
        } else {
          setConstraintNotice(
            isTodaySelected
              ? "Cannot select a past hour for today."
              : "Selected hour is outside available hours.",
          );
        }
      }
    } else {
      const pickedMinute = Math.round(deg / 6) % 60;
      applyTime(hour12, pickedMinute, period);
    }
  };

  const handleToggleOpen = (e) => {
    if (disabled) return;
    if (!isOpen) {
      setMode("HOUR");
      setConstraintNotice("");

      // Initialize dial to a valid future time if current state is in the past
      const currentCandidate = { hour12, minute, period };
      if (
        !isCandidateAllowed(currentCandidate) &&
        minAllowedMinutes <= maxAllowedMinutes
      ) {
        const validStart = fromTotalMinutes(minAllowedMinutes);
        setHour12(validStart.hour12);
        setMinute(validStart.minute);
        setPeriod(validStart.period);
      }

      const rect = e.currentTarget.getBoundingClientRect();
      setOpenUpward(window.innerHeight - rect.bottom < 340);
    }
    setIsOpen((prev) => !prev);
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    resolveAngleValue(e.clientX, e.clientY, mode);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    resolveAngleValue(e.clientX, e.clientY, mode);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (mode === "HOUR") {
      // Only advance to MINUTE mode if the selected hour is valid
      const hourHasValidMinute = Array.from({ length: 60 }, (_, m) =>
        isCandidateAllowed({ hour12, minute: m, period }),
      ).some(Boolean);
      if (hourHasValidMinute) {
        setMode("MINUTE");
      }
    }
  };

  const displayValue = useMemo(() => {
    if (!String(value || "").trim()) return "";
    return formatTo12Hour(parseTimeParts(value));
  }, [value]);

  const handAngle = mode === "HOUR" ? (hour12 % 12) * 30 : minute * 6;
  const dialNumbers = mode === "HOUR" ? DIAL_HOURS : DIAL_MINUTES;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Field */}
      <div
        onClick={handleToggleOpen}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggleOpen(e);
          }
        }}
        className={`flex items-center justify-between gap-2.5 py-0.5 ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Clock className="w-4 h-4 text-[#900000] flex-shrink-0" />
          <input
            type="text"
            readOnly
            disabled={disabled}
            value={displayValue}
            placeholder={placeholder}
            className={
              inputClassName ||
              "w-full text-sm font-medium text-[#900000] placeholder:text-[#900000]/85 bg-transparent outline-none cursor-pointer"
            }
          />
        </div>
        <Clock className="w-4 h-4 text-stone-700 flex-shrink-0" />
      </div>

      {/* Round Analog Clock Popover */}
      {isOpen && !disabled && (
        <div
          className={`absolute left-0 ${
            openUpward ? "bottom-full mb-2" : "top-full mt-2"
          } z-50 w-72 bg-white rounded-xl shadow-2xl border border-stone-300 overflow-hidden select-none`}
          role="dialog"
          aria-label={ariaLabel}
        >
          {/* Top Crimson Header */}
          <div
            className="px-4 py-3 text-white flex items-center justify-between"
            style={{ backgroundColor: APP_COLORS.primary }}
          >
            <div className="flex items-center gap-1 font-mono text-2xl font-extrabold">
              <button
                type="button"
                onClick={() => setMode("HOUR")}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  mode === "HOUR"
                    ? "bg-white text-[#900000]"
                    : "text-white/80 hover:bg-white/15"
                }`}
              >
                {String(hour12).padStart(2, "0")}
              </button>
              <span className="text-amber-300">:</span>
              <button
                type="button"
                onClick={() => setMode("MINUTE")}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  mode === "MINUTE"
                    ? "bg-white text-[#900000]"
                    : "text-white/80 hover:bg-white/15"
                }`}
              >
                {String(minute).padStart(2, "0")}
              </button>
            </div>

            {/* AM / PM Switch */}
            <div className="flex rounded-lg overflow-hidden border border-white/30 text-xs font-bold">
              {["AM", "PM"].map((p) => {
                const pStart = p === "AM" ? 0 : 12 * 60;
                const pEnd = p === "AM" ? 11 * 60 + 59 : 23 * 60 + 59;
                const isPeriodDisabled =
                  pEnd < minAllowedMinutes || pStart > maxAllowedMinutes;

                return (
                  <button
                    key={p}
                    type="button"
                    disabled={isPeriodDisabled}
                    onClick={() => handlePeriodSwitch(p)}
                    className={`px-2.5 py-1.5 transition-colors ${
                      isPeriodDisabled
                        ? "opacity-40 cursor-not-allowed text-white/60"
                        : period === p
                          ? "bg-amber-400 text-stone-950 cursor-pointer"
                          : "text-white hover:bg-white/15 cursor-pointer"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Round Analog Clock Dial */}
          <div className="p-4 flex flex-col items-center bg-[#faf7f2]">
            <div
              ref={dialRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="relative w-52 h-52 rounded-full bg-white border-2 border-stone-200 shadow-inner flex items-center justify-center touch-none cursor-pointer"
            >
              {/* Center Pin */}
              <div
                className="w-2.5 h-2.5 rounded-full z-20 pointer-events-none"
                style={{ backgroundColor: APP_COLORS.primary }}
              />

              {/* Clock Hand */}
              <div
                className="absolute bottom-1/2 left-1/2 w-0.5 h-[78px] origin-bottom z-10 pointer-events-none"
                style={{
                  backgroundColor: APP_COLORS.primary,
                  transform: `translateX(-50%) rotate(${handAngle}deg)`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full -translate-x-[15px] -translate-y-4"
                  style={{ backgroundColor: APP_COLORS.primary }}
                />
              </div>

              {/* 12 Dial Markers */}
              {dialNumbers.map((num, idx) => {
                const rad = ((idx * 30 - 90) * Math.PI) / 180;
                const radius = 82;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;

                const isSelected =
                  mode === "HOUR" ? hour12 === num : minute === num;

                const itemAllowed =
                  mode === "HOUR"
                    ? Array.from({ length: 60 }, (_, m) =>
                        isCandidateAllowed({ hour12: num, minute: m, period }),
                      ).some(Boolean)
                    : isCandidateAllowed({ hour12, minute: num, period });

                return (
                  <span
                    key={`${mode}-${num}`}
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                    className={`absolute w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center z-20 pointer-events-none ${
                      isSelected
                        ? "text-white"
                        : itemAllowed
                          ? "text-stone-800"
                          : "text-stone-300 line-through"
                    }`}
                  >
                    {mode === "MINUTE" ? String(num).padStart(2, "0") : num}
                  </span>
                );
              })}
            </div>

            {constraintNotice ? (
              <span className="mt-2 text-[11px] font-semibold text-red-600 text-center">
                {constraintNotice}
              </span>
            ) : (
              <span className="mt-2 text-[11px] font-semibold text-stone-500">
                {mode === "HOUR" ? "Tap or drag hour" : "Tap or drag minute"}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-white border-t border-stone-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!value) {
                  applyTime(hour12, minute, period, { autoClampToMin: true });
                }
                setIsOpen(false);
              }}
              className="px-4 py-1 rounded text-xs font-bold text-white cursor-pointer hover:opacity-95"
              style={{ backgroundColor: APP_COLORS.primary }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTimePicker;
