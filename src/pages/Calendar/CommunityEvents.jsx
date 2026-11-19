/**
 * @file src/pages/Calendar/CommunityEvents.jsx
 * @description Presentational route page for `/community-events`.
 * Displays Temple Community Event flyers (`templatePreview` resolved via `BASE_URL`)
 * in a consistent, responsive gallery grid with an accessible full-screen flyer preview modal.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Critical Architectural Non-Negotiables #1, #2, #3, #4, and #5.
 */

import { useEffect, useState } from "react";
import {
  Calendar,
  Eye,
  FileText,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useGetCommunityEvents } from "../../hooks/queries/Calendar/useGetCommunityEvents";

const FALLBACK_FLYER_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="%23fdf6ee"/><text x="50%" y="46%" font-family="serif" font-size="22" font-weight="bold" fill="%23900000" text-anchor="middle">HTKY TEMPLE</text><text x="50%" y="54%" font-family="sans-serif" font-size="13" fill="%23854d0e" text-anchor="middle">Community Event Flyer</text></svg>';

/**
 * Isolated presentational flyer card for a single Community Event.
 *
 * @param {{ eventItem: Object, onPreview: (item: Object) => void }} props
 */
const CommunityEventCard = ({ eventItem, onPreview }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <article
      onClick={() => onPreview(eventItem)}
      className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between cursor-pointer"
    >
      {/* Flyer Preview Image Container */}
      <div className="relative bg-amber-50/60 overflow-hidden aspect-[4/5] flex items-center justify-center">
        <img
          src={
            !imageError && eventItem.imageUrl
              ? eventItem.imageUrl
              : FALLBACK_FLYER_IMAGE
          }
          alt={eventItem.title}
          loading="lazy"
          onError={() => setImageError(true)}
          className="w-full h-full object-contain bg-white transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {/* Subtle Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#900000] text-white text-xs font-bold uppercase tracking-wider shadow-md">
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            <span>View Flyer</span>
          </span>
        </div>
      </div>

      {/* Card Footer Bar (Consistent with Temple Card Styling) */}
      <div className="px-4 py-3 bg-[#faf8f5] border-t border-gray-100 flex items-center justify-between gap-2">
        {eventItem.dateLabel ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-600">
            <Calendar
              className="w-3.5 h-3.5 text-[#900000]"
              aria-hidden="true"
            />
            <span>{eventItem.dateLabel}</span>
          </span>
        ) : (
          <span className="text-[11px] font-serif font-bold text-[#900000] uppercase tracking-wide">
            Community Event
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreview(eventItem);
          }}
          aria-label={`View full flyer for ${eventItem.title}`}
          className="text-xs font-bold text-[#900000] hover:underline uppercase tracking-wider cursor-pointer"
        >
          Enlarge
        </button>
      </div>
    </article>
  );
};

export const CommunityEvents = () => {
  const {
    data: communityEvents = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetCommunityEvents();

  const [selectedFlyer, setSelectedFlyer] = useState(null);

  // Escape key listener for full-screen flyer preview modal with strict cleanup
  useEffect(() => {
    if (!selectedFlyer) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedFlyer(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFlyer]);

  return (
    <section
      className="w-full min-h-screen bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top pb-20"
      aria-labelledby="community-events-heading"
    >
      {/* 1. Page Header */}
      <header className="relative py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1
            id="community-events-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mt-2 tracking-tight text-[#900000]"
          >
            Community Events
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 font-medium">
            Explore cultural gatherings, special announcements, and upcoming
            temple community programs
          </p>
        </div>
      </header>

      {/* 2. Responsive Flyer Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {isLoading ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-busy="true"
            aria-label="Loading Community Events"
          >
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs animate-pulse"
              >
                <div className="aspect-[4/5] bg-gray-200 w-full" />
                <div className="p-4 flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="text-center py-14 bg-white rounded-2xl border border-red-200 p-8 shadow-xs max-w-xl mx-auto space-y-3"
          >
            <AlertCircle className="w-10 h-10 text-[#900000] mx-auto" />
            <h2 className="text-lg font-serif font-bold text-[#900000]">
              Unable to Load Community Events
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              {error?.message ||
                "We encountered a temporary network issue fetching community events. Please try again."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#900000] hover:bg-[#780000] text-white text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : communityEvents.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs max-w-xl mx-auto">
            <h2 className="text-lg font-serif font-bold text-gray-900">
              No Community Events Available
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Please check back soon for upcoming community event flyers and
              announcements.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communityEvents.map((eventItem) => (
              <CommunityEventCard
                key={eventItem.id}
                eventItem={eventItem}
                onPreview={setSelectedFlyer}
              />
            ))}
          </div>
        )}
      </main>

      {/* 3. Full-Screen Flyer Lightbox Modal */}
      {selectedFlyer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="community-flyer-modal-title"
          onClick={() => setSelectedFlyer(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#faf8f5] border-b border-gray-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <h2
                  id="community-flyer-modal-title"
                  className="text-sm sm:text-base font-serif font-bold text-[#900000] truncate"
                >
                  {selectedFlyer.title}
                </h2>
                {selectedFlyer.dateLabel && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-semibold shrink-0">
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                    {selectedFlyer.dateLabel}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedFlyer.pdfUrl && (
                  <a
                    href={selectedFlyer.pdfUrl}
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
                  onClick={() => setSelectedFlyer(null)}
                  aria-label="Close Flyer Preview"
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Full-Resolution Flyer Image */}
            <div className="p-4 bg-stone-100 overflow-y-auto flex items-center justify-center">
              <img
                src={selectedFlyer.imageUrl || FALLBACK_FLYER_IMAGE}
                alt={selectedFlyer.title}
                className="max-h-[76vh] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CommunityEvents;
