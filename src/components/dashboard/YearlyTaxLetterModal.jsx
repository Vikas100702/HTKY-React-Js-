/**
 * @file src/components/dashboard/YearlyTaxLetterModal.jsx
 * @description Two-stage Yearly Tax Letter workflow triggered from the Devotee Account sidebar:
 * 1. Form Modal: Devotee selects Tax Year (2023 through current year) and clicks "Email Pdf".
 * 2. Immediate Transition: Submitting immediately closes the form modal, displays a compact
 *    sending loader, and then renders a standalone Result Dialog:
 *    - Success: Displays confirmation message and auto-closes quickly (1.2s).
 *    - Error: Displays the error message with an explicit "OK" button for manual dismissal.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Critical Architectural Non-Negotiables #1, #2, #3, #4, and #5.
 */

import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Mail,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useDevoteeProfile } from "../../hooks/queries/Profile/useDevoteeProfile";
import { sendYearlyTaxLetterPdf } from "../../services/dashboardApi";
import { decodeBase64 } from "../../utils/base64";

const START_TAX_YEAR = 2023;
const SUCCESS_AUTO_CLOSE_MS = 1200;

/**
 * Safely decodes Base64-encoded email strings while preserving plain email strings.
 *
 * @param {string} rawEmail
 * @returns {string}
 */
const resolvePlainEmail = (rawEmail) => {
  const trimmed = String(rawEmail || "").trim();
  if (!trimmed) return "";
  if (trimmed.includes("@")) return trimmed;
  try {
    const decoded = decodeBase64(trimmed);
    return decoded && decoded.includes("@") ? decoded.trim() : trimmed;
  } catch {
    return trimmed;
  }
};

/**
 * @component YearlyTaxLetterModal
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 */
export const YearlyTaxLetterModal = ({ isOpen, onClose }) => {
  const currentYear = new Date().getFullYear();

  const yearOptions = useMemo(() => {
    const endYear = Math.max(START_TAX_YEAR, currentYear);
    const list = [];
    for (let yr = endYear; yr >= START_TAX_YEAR; yr -= 1) {
      list.push(String(yr));
    }
    return list;
  }, [currentYear]);

  const [selectedYear, setSelectedYear] = useState(() => String(currentYear));
  // Stage: "form" | "submitting" | "result"
  const [modalStage, setModalStage] = useState("form");
  const [resultFeedback, setResultFeedback] = useState(null);
  const [wasOpen, setWasOpen] = useState(isOpen);

  // Reset state when opening a new modal session.
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setModalStage("form");
      setResultFeedback(null);
    }
  }

  const authUser = useAuthStore((state) => state.user);
  const { profile } = useDevoteeProfile();

  const memberId = useMemo(() => {
    return (
      profile?._id || authUser?._id || authUser?.id || authUser?.memberId || ""
    );
  }, [profile, authUser]);

  const registeredEmail = useMemo(() => {
    return (
      resolvePlainEmail(profile?.email) ||
      resolvePlainEmail(authUser?.email) ||
      ""
    );
  }, [profile, authUser]);

  const emailTaxLetterMutation = useMutation({
    mutationFn: () =>
      sendYearlyTaxLetterPdf({
        userID: "",
        memberId,
        emailId: registeredEmail,
        year: selectedYear,
      }),
    onSuccess: (res) => {
      const recordCount = Array.isArray(res?.records) ? res.records.length : 0;
      const countSuffix =
        recordCount > 0
          ? ` (${recordCount} tax record${recordCount === 1 ? "" : "s"} included)`
          : "";

      setResultFeedback({
        type: "success",
        message: `${
          res?.message ||
          `Your ${selectedYear} tax letter has been sent to ${registeredEmail}.`
        }${countSuffix}`,
      });
      setModalStage("result");
    },
    onError: (err) => {
      setResultFeedback({
        type: "error",
        message:
          err?.message ||
          "Unable to send Yearly Tax Letter PDF right now. Please try again.",
      });
      setModalStage("result");
    },
  });

  // Fast auto-close when Result stage is "success"
  useEffect(() => {
    if (
      !isOpen ||
      modalStage !== "result" ||
      resultFeedback?.type !== "success"
    ) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      onClose();
    }, SUCCESS_AUTO_CLOSE_MS);

    return () => window.clearTimeout(timerId);
  }, [isOpen, modalStage, resultFeedback, onClose]);

  // Escape key listener with strict cleanup
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && modalStage !== "submitting") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, modalStage, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (modalStage !== "form") return;

    // Immediately close the Form modal and move to Submitting stage
    setResultFeedback(null);
    setModalStage("submitting");
    emailTaxLetterMutation.mutate();
  };

  // ================= STAGE 1: YEAR SELECTION FORM MODAL =================
  if (modalStage === "form") {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="yearly-tax-letter-modal-title"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Top Temple Crimson Header */}
          <div className="bg-gradient-to-r from-[#900000] via-[#7c0000] to-[#900000] px-6 py-4 border-b-2 border-amber-500 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2
                  id="yearly-tax-letter-modal-title"
                  className="text-base sm:text-lg font-serif font-bold tracking-wide"
                >
                  Yearly Tax Letter
                </h2>
                <p className="text-[11px] text-amber-100/90">
                  Hindu Temple of Kentucky • 501(c)(3) Contribution Statement
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Yearly Tax Letter modal"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="rounded-xl bg-red-50/80 border border-red-200/80 px-4 py-3">
              <p className="text-xs sm:text-sm font-semibold text-[#900000] leading-relaxed">
                *Note: Your {selectedYear} tax letter will be sent to your
                registered email id :{" "}
                <span className="underline break-all">
                  {registeredEmail || "No registered email found"}
                </span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="yearly-tax-letter-year-select"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700"
              >
                Select Tax Year
              </label>
              <select
                id="yearly-tax-letter-year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-3.5 py-2.5 text-sm font-semibold text-stone-900 focus:border-[#900000] focus:ring-2 focus:ring-[#900000]/20 outline-none transition-all cursor-pointer"
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-200/80">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={!memberId || !registeredEmail}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#900000] hover:bg-[#780000] text-amber-300 text-xs font-bold uppercase tracking-wider shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Email Pdf</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ================= STAGE 2: COMPACT SENDING LOADER DIALOG =================
  if (modalStage === "submitting") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
      >
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-xs p-6 text-center space-y-3">
          <Loader2 className="w-9 h-9 animate-spin text-[#900000] mx-auto" />
          <p className="text-sm font-serif font-bold text-stone-900">
            Sending {selectedYear} Tax Letter...
          </p>
          <p className="text-xs text-stone-500 break-all">{registeredEmail}</p>
        </div>
      </div>
    );
  }

  // ================= STAGE 3: STANDALONE RESULT POPUP (SUCCESS / ERROR) =================
  const isSuccess = resultFeedback?.type === "success";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="yearly-tax-letter-result-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-sm p-6 text-center space-y-4"
      >
        {isSuccess ? (
          <>
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3
              id="yearly-tax-letter-result-title"
              className="text-lg font-serif font-bold text-stone-900"
            >
              Tax Letter Sent
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {resultFeedback?.message}
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-red-50 text-[#900000] flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3
              id="yearly-tax-letter-result-title"
              className="text-lg font-serif font-bold text-stone-900"
            >
              Unable to Send Tax Letter
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {resultFeedback?.message}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="min-w-[110px] px-6 py-2.5 rounded-xl bg-[#900000] hover:bg-[#780000] text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

YearlyTaxLetterModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default YearlyTaxLetterModal;
