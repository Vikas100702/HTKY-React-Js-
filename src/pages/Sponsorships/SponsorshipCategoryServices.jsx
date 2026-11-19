import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetSponsorshipServices } from "../../hooks/queries/Services/Sponsorship/useGetSponsorships";
import { useGetClientSettings } from "../../hooks/queries/Donations/useGetDonations";
import { useServicesStore } from "../../store/useServicesStore";
import { UniversalServiceCard } from "../../components/shared/UniversalServiceCard";
import { CommonCartFooter } from "../../components/shared/CommonCartFooter";

/**
 * Formats an uppercase backend `refDataName` (e.g. `"ANNUAL PUJAS"`) into
 * clean Title Case (`"Annual Pujas"`) for display headings.
 *
 * @param {string} rawText
 * @returns {string}
 */
const formatDisplayHeading = (rawText) => {
  if (!rawText || typeof rawText !== "string") return "Sponsorships";
  return rawText
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const SponsorshipCategoryServices = () => {
  const navigate = useNavigate();
  const { serviceType = "" } = useParams();

  const decodedServiceType = useMemo(() => {
    try {
      return decodeURIComponent(serviceType).trim();
    } catch {
      return String(serviceType || "").trim();
    }
  }, [serviceType]);

  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: sponsorshipServices = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetSponsorshipServices(decodedServiceType);

  const { data: clientSettings } = useGetClientSettings();
  const currencySymbol = clientSettings?.generalSetting?.currencySymbol || "$";

  const activeToast = useServicesStore((state) => state.activeToast);
  const clearToast = useServicesStore((state) => state.clearToast);

  useEffect(() => {
    if (!activeToast) return undefined;
    const timer = setTimeout(() => {
      clearToast();
    }, 3500);
    return () => clearTimeout(timer);
  }, [activeToast, clearToast]);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return sponsorshipServices;
    const q = searchQuery.toLowerCase().trim();
    return sponsorshipServices.filter(
      (s) =>
        (s.title || "").toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q),
    );
  }, [sponsorshipServices, searchQuery]);

  const pageHeading = formatDisplayHeading(decodedServiceType);

  return (
    <section
      className="w-full min-h-screen bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top pb-28"
      aria-labelledby="sponsorship-category-heading"
    >
      {/* 1. Back Navigation & Category Title */}
      <header className="relative py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-start pt-2">
            <button
              type="button"
              onClick={() => navigate("/sponsorships")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-gray-200 text-xs sm:text-sm font-bold text-[#900000] shadow-xs transition-colors cursor-pointer"
            >
              <span aria-hidden="true">←</span>
              <span>Back to Sponsorships</span>
            </button>
          </div>

          <div className="text-center mt-2">
            <h1
              id="sponsorship-category-heading"
              className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#900000]"
            >
              {pageHeading}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 font-medium">
              Select your desired sponsorship offering, preferred date, and
              details below
            </p>
          </div>
        </div>
      </header>

      {/* 2. Validation / Warning Alert Banner */}
      {activeToast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
          <div
            className={`flex items-center justify-between p-4 rounded-r-xl shadow-sm border-l-4 ${
              activeToast.type === "warning"
                ? "bg-amber-50 border-amber-600 text-amber-900"
                : activeToast.type === "success"
                  ? "bg-emerald-50 border-emerald-600 text-emerald-900"
                  : "bg-red-50 border-red-600 text-red-900"
            }`}
            role="alert"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">
                {activeToast.type === "warning"
                  ? "⚠️"
                  : activeToast.type === "success"
                    ? "✅"
                    : "🛑"}
              </span>
              <span className="text-xs sm:text-sm font-medium">
                {activeToast.message}
              </span>
            </div>
            <button
              type="button"
              onClick={clearToast}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-md text-xs font-bold cursor-pointer"
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. Controls Bar: Full Width Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="w-full pb-6 border-b border-gray-200">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${pageHeading.toLowerCase()}...`}
              className="w-full pl-9 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#900000] focus:border-transparent transition-all shadow-xs"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Sponsorship Offerings Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {isLoading ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-busy="true"
            aria-label="Loading Sponsorship Offerings"
          >
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs animate-pulse"
              >
                <div className="h-48 bg-gray-200 w-full" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded-md w-3/4" />
                  <div className="h-4 bg-gray-200 rounded-md w-1/3" />
                  <div className="h-4 bg-gray-200 rounded-md w-full" />
                  <div className="h-4 bg-gray-200 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="text-center py-16 bg-white rounded-2xl border border-red-200 p-8 shadow-xs max-w-xl mx-auto"
          >
            <h2 className="text-lg font-bold text-gray-900">
              Unable to Load {pageHeading}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
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
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs max-w-xl mx-auto">
            <h2 className="text-lg font-bold text-gray-900">
              No Sponsorship Offerings Found
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              No active items match your current filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <UniversalServiceCard
                key={service.id}
                service={service}
                currencySymbol={currencySymbol}
              />
            ))}
          </div>
        )}
      </main>

      {/* 5. Reusable Common Cart Footer */}
      <CommonCartFooter checkoutPath="/checkout" />
    </section>
  );
};

export default SponsorshipCategoryServices;
