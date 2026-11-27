/**
 * @file src/pages/Facilities/components/FacilityAgreementModal.jsx
 * @description Modular Rental Agreement PDF Preview Modal for Temple Facility Booking.
 * Displays the 6-page `Rental_agreement.pdf` document before launching the Payment Gateway,
 * requiring explicit devotee acceptance (`Accept`) or dismissal (`Cancel`).
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 */

import { useEffect } from "react";
import PropTypes from "prop-types";
import { ExternalLink, FileText, Loader2, X } from "lucide-react";

const DEFAULT_AGREEMENT_PDF_URL = "/Rental_agreement.pdf";

/**
 * Renders the Rental Agreement PDF preview dialog with `Cancel` and `Accept` controls.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {string} [props.pdfUrl="/Rental_agreement.pdf"]
 * @param {boolean} [props.isAccepting=false]
 * @param {() => void} props.onCancel
 * @param {() => void} props.onAccept
 */
export const FacilityAgreementModal = ({
  isOpen,
  pdfUrl = DEFAULT_AGREEMENT_PDF_URL,
  isAccepting = false,
  onCancel,
  onAccept,
}) => {
  // Close on Escape key when not actively locking temporary booking
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isAccepting) {
        onCancel?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isAccepting, onCancel]);

  if (!isOpen) return null;

  const resolvedPdfSrc = `${pdfUrl}#toolbar=1&navpanes=0&view=FitH`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="facility-agreement-title"
      onClick={() => !isAccepting && onCancel?.()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-stone-300 w-full max-w-3xl flex flex-col overflow-hidden max-h-[92vh]"
      >
        {/* Top Header Bar */}
        <div className="px-4 sm:px-6 py-3 bg-[#faf8f5] border-b border-stone-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#900000] shrink-0" />
            <h2
              id="facility-agreement-title"
              className="text-sm sm:text-base font-bold text-stone-900"
            >
              Temple Facility Rental Agreement
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#900000] hover:underline"
            >
              <span>Open PDF</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              disabled={isAccepting}
              onClick={onCancel}
              aria-label="Close agreement modal"
              className="w-7 h-7 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Embedded 6-Page PDF Document Viewer */}
        <div className="flex-1 bg-stone-100 min-h-[380px] sm:min-h-[480px] relative">
          <iframe
            src={resolvedPdfSrc}
            title="Hindu Temple of Kentucky Rental Agreement"
            className="w-full h-[62vh] sm:h-[66vh] border-0 bg-white"
          />
        </div>

        {/* Bottom Footer Actions: Cancel & Accept */}
        <div className="px-5 py-3.5 bg-white border-t border-stone-200 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={isAccepting}
            onClick={onCancel}
            className="px-6 py-2 rounded-md bg-[#dc3545] hover:bg-[#c82333] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isAccepting}
            onClick={onAccept}
            className="px-7 py-2 rounded-md bg-[#198754] hover:bg-[#157347] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isAccepting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing Checkout...</span>
              </>
            ) : (
              <span>Accept</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

FacilityAgreementModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  pdfUrl: PropTypes.string,
  isAccepting: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
};

export default FacilityAgreementModal;
