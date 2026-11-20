/**
 * @file src/pages/Donations/RecurringDonationCheckout.jsx
 * @description Modern, Temple-themed Recurring Donation Checkout page (`/recurring-donation/checkout`).
 * Features:
 * 1. Consistent HTKY Temple UI matching `Checkout.jsx` & `VolunteerSignUp.jsx` (no legacy fieldsets).
 * 2. Custom Temple-themed Calendar Picker blocking all past dates and enforcing End Date >= Start Date.
 * 3. Live Credit Card Brand Badge UI (ELECTRON, MAESTRO, DANKORT, INTERPAYMENT, UNIONPAY, VISA,
 *    MASTERCARD, AMEX, DINERS, DISCOVER, JCB) with network-specific digit length enforcement,
 *    Luhn validation, and future expiry check.
 * 4. Symmetric centered title header and balanced 4-col / 8-col two-column layout across `max-w-7xl`.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Critical Architectural Non-Negotiables #1, #2, #3, #4, and #5.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HeartHandshake,
  Lock,
  ShieldCheck,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { useRecurringCartStore } from "../../store/useRecurringCartStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useDevoteeProfile } from "../../hooks/queries/Profile/useDevoteeProfile";
import { useGetClientSettings } from "../../hooks/queries/Donations/useGetDonations";
import { submitRecurringSponsors } from "../../services/recurringDonationApi";
import { detectCardType } from "../../utils/md5";
import { decodeBase64 } from "../../utils/base64";

const WEEKDAYS = Object.freeze([
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]);

const SHORT_WEEKDAYS = Object.freeze([
  "Su",
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
  "Sa",
]);

const MONTHS = Object.freeze([
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

const DAYS_OF_MONTH = Object.freeze(
  Array.from({ length: 31 }, (_, i) => String(i + 1)),
);

/**
 * Returns local midnight Date object (00:00:00.000) for accurate day-level comparison.
 *
 * @param {Date} [d]
 * @returns {Date}
 */
const toLocalMidnight = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Parses `MM/DD/YYYY` into a local Date object or returns null.
 *
 * @param {string} slashDate
 * @returns {Date|null}
 */
const parseSlashDate = (slashDate) => {
  if (!slashDate || !slashDate.includes("/")) return null;
  const [mm, dd, yyyy] = slashDate.split("/").map((n) => parseInt(n, 10));
  if (!mm || !dd || !yyyy || yyyy < 1000) return null;
  const parsed = new Date(yyyy, mm - 1, dd);
  if (
    parsed.getFullYear() !== yyyy ||
    parsed.getMonth() !== mm - 1 ||
    parsed.getDate() !== dd
  ) {
    return null;
  }
  return parsed;
};

/**
 * Formats a Date object as `MM/DD/YYYY`.
 *
 * @param {Date} dateObj
 * @returns {string}
 */
