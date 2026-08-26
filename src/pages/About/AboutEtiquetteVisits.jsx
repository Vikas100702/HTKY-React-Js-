/**
 * @file src/pages/About/TempleEtiquette.jsx
 * @description Renders the Temple Etiquette, Tours, and Dress Code section.
 * Features a dynamic Tabbed UI and strictly avoids useEffect for state syncing (Derived State).
 */

import { useState, useMemo } from "react";
import { useGetEtiquetteVisit } from "../../hooks/queries/About/useGetEtiquetteVisits";
import { APP_COLORS } from "../../constants/appColors";

// Fallback divider image (consistent with your other pages)
import dividerImg from "../../assets/border2.png";

export const AboutEtiquetteVisit = () => {
  // 1. Fetch Server State
  const { data: etiquetteVisitData, isLoading, isError } = useGetEtiquetteVisit();

  // 2. Local UI State for Tab Selection
  const [selectedTab, setSelectedTab] = useState("");

  // 3. Extract Categories for Tabs dynamically
  const categories = useMemo(() => {
    if (!etiquetteVisitData || !Array.isArray(etiquetteVisitData)) return [];
    return etiquetteVisitData.map((item) => item.category).filter(Boolean);
  }, [etiquetteVisitData]);

  // 4. Derived State: Auto-resolve Active Tab WITHOUT useEffect (Performance Optimized)
  const activeCategory =
    selectedTab || (categories.length > 0 ? categories[0] : "");

  // 5. Get Content strictly for the Active Category
  const activeContent = useMemo(() => {
    if (!etiquetteVisitData || !activeCategory) return [];
    const activeGroup = etiquetteVisitData.find(
      (group) => group.category === activeCategory,
    );
    return activeGroup?.items || [];
  }, [etiquetteVisitData, activeCategory]);

  // ==========================================
  // SKELETON LOADER (Sub-100ms Perceived Performance)
  // ==========================================
  if (isLoading) {
    return (
      <section className="w-full py-12 lg:py-20 bg-white min-h-[60vh]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="flex flex-col items-center mb-10 animate-pulse">
            <div className="h-10 w-64 bg-gray-200 rounded mb-4" />
            <div className="h-2 w-32 bg-gray-200 rounded" />
          </div>
          {/* Tabs Skeleton */}
          <div className="flex gap-1 mb-0 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 w-32 sm:w-40 bg-gray-200 rounded-t-lg"
              />
            ))}
          </div>
          {/* Content Box Skeleton */}
          <div className="bg-white p-8 rounded-b-xl rounded-tr-xl border border-gray-200 shadow-sm min-h-[300px] animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
            <div className="h-4 bg-gray-200 rounded w-full mt-6" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </section>
    );
  }

  // ==========================================
  // ERROR / EMPTY STATE
  // ==========================================
  if (isError || !categories.length) {
    return (
      <section className="w-full py-20 flex justify-center items-center bg-white">
        <p className="text-lg font-semibold text-gray-500">
          Etiquette & Visit details are currently unavailable.
        </p>
      </section>
    );
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <section className="w-full py-12 lg:py-20 bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-cover bg-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Page Header matching Screenshots */}
        <div className="text-center mb-10 flex flex-col items-center">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-wide"
            style={{
              color: APP_COLORS.primary || "#900000",
              fontFamily: "Georgia, serif",
            }}
          >
            Temple Etiquette and Visits
          </h2>
          {/* Decorative Divider */}
          <img
            src={dividerImg}
            alt="divider"
            className="mt-3 w-32 md:w-48 h-auto opacity-80 pointer-events-none"
            loading="lazy"
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>

        {/* 2. Dynamic Tabs Row */}
        <div className="flex flex-wrap gap-1 mb-0 relative z-10">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedTab(category)}
              className={`px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold uppercase transition-all duration-300 rounded-t-lg border-t border-x outline-none focus:outline-none ${
                activeCategory === category
                  ? "bg-[#900000] text-white border-[#900000] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]" // Active State
                  : "bg-[#e2e4e9] text-gray-700 border-[#d1d5db] hover:bg-[#d1d5db]" // Inactive State
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 3. Main Content Box */}
        <div className="bg-white border border-gray-200 rounded-b-xl rounded-tr-xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] p-6 sm:p-8 md:p-10 w-full relative z-20">
          <ul
            className={`text-base md:text-lg text-gray-800 leading-relaxed font-medium ${
              activeCategory === "TEMPLE TOURS"
                ? "space-y-5" // Normal paragraphs spacing for Tours
                : "list-disc list-outside pl-5 space-y-4 marker:text-gray-400" // Bullet points for Etiquette & Dress Code
            }`}
          >
            {activeContent.map((item) => (
              <li
                key={item.id}
                className={
                  activeCategory === "TEMPLE TOURS" ? "list-none" : "pl-1"
                }
              >
                {/* Handling \n line breaks gracefully from raw data */}
                {item.text.split("\n").map((line, idx, arr) => (
                  <span key={idx}>
                    {line}
                    {idx !== arr.length - 1 && <br />}
                  </span>
                ))}
              </li>
            ))}
          </ul>

          {/* Failsafe if a category has no active data */}
          {activeContent.length === 0 && (
            <p className="text-gray-500 text-center py-6 font-medium italic">
              No content available for this section.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
