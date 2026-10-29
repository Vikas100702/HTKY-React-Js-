import { useEffect, useMemo } from "react";
import {
  useGetServices,
  IN_TEMPLE_CATEGORY,
} from "../../hooks/queries/Services/useGetServices";
import { useServicesStore } from "../../store/useServicesStore";
import { UniversalServiceCard } from "../../components/shared/UniversalServiceCard";

export const Services = () => {
  const {
    data: services = [],
    isLoading: isServicesLoading,
    isError,
    error,
  } = useGetServices();

  const searchQuery = useServicesStore((state) => state.searchQuery);
  const setSearchQuery = useServicesStore((state) => state.setSearchQuery);
  const setSelectedCategory = useServicesStore(
    (state) => state.setSelectedCategory,
  );
  const getTotalCartCount = useServicesStore(
    (state) => state.getTotalCartCount,
  );
  const getTotalCartAmount = useServicesStore(
    (state) => state.getTotalCartAmount,
  );
  const activeToast = useServicesStore((state) => state.activeToast);
  const clearToast = useServicesStore((state) => state.clearToast);
  const showToast = useServicesStore((state) => state.showToast);

  useEffect(() => {
    setSelectedCategory(IN_TEMPLE_CATEGORY);
  }, [setSelectedCategory]);

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        clearToast();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [activeToast, clearToast]);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.toLowerCase().trim();
    return services.filter(
      (s) =>
        (s.title || "").toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q),
    );
  }, [services, searchQuery]);

  const cartCount = getTotalCartCount();
  const cartAmount = getTotalCartAmount();

  const handleCheckoutClick = () => {
    if (cartCount === 0) {
      showToast("Please select at least one service to checkout.", "warning");
      return;
    }
    alert(
      `Proceeding to checkout with ${cartCount} service(s) totaling $${cartAmount.toFixed(2)}`,
    );
  };

  return (
    <section className="w-full min-h-screen bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top pb-28">
      {/* 1. Header Title */}
      <section className="relative text-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mt-2 tracking-tight text-[#900000]">
            Temple Sponsored Pujas
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 font-medium">
            Book auspicious poojas and religious rituals conducted inside the
            temple premises
          </p>
        </div>
      </section>

      {/* 2. Validation / Warning Alert Banner */}
      {activeToast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
          <div
            className={`flex items-center justify-between p-4 rounded-r-xl shadow-sm border-l-4 animate-in fade-in ${
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
              className="text-gray-500 hover:text-gray-700 p-1 rounded-md text-xs font-bold"
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
              placeholder="Search temple pooja services..."
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
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Content Grid / Loading / Error / Empty States */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {isServicesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="text-center py-16 bg-white rounded-2xl border border-red-200 p-8 shadow-xs">
            <svg
              className="w-12 h-12 text-red-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-bold text-gray-900 mt-4">
              Unable to Load Services
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              {error?.message ||
                "We encountered a temporary network issue fetching temple services. Please try again."}
            </p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 font-serif text-xl font-bold">
              ॐ
            </div>
            <h3 className="text-lg font-bold text-gray-900 mt-4">
              No Services Found
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              {searchQuery
                ? `No services matched "${searchQuery}". Try a different search query.`
                : "There are currently no active in-temple services available."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <UniversalServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </main>

      {/* 5. Persistent Aggregated Bottom Checkout Bar */}
      <footer className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl py-3.5 px-4 sm:px-8 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 font-bold text-sm">
              {cartCount}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Total Amount
              </p>
              <p className="text-lg sm:text-2xl font-serif font-bold text-gray-900 leading-tight">
                ${cartAmount.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckoutClick}
            disabled={cartCount === 0}
            className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 shadow-sm cursor-pointer ${
              cartCount > 0
                ? "bg-[#900000] text-amber-300 hover:bg-[#7a0000] active:scale-95 shadow-amber-900/10"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Proceed to Checkout
          </button>
        </div>
      </footer>
    </section>
  );
};
