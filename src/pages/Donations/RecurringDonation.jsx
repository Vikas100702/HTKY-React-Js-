/**
 * @file src/pages/Donations/RecurringDonation.jsx
 * @description Presentational route page for `/recurring-donation`.
 * Fetches Recurring Donation offerings (`serviceCategoryTypes: "DONATIONS"`,
 * `serviceTypes: "RECURRING DONATIONS"`) via `useGetRecurringDonations` and
 * reuses `UniversalServiceCard` and `CommonCartFooter` with full backend rules.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Critical Architectural Non-Negotiables #1, #2, #3, #4, and #5.
 */

import { useEffect, useMemo, useState } from "react";
import { useGetRecurringDonations } from "../../hooks/queries/Donations/useGetRecurringDonations";
import { useGetClientSettings } from "../../hooks/queries/Donations/useGetDonations";
import { useServicesStore } from "../../store/useServicesStore";
import { UniversalServiceCard } from "../../components/shared/UniversalServiceCard";
import { CommonCartFooter } from "../../components/shared/CommonCartFooter";

export const RecurringDonation = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: recurringDonations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetRecurringDonations();

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

  const filteredDonations = useMemo(() => {
    if (!searchQuery.trim()) return recurringDonations;
    const q = searchQuery.toLowerCase().trim();
    return recurringDonations.filter(
      (item) =>
        (item.title || "").toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q),
    );
  }, [recurringDonations, searchQuery]);

  return (
    <section
      className="w-full min-h-screen bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top pb-28"
      aria-labelledby="recurring-donation-heading"
    >
      {/* 1. Header Title */}
      <header className="relative py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1
            id="recurring-donation-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mt-2 tracking-tight text-[#900000]"
          >
            Recurring Donations
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 font-medium">
            Contribute towards ongoing temple sustenance, sacred rituals, and
            community initiatives
          </p>
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
              placeholder="Search recurring donations..."
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

      {/* 4. Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {isLoading ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-busy="true"
            aria-label="Loading Recurring Donations"
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
              Unable to Load Recurring Donations
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {error?.message ||
                "We encountered a temporary network issue fetching recurring donations. Please try again."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-5 px-6 py-2.5 rounded-xl bg-[#900000] hover:bg-[#780000] text-white text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs max-w-xl mx-auto">
            <h2 className="text-lg font-bold text-gray-900">
              No Recurring Donations Found
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              No active recurring donation options match your current search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDonations.map((service) => (
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

export default RecurringDonation;