const formatDateToSlash = (dateObj) => {
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

/**
 * Formats 10-digit US phone numbers cleanly as `XXX-XXX-XXXX`.
 *
 * @param {string} rawPhone
 * @returns {string}
 */
const formatDisplayPhone = (rawPhone) => {
  const digits = String(rawPhone ?? "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return rawPhone || "";
};

/**
 * Safely decodes Base64 or returns plain string.
 *
 * @param {string} val
 * @returns {string}
 */
const safePlainText = (val) => {
  const str = String(val ?? "").trim();
  if (!str) return "";
  if (str.includes("@") || /^[\d+\s()-]+$/.test(str)) return str;
  return decodeBase64(str) || str;
};

/**
 * Detects card brand prefix even while typing partial digits, and returns
 * expected digit lengths + visual badge metadata.
 *
 * @param {string} digitsOnly
 * @returns {{ brand: string, label: string, inputPaddingClass: string, validLengths: number[], cvvLength: number, badgeBg: string, badgeText: string }}
 */
const getLiveCardMeta = (digitsOnly) => {
  const clean = String(digitsOnly ?? "").replace(/\D/g, "");
  const fullDetected = detectCardType(clean);

  // 1. ELECTRON (Must be checked BEFORE VISA because both start with 4)
  if (
    /^(4026|417500|4405|4508|4844|4913|4917)/.test(clean) ||
    fullDetected === "ELECTRON"
  ) {
    return {
      brand: "ELECTRON",
      label: "ELECTRON",
      inputPaddingClass: "pl-24",
      validLengths: [16],
      cvvLength: 3,
      badgeBg: "bg-blue-800",
      badgeText: "text-white",
    };
  }

  // 2. MAESTRO (Must be checked BEFORE MASTERCARD / DISCOVER)
  if (
    /^(5018|5020|5038|5612|5893|6304|6759|6761|6762|6763|0604|6390)/.test(
      clean,
    ) ||
    fullDetected === "MAESTRO"
  ) {
    return {
      brand: "MAESTRO",
      label: "MAESTRO",
      inputPaddingClass: "pl-24",
      validLengths: [12, 13, 14, 15, 16, 17, 18, 19],
      cvvLength: 3,
      badgeBg: "bg-rose-700",
      badgeText: "text-white",
    };
  }

  // 3. DANKORT
  if (/^5019/.test(clean) || fullDetected === "DANKORT") {
    return {
      brand: "DANKORT",
      label: "DANKORT",
      inputPaddingClass: "pl-24",
      validLengths: [16],
      cvvLength: 3,
      badgeBg: "bg-red-700",
      badgeText: "text-white",
    };
  }

  // 4. INTERPAYMENT
  if (/^636/.test(clean) || fullDetected === "INTERPAYMENT") {
    return {
      brand: "INTERPAYMENT",
      label: "INTERPAY",
      inputPaddingClass: "pl-24",
      validLengths: [16, 17, 18, 19],
      cvvLength: 3,
      badgeBg: "bg-cyan-800",
      badgeText: "text-white",
    };
  }

  // 5. UNIONPAY
  if (/^(62|88)/.test(clean) || fullDetected === "UNIONPAY") {
    return {
      brand: "UNIONPAY",
      label: "UNIONPAY",
      inputPaddingClass: "pl-24",
      validLengths: [16, 17, 18, 19],
      cvvLength: 3,
      badgeBg: "bg-teal-700",
      badgeText: "text-white",
    };
  }

  // 6. VISA
  if (/^4/.test(clean) || fullDetected === "VISA") {
    return {
      brand: "VISA",
      label: "VISA",
      inputPaddingClass: "pl-16",
      validLengths: [13, 16, 19],
      cvvLength: 3,
      badgeBg: "bg-slate-900",
      badgeText: "text-white",
    };
  }

  // 7. MASTERCARD
  if (/^5[1-5]/.test(clean) || fullDetected === "MASTERCARD") {
    return {
      brand: "MASTERCARD",
      label: "MC",
      inputPaddingClass: "pl-14",
      validLengths: [16],
      cvvLength: 3,
      badgeBg: "bg-gradient-to-r from-red-600 to-amber-500",
      badgeText: "text-white",
    };
  }

  // 8. AMEX
  if (/^3[47]/.test(clean) || fullDetected === "AMEX") {
    return {
      brand: "AMEX",
      label: "AMEX",
      inputPaddingClass: "pl-16",
      validLengths: [15],
      cvvLength: 4,
      badgeBg: "bg-sky-700",
      badgeText: "text-white",
    };
  }

  // 9. DINERS
  if (/^3(?:0[0-5]|[68])/.test(clean) || fullDetected === "DINERS") {
    return {
      brand: "DINERS",
      label: "DINERS",
      inputPaddingClass: "pl-20",
      validLengths: [14, 16],
      cvvLength: 3,
      badgeBg: "bg-indigo-700",
      badgeText: "text-white",
    };
  }

  // 10. DISCOVER
  if (/^(6011|65)/.test(clean) || fullDetected === "DISCOVER") {
    return {
      brand: "DISCOVER",
      label: "DISCOVER",
      inputPaddingClass: "pl-24",
      validLengths: [16, 19],
      cvvLength: 3,
      badgeBg: "bg-orange-600",
      badgeText: "text-white",
    };
  }

  // 11. JCB
  if (/^(?:2131|1800|35)/.test(clean) || fullDetected === "JCB") {
    return {
      brand: "JCB",
      label: "JCB",
      inputPaddingClass: "pl-14",
      validLengths: [16],
      cvvLength: 3,
      badgeBg: "bg-emerald-700",
      badgeText: "text-white",
    };
  }

  return {
    brand: "UNKNOWN",
    label: "",
    inputPaddingClass: "pl-10",
    validLengths: [13, 14, 15, 16, 17, 18, 19],
    cvvLength: 3,
    badgeBg: "bg-stone-100",
    badgeText: "text-stone-500",
  };
};

/**
 * Standard Luhn (mod 10) card number check.
 *
 * @param {string} digits
 * @returns {boolean}
 */
const passesLuhnCheck = (digits) => {
  const clean = String(digits ?? "").replace(/\D/g, "");
  if (clean.length < 13) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

/**
 * Custom Temple-Themed Date Picker (`MM/DD/YYYY`) that blocks past dates (`minDate`)
 * and auto-flips upward if near the bottom of the viewport.
 */
const TempleDateInput = ({
  label,
  value,
  onChange,
  minDate,
  placeholder = "MM/DD/YYYY",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);

  const todayMidnight = useMemo(() => toLocalMidnight(new Date()), []);
  const effectiveMinDate = useMemo(() => {
    if (!minDate) return todayMidnight;
    const minMid = toLocalMidnight(minDate);
    return minMid > todayMidnight ? minMid : todayMidnight;
  }, [minDate, todayMidnight]);

  const selectedDateObj = useMemo(() => parseSlashDate(value), [value]);

  const [viewMonth, setViewMonth] = useState(() => {
    const base = selectedDateObj || effectiveMinDate;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const handleToggle = (e) => {
    if (!isOpen) {
      const base = selectedDateObj || effectiveMinDate;
      setViewMonth(new Date(base.getFullYear(), base.getMonth(), 1));
      const rect = e.currentTarget.getBoundingClientRect();
      setOpenUpward(window.innerHeight - rect.bottom < 320);
    }
    setIsOpen((prev) => !prev);
  };

  const year = viewMonth.getFullYear();
  const monthIdx = viewMonth.getMonth();
  const firstWeekday = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const canGoPrevMonth =
    year > effectiveMinDate.getFullYear() ||
    (year === effectiveMinDate.getFullYear() &&
      monthIdx > effectiveMinDate.getMonth());

  const handlePrevMonth = () => {
    if (!canGoPrevMonth) return;
    setViewMonth(new Date(year, monthIdx - 1, 1));
  };

  const handleNextMonth = () => {
    setViewMonth(new Date(year, monthIdx + 1, 1));
  };

  const handleDaySelect = (dayNum) => {
    const picked = new Date(year, monthIdx, dayNum);
    if (picked < effectiveMinDate) return;
    onChange(formatDateToSlash(picked));
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
          {label} <span className="text-[#900000]">*</span>
        </label>
      )}

      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#FAF8F5] hover:bg-white hover:border-[#900000]/50 focus:outline-none focus:ring-2 focus:ring-[#900000]/20 text-left transition-all cursor-pointer"
      >
        <span
          className={`text-sm font-medium ${
            value ? "text-stone-900" : "text-stone-400"
          }`}
        >
          {value || placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-[#900000] shrink-0" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`absolute left-0 ${
              openUpward ? "bottom-full mb-2" : "top-full mt-2"
            } z-50 w-72 bg-white border border-stone-200 rounded-2xl shadow-2xl p-3.5 select-none`}
          >
            {/* Temple Crimson Header */}
            <div className="bg-[#900000] text-white px-3 py-2 rounded-xl flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={!canGoPrevMonth}
                aria-label="Previous Month"
                className="p-1 rounded-lg hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-serif font-bold tracking-wide">
                {MONTHS[monthIdx]} {year}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-1 rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-stone-500 mb-1.5">
              {SHORT_WEEKDAYS.map((wd) => (
                <span key={wd}>{wd}</span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstWeekday }).map((_, idx) => (
                <div key={`blank-${idx}`} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const cellDate = new Date(year, monthIdx, dayNum);
                const isPastOrBeforeMin = cellDate < effectiveMinDate;
                const isToday = cellDate.getTime() === todayMidnight.getTime();
                const isSelected =
                  selectedDateObj &&
                  cellDate.getTime() ===
                    toLocalMidnight(selectedDateObj).getTime();

                return (
                  <button
                    key={dayNum}
                    type="button"
                    disabled={isPastOrBeforeMin}
                    onClick={() => handleDaySelect(dayNum)}
                    className={`h-8 rounded-lg text-xs font-semibold transition-all ${
                      isPastOrBeforeMin
                        ? "text-stone-300 bg-stone-50/60 line-through cursor-not-allowed"
                        : isSelected
                          ? "bg-[#900000] text-amber-200 font-bold shadow-xs ring-2 ring-amber-400 cursor-pointer"
                          : isToday
                            ? "bg-amber-50 text-[#900000] border border-amber-400 font-bold hover:bg-amber-100 cursor-pointer"
                            : "text-stone-700 hover:bg-[#900000]/10 hover:text-[#900000] cursor-pointer"
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => {
                  onChange(formatDateToSlash(effectiveMinDate));
                  setIsOpen(false);
                }}
                className="font-bold text-[#900000] hover:underline cursor-pointer"
              >
                Select Earliest Valid
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const RecurringDonationCheckout = () => {
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  const items = useRecurringCartStore((state) => state.items || []);
  const totalAmount = useRecurringCartStore((state) => state.totalAmount || 0);
  const currencySymbol = useRecurringCartStore(
    (state) => state.currencySymbol || "$",
  );
  const removeItem = useRecurringCartStore((state) => state.removeItem);
  const clearRecurringCart = useRecurringCartStore(
    (state) => state.clearRecurringCart,
  );

  const user = useAuthStore((state) => state.user);
  const { devoteeProfile } = useDevoteeProfile();
  const { data: clientSettings } = useGetClientSettings();

  // Dynamic Year Options for Annually Schedule
  const currentYear = new Date().getFullYear();
  const startYearOptions = useMemo(
    () => Array.from({ length: 25 }, (_, idx) => String(currentYear + idx)),
    [currentYear],
  );
  const endYearOptions = useMemo(
    () => Array.from({ length: 25 }, (_, idx) => String(currentYear + 1 + idx)),
    [currentYear],
  );

  // Debit Frequency & Schedule State (`MM/DD/YYYY` strings for dates)
  const [debitFrequency, setDebitFrequency] = useState("");
  const [startDailyDate, setStartDailyDate] = useState("");
  const [endDailyDate, setEndDailyDate] = useState("");

  const [startWeeklyDate, setStartWeeklyDate] = useState("");
  const [endWeeklyDate, setEndWeeklyDate] = useState("");
  const [selectWeeklyDay, setSelectWeeklyDay] = useState("");

  const [startMonthlyDate, setStartMonthlyDate] = useState("");
  const [endMonthlyDate, setEndMonthlyDate] = useState("");
  const [selectMonthDate, setSelectMonthDate] = useState("");

  const [selectAnnuallyMonthValue, setSelectAnnuallyMonthValue] = useState("");
  const [selectAnnuallyDateValue, setSelectAnnuallyDateValue] = useState("");
  const [startAnnuallyDate, setStartAnnuallyDate] = useState("");
  const [endAnnuallyDate, setEndAnnuallyDate] = useState("");

  // Card Form State
  const [cardNumber, setCardNumber] = useState("");
  const [expDate, setExpDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");

  // Submission & Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Resolved Devotee Header Details
  const devoteeName =
    devoteeProfile?.refDataName ||
    user?.refDataName ||
    `${devoteeProfile?.firstName || user?.firstName || ""} ${
      devoteeProfile?.lastName || user?.lastName || ""
    }`.trim() ||
    "Devotee";

  const devoteeEmail = safePlainText(
    devoteeProfile?.email || user?.email || "",
  );
  const devoteePhone = formatDisplayPhone(
    safePlainText(devoteeProfile?.phone || user?.phone || ""),
  );

  // Live Card Brand Detection & Dynamic Max Length
  const rawCardDigits = cardNumber.replace(/\D/g, "");
  const cardMeta = useMemo(
    () => getLiveCardMeta(rawCardDigits),
    [rawCardDigits],
  );
  const maxCardDigits = Math.max(...cardMeta.validLengths);

  const handleCardNumberChange = (e) => {
    const digitsOnly = e.target.value
      .replace(/\D/g, "")
      .slice(0, maxCardDigits);
    // AMEX formats as 4-6-5; standard cards format in groups of 4
    const formatted =
      cardMeta.brand === "AMEX"
        ? digitsOnly.replace(/^(\d{4})(\d{0,6})(\d{0,5}).*/, (_, g1, g2, g3) =>
            [g1, g2, g3].filter(Boolean).join(" "),
          )
        : digitsOnly.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
    if (errorMessage) setErrorMessage("");
  };

  const handleExpDateChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (digitsOnly.length >= 3) {
      setExpDate(`${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`);
    } else {
      setExpDate(digitsOnly);
    }
    if (errorMessage) setErrorMessage("");
  };

  const validateScheduleAndCard = () => {
    if (items.length === 0) {
      return "Your recurring donation list is empty. Please select at least one offering.";
    }

    if (!debitFrequency) {
      return "Please select a Debit Frequency (Daily, Weekly, Monthly, or Annually).";
    }

    const today = toLocalMidnight(new Date());

    if (debitFrequency === "Daily") {
      const sDate = parseSlashDate(startDailyDate);
      const eDate = parseSlashDate(endDailyDate);
      if (!sDate || !eDate) {
        return "Please select both Start Date and End Date for your Daily schedule.";
      }
      if (sDate < today) {
        return "Start Date cannot be in the past.";
      }
      if (eDate < sDate) {
        return "End Date cannot be earlier than Start Date.";
      }
    } else if (debitFrequency === "Weekly") {
      const sDate = parseSlashDate(startWeeklyDate);
      const eDate = parseSlashDate(endWeeklyDate);
      if (!sDate || !eDate || !selectWeeklyDay) {
        return "Please select Start Date, End Date, and Day of Week for your Weekly schedule.";
      }
      if (sDate < today) {
        return "Start Date cannot be in the past.";
      }
      if (eDate < sDate) {
        return "End Date cannot be earlier than Start Date.";
      }
    } else if (debitFrequency === "Monthly") {
      const sDate = parseSlashDate(startMonthlyDate);
      const eDate = parseSlashDate(endMonthlyDate);
      if (!sDate || !eDate || !selectMonthDate) {
        return "Please select Start Date, End Date, and Day of Month for your Monthly schedule.";
      }
      if (sDate < today) {
        return "Start Date cannot be in the past.";
      }
      if (eDate < sDate) {
        return "End Date cannot be earlier than Start Date.";
      }
    } else if (debitFrequency === "Annually") {
      if (
        !selectAnnuallyMonthValue ||
        !selectAnnuallyDateValue ||
        !startAnnuallyDate ||
        !endAnnuallyDate
      ) {
        return "Please select Month, Date, Start Year, and End Year for your Annual schedule.";
      }
      if (Number(endAnnuallyDate) < Number(startAnnuallyDate)) {
        return "End Year cannot be earlier than Start Year.";
      }
    }

    // Card Number Length & Luhn Validation
    if (!cardMeta.validLengths.includes(rawCardDigits.length)) {
      const expectedText = cardMeta.validLengths.join(" or ");
      return `Please enter a valid ${
        cardMeta.brand !== "UNKNOWN" ? cardMeta.brand : "credit"
      } card number (${expectedText} digits).`;
    }

    if (!passesLuhnCheck(rawCardDigits)) {
      return "Invalid card number checksum. Please double-check the digits entered.";
    }

    // Expiry Date Validation (MM/YY and must not be expired)
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expDate)) {
      return "Please enter a valid Expiry Date in MM/YY format.";
    }
    const [expMM, expYY] = expDate.split("/").map((n) => parseInt(n, 10));
    const fullExpYear = 2000 + expYY;
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const cardExpiryMonth = new Date(fullExpYear, expMM - 1, 1);
    if (cardExpiryMonth < currentMonthStart) {
      return "This credit card has expired. Please use an active card.";
    }

    // CVV Length Validation (4 digits for AMEX, 3 digits for others)
    const cvvClean = cvv.trim();
    if (cvvClean.length !== cardMeta.cvvLength) {
      return `Please enter a valid ${cardMeta.cvvLength}-digit CVV code.`;
    }

    if (!cardHolder.trim() || cardHolder.trim().length < 2) {
      return "Please enter the Card Holder name as printed on the card.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const validationError = validateScheduleAndCard();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setIsSubmitting(true);

      const schedulePayload = {
        debitFequency: debitFrequency,
        startDailyDate: debitFrequency === "Daily" ? startDailyDate : "",
        endDailyDate: debitFrequency === "Daily" ? endDailyDate : "",
        startWeeklyDate: debitFrequency === "Weekly" ? startWeeklyDate : "",
        endWeeklyDate: debitFrequency === "Weekly" ? endWeeklyDate : "",
        selectWeeklyDay: debitFrequency === "Weekly" ? selectWeeklyDay : "",
        startMonthlyDate: debitFrequency === "Monthly" ? startMonthlyDate : "",
        endMonthlyDate: debitFrequency === "Monthly" ? endMonthlyDate : "",
        selectmonthDate: debitFrequency === "Monthly" ? selectMonthDate : "",
        selectAnualyMonthValue:
          debitFrequency === "Annually" ? selectAnnuallyMonthValue : "",
        selectAnualyDateValue:
          debitFrequency === "Annually" ? selectAnnuallyDateValue : "",
        startAnualyDate: debitFrequency === "Annually" ? startAnnuallyDate : "",
        endAnualyDate: debitFrequency === "Annually" ? endAnnuallyDate : "",
      };

      const result = await submitRecurringSponsors({
        items,
        schedule: schedulePayload,
        cardDetails: {
          cardNumber: rawCardDigits,
          expDate,
          cvv,
          cardHolder,
        },
        clientSettings,
        devoteeProfile,
        user,
        signal: abortControllerRef.current.signal,
      });

      if (!isMountedRef.current) return;

      const receiptItems = items.map((item) => ({
        id: item.id,
        name: item.title || item.name || item.refDataName,
        amount: Number(item.amount) || 0,
        quantity: 0,
      }));
      const paidTotal = Number(totalAmount) || 0;

      clearRecurringCart();

      navigate("/checkout/success", {
        state: {
          invoiceNo: result?.organizationId || `REC-${Date.now()}`,
          transactionId: result?.token || `REC-TXN-${Date.now()}`,
          paymentSource: "RECURRING_CREDIT_CARD",
          totalAmount: paidTotal,
          items: receiptItems,
          devoteeName,
          devoteeEmail,
          debitFrequency,
        },
        replace: true,
      });
    } catch (err) {
      if (err?.name === "AbortError" || err?.name === "CanceledError") return;
      if (isMountedRef.current) {
        setErrorMessage(
          err?.message ||
            "Unable to process your recurring donation. Please verify your details and try again.",
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const selectInputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#FAF8F5] hover:bg-white focus:bg-white text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#900000]/20 focus:border-[#900000] transition-all cursor-pointer";

  const textInputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#FAF8F5] focus:bg-white text-sm font-medium text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#900000]/20 focus:border-[#900000] transition-all";

  return (
    <section
      className="w-full min-h-screen bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-cover bg-top py-8 px-4 sm:px-6 lg:px-8"
      aria-labelledby="recurring-checkout-heading"
    >
      <div className="max-w-7xl mx-auto">
        {/* Top Navigation & Symmetric Centered Temple Serif Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-7">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => navigate("/recurring-donation")}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#900000] hover:text-[#700000] bg-white/90 hover:bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-2xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Recurring Donations</span>
            </button>
          </div>

          <div className="text-center">
            <h1
              id="recurring-checkout-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#900000] tracking-tight md:whitespace-nowrap"
            >
              Recurring Donation Checkout
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Set up your automated sacred contribution schedule
            </p>
          </div>

          {/* Right symmetry spacer on desktop so title sits dead-center */}
          <div className="hidden md:block" aria-hidden="true" />
        </div>

        {/* Empty State Guard */}
        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xl p-12 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-[#900000] flex items-center justify-center mx-auto">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900">
              No Recurring Donations Selected
            </h2>
            <p className="text-sm text-stone-500">
              Please select one or more recurring donation offerings before
              proceeding to recurring checkout.
            </p>
            <button
              type="button"
              onClick={() => navigate("/recurring-donation")}
              className="px-6 py-3 rounded-xl bg-[#900000] hover:bg-[#780000] text-amber-200 text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              Browse Recurring Donations
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            {/* LEFT COLUMN: Order Summary Card (7 cols - Wider Left Side) */}
            <aside className="lg:col-span-7 bg-white rounded-3xl border border-stone-200/90 shadow-xl shadow-stone-900/5 overflow-hidden">
              <div className="bg-gradient-to-r from-[#900000] via-[#7c0000] to-[#680000] px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <HeartHandshake className="w-5 h-5 text-amber-300" />
                  <h2 className="text-base sm:text-lg font-serif font-bold tracking-wide">
                    Order Summary
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-amber-200 text-xs font-bold">
                  {items.length} {items.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* Line Items List */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-400 pb-2.5 border-b border-stone-100">
                    <span>Offering Name</span>
                    <span>Amount</span>
                  </div>

                  <ul className="divide-y divide-stone-100">
                    {items.map((item) => {
                      const itemId = item.id || item._id;
                      const itemName =
                        item.title || item.name || item.refDataName;
                      const itemAmt = Number(item.amount) || 0;

                      return (
                        <li
                          key={itemId}
                          className="py-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 mb-1">
                              Recurring Pledge
                            </span>
                            <p className="text-sm font-bold text-stone-900 truncate">
                              {itemName}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-extrabold text-stone-900">
                              {currencySymbol}
                              {itemAmt.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItem(itemId)}
                              title="Remove offering"
                              aria-label={`Remove ${itemName}`}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Totals Block */}
                <div className="pt-4 border-t border-stone-200 space-y-3">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-stone-600 font-medium">
                    <span>Recurring Subtotal</span>
                    <span className="font-bold text-stone-900">
                      {currencySymbol}
                      {Number(totalAmount).toFixed(2)}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-[#FAF8F5] border border-amber-200/80 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Scheduled Amount
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {debitFrequency
                          ? `Billed ${debitFrequency}`
                          : "Select debit frequency"}
                      </p>
                    </div>
                    <span className="text-xl sm:text-2xl font-serif font-extrabold text-[#900000]">
                      {currencySymbol}
                      {Number(totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-[11px] text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    All offerings and donations are tax-exempt according to
                    temple regulations.
                  </span>
                </div>
              </div>
            </aside>

            {/* RIGHT COLUMN: Devotee Banner + Schedule & Card Details (5 cols - Compact Right Side) */}
            <main className="lg:col-span-5 bg-white rounded-3xl border border-stone-200/90 shadow-xl shadow-stone-900/5 p-6 sm:p-8 space-y-6">
              {/* Devotee Identity Strip */}
              <div className="rounded-2xl bg-[#FAF8F5] border border-stone-200/80 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#900000] text-amber-200 font-serif font-bold text-sm flex items-center justify-center shrink-0">
                    {devoteeName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                      {devoteeName}
                    </p>
                    {devoteeEmail && (
                      <p className="text-xs text-stone-600">{devoteeEmail}</p>
                    )}
                  </div>
                </div>

                {devoteePhone && (
                  <span className="px-3 py-1 rounded-full bg-white border border-stone-200 text-xs font-bold text-[#900000]">
                    {devoteePhone}
                  </span>
                )}
              </div>

              {/* Error Alert Banner */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs sm:text-sm font-medium text-red-800 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Section 1: Debit Frequency & Schedule */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                    <span className="w-6 h-6 rounded-full bg-[#900000]/10 text-[#900000] text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900">
                      Debit Frequency & Schedule
                    </h3>
                  </div>

                  <div>
                    <label
                      htmlFor="debit-frequency-select"
                      className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5"
                    >
                      Select Debit Frequency{" "}
                      <span className="text-[#900000]">*</span>
                    </label>
                    <select
                      id="debit-frequency-select"
                      value={debitFrequency}
                      onChange={(e) => {
                        setDebitFrequency(e.target.value);
                        setErrorMessage("");
                      }}
                      className={selectInputClass}
                    >
                      <option value="">-- Select Debit Frequency --</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Annually">Annually</option>
                    </select>
                  </div>

                  {/* Daily Schedule */}
                  {debitFrequency === "Daily" && (
                    <div className="rounded-2xl bg-[#FAF8F5] border border-stone-200/80 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TempleDateInput
                        label="Start Date"
                        value={startDailyDate}
                        onChange={(val) => {
                          setStartDailyDate(val);
                          const newStart = parseSlashDate(val);
                          const curEnd = parseSlashDate(endDailyDate);
                          if (newStart && curEnd && curEnd < newStart) {
                            setEndDailyDate("");
                          }
                        }}
                      />
                      <TempleDateInput
                        label="End Date"
                        value={endDailyDate}
                        minDate={parseSlashDate(startDailyDate)}
                        onChange={setEndDailyDate}
                      />
                    </div>
                  )}

                  {/* Weekly Schedule */}
                  {debitFrequency === "Weekly" && (
                    <div className="rounded-2xl bg-[#FAF8F5] border border-stone-200/80 p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <TempleDateInput
                          label="Start Date"
                          value={startWeeklyDate}
                          onChange={(val) => {
                            setStartWeeklyDate(val);
                            const newStart = parseSlashDate(val);
                            const curEnd = parseSlashDate(endWeeklyDate);
                            if (newStart && curEnd && curEnd < newStart) {
                              setEndWeeklyDate("");
                            }
                          }}
                        />
                        <TempleDateInput
                          label="End Date"
                          value={endWeeklyDate}
                          minDate={parseSlashDate(startWeeklyDate)}
                          onChange={setEndWeeklyDate}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                          Select Day of Week{" "}
                          <span className="text-[#900000]">*</span>
                        </label>
                        <select
                          value={selectWeeklyDay}
                          onChange={(e) => setSelectWeeklyDay(e.target.value)}
                          className={selectInputClass}
                        >
                          <option value="">-- Select Day of Week --</option>
                          {WEEKDAYS.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Monthly Schedule */}
                  {debitFrequency === "Monthly" && (
                    <div className="rounded-2xl bg-[#FAF8F5] border border-stone-200/80 p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <TempleDateInput
                          label="Start Date"
                          value={startMonthlyDate}
                          onChange={(val) => {
                            setStartMonthlyDate(val);
                            const newStart = parseSlashDate(val);
                            const curEnd = parseSlashDate(endMonthlyDate);
                            if (newStart && curEnd && curEnd < newStart) {
                              setEndMonthlyDate("");
                            }
                          }}
                        />
                        <TempleDateInput
                          label="End Date"
                          value={endMonthlyDate}
                          minDate={parseSlashDate(startMonthlyDate)}
                          onChange={setEndMonthlyDate}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                          Select Day of Month{" "}
                          <span className="text-[#900000]">*</span>
                        </label>
                        <select
                          value={selectMonthDate}
                          onChange={(e) => setSelectMonthDate(e.target.value)}
                          className={selectInputClass}
                        >
                          <option value="">-- Select Day of Month --</option>
                          {DAYS_OF_MONTH.map((dayNum) => (
                            <option key={dayNum} value={dayNum}>
                              Day {dayNum}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Annually Schedule */}
                  {debitFrequency === "Annually" && (
                    <div className="rounded-2xl bg-[#FAF8F5] border border-stone-200/80 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                          Select Month <span className="text-[#900000]">*</span>
                        </label>
                        <select
                          value={selectAnnuallyMonthValue}
                          onChange={(e) =>
                            setSelectAnnuallyMonthValue(e.target.value)
                          }
                          className={selectInputClass}
                        >
                          <option value="">-- Select Month --</option>
                          {MONTHS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                          Select Date <span className="text-[#900000]">*</span>
                        </label>
                        <select
                          value={selectAnnuallyDateValue}
                          onChange={(e) =>
                            setSelectAnnuallyDateValue(e.target.value)
                          }
                          className={selectInputClass}
                        >
                          <option value="">-- Select Date --</option>
                          {DAYS_OF_MONTH.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                          Start Year <span className="text-[#900000]">*</span>
                        </label>
                        <select
                          value={startAnnuallyDate}
                          onChange={(e) => {
                            setStartAnnuallyDate(e.target.value);
                            if (
                              endAnnuallyDate &&
                              Number(endAnnuallyDate) < Number(e.target.value)
                            ) {
                              setEndAnnuallyDate("");
                            }
                          }}
                          className={selectInputClass}
                        >
                          <option value="">-- Select Start Year --</option>
                          {startYearOptions.map((yr) => (
                            <option key={yr} value={yr}>
                              {yr}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                          End Year <span className="text-[#900000]">*</span>
                        </label>
                        <select
                          value={endAnnuallyDate}
                          onChange={(e) => setEndAnnuallyDate(e.target.value)}
                          className={selectInputClass}
                        >
                          <option value="">-- Select End Year --</option>
                          {endYearOptions
                            .filter(
                              (yr) =>
                                !startAnnuallyDate ||
                                Number(yr) >= Number(startAnnuallyDate),
                            )
                            .map((yr) => (
                              <option key={yr} value={yr}>
                                {yr}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: Mode of Payment & Card Details */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#900000]/10 text-[#900000] text-xs font-bold flex items-center justify-center">
                        2
                      </span>
                      <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900">
                        Mode of Payment{" "}
                        <span className="text-[#900000]">*</span>
                      </h3>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Credit Card
                    </span>
                  </div>

                  {/* Card Number with Live Detected Brand Badge */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="recurring-card-number"
                        className="block text-xs font-bold uppercase tracking-wider text-stone-600"
                      >
                        Card Number <span className="text-[#900000]">*</span>
                      </label>
                      {rawCardDigits.length > 0 && (
                        <span className="text-[11px] font-semibold text-stone-500">
                          {rawCardDigits.length} / {maxCardDigits} digits
                        </span>
                      )}
                    </div>

                    <div className="relative flex items-center">
                      {/* Left Card Network Badge */}
                      <div className="absolute left-3 flex items-center pointer-events-none">
                        {cardMeta.brand !== "UNKNOWN" ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider shadow-2xs ${cardMeta.badgeBg} ${cardMeta.badgeText}`}
                          >
                            {cardMeta.label}
                          </span>
                        ) : (
                          <CreditCard className="w-4 h-4 text-stone-400" />
                        )}
                      </div>

                      <input
                        id="recurring-card-number"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="0000 0000 0000 0000"
                        className={`${textInputClass} ${cardMeta.inputPaddingClass} pr-28 font-mono tracking-wider`}
                      />

                      {/* Right Full Card Network Name */}
                      {cardMeta.brand !== "UNKNOWN" && (
                        <span className="absolute right-3 text-[10px] font-bold uppercase tracking-wider text-[#900000] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md pointer-events-none">
                          {cardMeta.brand}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expiry Date & CVV */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="recurring-exp-date"
                        className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5"
                      >
                        Expiry Date (MM/YY){" "}
                        <span className="text-[#900000]">*</span>
                      </label>
                      <input
                        id="recurring-exp-date"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        value={expDate}
                        onChange={handleExpDateChange}
                        placeholder="MM/YY"
                        className={`${textInputClass} font-mono`}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="recurring-cvv"
                        className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5"
                      >
                        CVV ({cardMeta.cvvLength} digits){" "}
                        <span className="text-[#900000]">*</span>
                      </label>
                      <input
                        id="recurring-cvv"
                        type="password"
                        inputMode="numeric"
                        maxLength={cardMeta.cvvLength}
                        autoComplete="cc-csc"
                        value={cvv}
                        onChange={(e) => {
                          setCvv(
                            e.target.value
                              .replace(/\D/g, "")
                              .slice(0, cardMeta.cvvLength),
                          );
                          if (errorMessage) setErrorMessage("");
                        }}
                        placeholder={cardMeta.cvvLength === 4 ? "••••" : "•••"}
                        className={`${textInputClass} font-mono tracking-widest`}
                      />
                    </div>
                  </div>

                  {/* Card Holder */}
                  <div>
                    <label
                      htmlFor="recurring-card-holder"
                      className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5"
                    >
                      Card Holder Name <span className="text-[#900000]">*</span>
                    </label>
                    <input
                      id="recurring-card-holder"
                      type="text"
                      autoComplete="cc-name"
                      value={cardHolder}
                      onChange={(e) => {
                        setCardHolder(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      placeholder="Full name as printed on card"
                      className={textInputClass}
                    />
                  </div>
                </div>

                {/* Submit CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#900000] hover:bg-[#780000] disabled:opacity-60 text-amber-200 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#900000]/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? "Validating & Activating Pledge..."
                        : `Activate Recurring Pledge (${currencySymbol}${Number(
                            totalAmount,
                          ).toFixed(2)})`}
                    </span>
                  </button>
                </div>
              </form>
            </main>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecurringDonationCheckout;
