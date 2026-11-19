import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetSponsorships } from "../../hooks/queries/Services/Sponsorship/useGetSponsorships";

const FALLBACK_SPONSORSHIP_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="%23fdf6ee"/><text x="50%" y="48%" font-family="serif" font-size="20" font-weight="bold" fill="%23900000" text-anchor="middle">HTKY TEMPLE</text><text x="50%" y="62%" font-family="sans-serif" font-size="12" fill="%23854d0e" text-anchor="middle">Temple Sponsorship</text></svg>';

const SponsorshipCard = ({ item, onSponsorNow }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Sponsorship Image */}
        <div className="relative h-52 bg-amber-50 overflow-hidden">
          <img
            src={
              !imageError && item.imageUrl
                ? item.imageUrl
                : FALLBACK_SPONSORSHIP_IMAGE
            }
            alt={item.title}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Sponsorship Name */}
        <div className="px-5 pt-5 pb-3 text-center">
          <h2 className="font-serif font-bold text-gray-900 text-lg sm:text-xl leading-snug">
            {item.title}
          </h2>
        </div>
      </div>

      {/* Sponsor Now CTA */}
      <div className="px-5 pb-6 pt-2 flex justify-center">
        <button
          type="button"
          onClick={() => onSponsorNow(item)}
          aria-label={`Sponsor Now - ${item.title}`}
          className="w-full sm:w-auto min-w-[160px] px-6 py-2.5 rounded-xl bg-[#900000] hover:bg-[#780000] text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-xs transition-all transform active:scale-95 cursor-pointer"
        >
          Sponsor Now
        </button>
      </div>
    </article>
  );
};

export const Sponsorships = () => {
  const navigate = useNavigate();
  const {
    data: sponsorships = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetSponsorships();

  const handleSponsorNow = (item) => {
    const targetRefDataName = String(
      item?.refDataName || item?.title || "",
    ).trim();
    if (!targetRefDataName) return;
    navigate(`/sponsorships/${encodeURIComponent(targetRefDataName)}`);
  };

  return (
    <section
      className="w-full min-h-screen bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top pb-20"
      aria-labelledby="sponsorships-page-heading"
    >
      {/* 1. Page Header */}
      <header className="relative py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1
            id="sponsorships-page-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mt-2 tracking-tight text-[#900000]"
          >
            Sponsorships
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 font-medium">
            Support sacred temple rituals, annual pujas, and community sevas
          </p>
        </div>
      </header>

      {/* 2. Responsive Sponsorship Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {isLoading ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-busy="true"
            aria-label="Loading Sponsorships"
          >
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs animate-pulse"
              >
                <div className="h-52 bg-gray-200 w-full" />
                <div className="p-5 space-y-4 flex flex-col items-center">
                  <div className="h-5 bg-gray-200 rounded-md w-2/3" />
                  <div className="h-10 bg-gray-200 rounded-xl w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="text-center py-14 bg-white rounded-2xl border border-red-200 p-8 shadow-xs max-w-xl mx-auto"
          >
            <h2 className="text-lg font-serif font-bold text-[#900000]">
              Unable to Load Sponsorships
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              {error?.message ||
                "We encountered a temporary network issue fetching sponsorships. Please try again."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-5 px-6 py-2.5 rounded-xl bg-[#900000] hover:bg-[#780000] text-white text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : sponsorships.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs max-w-xl mx-auto">
            <h2 className="text-lg font-serif font-bold text-gray-900">
              No Sponsorships Available
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Please check back soon for upcoming temple sponsorship
              opportunities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sponsorships.map((item) => (
              <SponsorshipCard
                key={item.id}
                item={item}
                onSponsorNow={handleSponsorNow}
              />
            ))}
          </div>
        )}
      </main>
    </section>
  );
};

export default Sponsorships;

