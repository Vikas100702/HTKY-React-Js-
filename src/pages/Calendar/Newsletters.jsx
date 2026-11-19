/**
 * @file src/pages/Calendar/Newsletters.jsx
 * @description Presentational route page for `/newsletters`.
 * Renders the HTKY Temple Yearly Matrix (`Year | Month | Monthly Flyers | Quarterly Newsletters`)
 * for the current and previous years, opening `templatePDF` in a new tab on tap
 * and providing an optional flyer preview modal when `templatePreview` is available.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Critical Architectural Non-Negotiables #1, #2, #3, #4, and #5.
 */

import { useEffect, useState } from "react";
import {
  FileText,
  ExternalLink,
  Eye,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  useGetYearNewsletters,
  NEWSLETTER_MONTHS,
  NEWSLETTER_QUARTERS,
} from "../../hooks/queries/Calendar/useGetNewsletters";

/**
 * Renders a single Year table block (`Year | Month | Monthly Flyers | Quarterly Newsletters`)
 * matching the reference matrix while adhering to the HTKY Temple Crimson & Ivory theme.
 *
 * @param {{ year: number, onPreviewFlyer: (item: Object) => void }} props
 */
const YearNewsletterTable = ({ year, onPreviewFlyer }) => {
  const { data, isLoading, isError, refetch } = useGetYearNewsletters(year);
  const monthlyMap = data?.monthlyMap || {};
  const quarterlyMap = data?.quarterlyMap || {};

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
      {/* Error Banner if a specific year failed */}
      {isError && (
        <div
          role="alert"
          className="px-5 py-3 bg-red-50 border-b border-red-200 flex items-center justify-between gap-3 text-xs text-red-900"
        >
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-[#900000] shrink-0" />
            <span>Unable to load {year} flyers.</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#900000] text-white font-bold uppercase tracking-wider cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr className="bg-[#900000] text-white font-serif text-xs sm:text-sm tracking-wide">
              <th
                scope="col"
                className="py-3 px-4 font-bold border-r border-red-800/60 w-1/4"
              >
                Year
              </th>
              <th
                scope="col"
                className="py-3 px-4 font-bold border-r border-red-800/60 w-1/4"
              >
                Month
              </th>
              <th
                scope="col"
                className="py-3 px-4 font-bold border-r border-red-800/60 w-1/4"
              >
                Monthly Flyers
              </th>
              <th scope="col" className="py-3 px-4 font-bold w-1/4">
                Quarterly Newsletters
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-200 text-xs sm:text-sm">
            {NEWSLETTER_MONTHS.map((monthMeta, rowIdx) => {
              const flyer = monthlyMap[monthMeta.index] || null;
              const isQuarterStart = monthMeta.index % 3 === 0;
              const quarterMeta =
                NEWSLETTER_QUARTERS[monthMeta.quarterIndex] || null;
              const quarterlyItem =
                quarterlyMap[monthMeta.quarterIndex] || null;

              return (
                <tr
                  key={`${year}-${monthMeta.shortName}`}
                  className="hover:bg-amber-50/30 transition-colors"
                >
                  {/* Column 1: Year (Row-spanned across all 12 months) */}
                  {rowIdx === 0 && (
                    <td
                      rowSpan={12}
                      className="py-6 px-4 font-serif font-extrabold text-xl sm:text-2xl text-stone-900 bg-[#faf8f5]/70 border-r border-stone-200 align-middle"
                    >
                      {year}
                    </td>
                  )}

                  {/* Column 2: Month Name */}
                  <td className="py-2.5 px-4 font-medium text-stone-700 border-r border-stone-200">
                    {monthMeta.shortName}
                  </td>

                  {/* Column 3: Monthly Flyer Link (Opens templatePDF in new tab) */}
                  <td className="py-2.5 px-4 border-r border-stone-200">
                    {isLoading ? (
                      <div className="h-4 w-20 bg-stone-200 rounded animate-pulse mx-auto" />
                    ) : flyer?.targetUrl ? (
                      <div className="inline-flex items-center justify-center gap-2">
                        <a
                          href={flyer.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${monthMeta.fullName} ${year} Flyer PDF in new tab`}
                          className="inline-flex items-center gap-1 font-semibold text-[#900000] hover:text-[#6b0000] underline underline-offset-4 transition-colors"
                        >
                          <FileText
                            className="w-3.5 h-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{monthMeta.fullName}</span>
                          <ExternalLink
                            className="w-3 h-3 opacity-75 shrink-0"
                            aria-hidden="true"
                          />
                        </a>

                        {flyer.previewUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              onPreviewFlyer({
                                ...flyer,
                                displayTitle: `${monthMeta.fullName} ${year} Temple Flyer`,
                              })
                            }
                            title={`Preview ${monthMeta.fullName} ${year} Flyer`}
                            aria-label={`Preview ${monthMeta.fullName} ${year} Flyer`}
                            className="p-1 rounded-md text-stone-400 hover:text-[#900000] hover:bg-amber-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-stone-300 select-none">—</span>
                    )}
                  </td>

                  {/* Column 4: Quarterly Newsletters (Row-spanned every 3 months) */}
                  {isQuarterStart && quarterMeta && (
                    <td rowSpan={3} className="py-3 px-4 align-middle bg-white">
                      {isLoading ? (
                        <div className="h-4 w-28 bg-stone-200 rounded animate-pulse mx-auto" />
                      ) : quarterlyItem?.targetUrl ? (
                        <a
                          href={quarterlyItem.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${quarterMeta.label} ${year} Quarterly Newsletter PDF in new tab`}
                          className="inline-flex items-center justify-center gap-1.5 font-semibold text-[#900000] hover:text-[#6b0000] underline underline-offset-4 transition-colors"
                        >
                          <FileText
                            className="w-3.5 h-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{quarterMeta.label}</span>
                          <ExternalLink
                            className="w-3 h-3 opacity-75 shrink-0"
                            aria-hidden="true"
                          />
                        </a>
                      ) : (
                        <span className="text-stone-300 select-none">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const Newsletters = () => {
  const currentYear = new Date().getFullYear();
  const displayYears = [currentYear, currentYear - 1];

  const [previewFlyer, setPreviewFlyer] = useState(null);

  // Escape key listener for optional flyer image preview modal with strict cleanup
  useEffect(() => {
    if (!previewFlyer) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setPreviewFlyer(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewFlyer]);

  return (
    <section
      className="w-full min-h-screen bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top pb-20"
      aria-labelledby="newsletters-page-heading"
    >
      {/* 1. Page Header */}
      <header className="relative py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1
            id="newsletters-page-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mt-2 tracking-tight text-[#900000]"
          >
            Monthly Flyers & Newsletters
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 font-medium">
            Tap any active month or quarterly edition to open the official
            temple PDF flyer
          </p>
        </div>
      </header>

      {/* 2. Stacked Year Matrices (Current Year & Previous Year) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 space-y-8">
        {displayYears.map((yr) => (
          <YearNewsletterTable
            key={yr}
            year={yr}
            onPreviewFlyer={setPreviewFlyer}
          />
        ))}
      </main>

      {/* 3. Optional Flyer Image Preview Modal */}
      {previewFlyer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="newsletter-preview-modal-title"
          onClick={() => setPreviewFlyer(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
          >
            <div className="px-5 py-3.5 bg-[#faf8f5] border-b border-stone-200 flex items-center justify-between gap-4">
              <h2
                id="newsletter-preview-modal-title"
                className="text-sm sm:text-base font-serif font-bold text-[#900000] truncate"
              >
                {previewFlyer.displayTitle || previewFlyer.title}
              </h2>

              <div className="flex items-center gap-2 shrink-0">
                {previewFlyer.pdfUrl && (
                  <a
                    href={previewFlyer.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#900000] hover:bg-[#780000] text-white text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Open PDF</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewFlyer(null)}
                  aria-label="Close Flyer Preview"
                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-stone-100 overflow-y-auto flex items-center justify-center">
              <img
                src={previewFlyer.previewUrl}
                alt={previewFlyer.displayTitle || previewFlyer.title}
                className="max-h-[76vh] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Newsletters;

