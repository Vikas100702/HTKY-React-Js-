import { useState, useMemo } from "react";
import { useGetEtiquetteVisit } from "../../hooks/queries/About/useGetEtiquetteVisits";
import { APP_COLORS } from "../../constants/appColors";
import dividerImg from "../../assets/border2.png";

export const AboutEtiquetteVisit = () => {
  const {
    data: etiquetteVisitData,
    isLoading,
    isError,
  } = useGetEtiquetteVisit();

  const [selectedTab, setSelectedTab] = useState("");

  // Extract Categories for Tabs dynamically
  const categories = useMemo(() => {
    if (!etiquetteVisitData || !Array.isArray(etiquetteVisitData)) return [];
    return etiquetteVisitData.map((item) => item.category).filter(Boolean);
  }, [etiquetteVisitData]);

  // Derived State: Auto-resolve Active Tab WITHOUT useEffect
  const activeCategory =
    selectedTab || (categories.length > 0 ? categories[0] : "");

  // Get Content strictly for the Active Category
  const activeContent = useMemo(() => {
    if (!etiquetteVisitData || !activeCategory) return [];
    const activeGroup = etiquetteVisitData.find(
      (group) => group.category === activeCategory,
    );
    return activeGroup?.items || [];
  }, [etiquetteVisitData, activeCategory]);

  const primaryColor = APP_COLORS?.primary || "#900000";

  if (isLoading) {
    return (
      <section className="w-full py-16 lg:py-24 bg-slate-50/50 min-h-[60vh]">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-16 space-y-10">
          <div className="flex flex-col items-center animate-pulse space-y-3">
            <div className="h-10 w-72 bg-gray-200 rounded-xl" />
            <div className="h-4 w-40 bg-gray-200 rounded-lg" />
          </div>

          <div className="flex gap-3 justify-center animate-pulse overflow-x-auto py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 w-36 sm:w-44 bg-gray-200 rounded-full flex-shrink-0"
              />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 h-36 rounded-2xl shadow-sm" />
            ))}
          </div>
        </div>
      </section>
    );
  }


  // ERROR / EMPTY STATE

  if (isError || !categories.length) {
    return (
      <section className="w-full py-24 flex justify-center items-center bg-white">
        <div className="p-8 rounded-2xl bg-amber-50/60 border border-amber-200/60 max-w-md text-center shadow-sm">
          <p className="text-lg font-semibold text-gray-700">
            Etiquette & Visit details are currently unavailable.
          </p>
        </div>
      </section>
    );
  }

  // Layout condition based on category type
  const isTourCategory = activeCategory?.toUpperCase().includes("TOUR");

  return (
    <section className="w-full py-12 lg:py-20 bg-[url('/src/assets/pattern-bg.jpg')] bg-repeat bg-fill bg-top">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-16 space-y-12">
        {/* Page Header */}
        <div className="text-center flex flex-col items-center space-y-3 max-w-3xl mx-auto">
          <span
            className="text-xs sm:text-sm font-bold tracking-widest uppercase px-4 py-1.5 rounded-full bg-amber-100/70 border border-amber-200/80 inline-block"
            style={{ color: primaryColor }}
          >
            Visitor Guidelines & Information
          </span>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif leading-tight"
            style={{ color: primaryColor }}
          >
            Temple Etiquette and Visits
          </h1>
          <img
            src={dividerImg}
            alt="divider"
            className="w-36 md:w-52 h-auto opacity-80 pointer-events-none pt-1"
            loading="lazy"
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>

        {/* Floating Pill Tabs Navigation */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 gap-2 bg-white/80 backdrop-blur-md rounded-2xl border border-amber-100 shadow-lg shadow-amber-950/5 overflow-x-auto max-w-full">
            {categories.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedTab(category)}
                  className={`px-5 py-2.5 text-xs sm:text-sm font-bold tracking-wide uppercase transition-all duration-300 rounded-xl whitespace-nowrap outline-none focus:outline-none ${
                    isActive
                      ? "text-white shadow-md scale-[1.02]"
                      : "text-gray-600 hover:text-gray-900 hover:bg-amber-50/60"
                  }`}
                  style={{
                    backgroundColor: isActive ? primaryColor : "transparent",
                  }}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Cards Grid Display */}
        <div className="w-full">
          {activeContent.length > 0 ? (
            isTourCategory ? (
              /* Temple Tours: Multi-column Card Layout */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeContent.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-6 sm:p-8 rounded-2xl bg-white border border-amber-100 shadow-md shadow-amber-950/5 hover:shadow-xl hover:border-amber-300 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs text-white shadow-sm"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {idx + 1}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 font-serif">
                          {activeCategory} Information
                        </h3>
                      </div>
                      <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-medium">
                        {item.text.split("\n").map((line, lineIdx, arr) => (
                          <span key={lineIdx}>
                            {line}
                            {lineIdx !== arr.length - 1 && (
                              <br className="my-1" />
                            )}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Etiquette & Rules: Modern Bento Grid with Indexed Badges */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeContent.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="group p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all duration-300 flex items-start gap-4"
                  >
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-xl font-bold text-sm text-white flex-shrink-0 transition-transform group-hover:scale-110 shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {idx + 1}
                    </div>
                    <div className="text-base sm:text-lg text-gray-700 leading-relaxed font-medium pt-0.5">
                      {item.text.split("\n").map((line, lineIdx, arr) => (
                        <span key={lineIdx}>
                          {line}
                          {lineIdx !== arr.length - 1 && (
                            <br className="my-1" />
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Empty Section State */
            <div className="p-12 text-center rounded-2xl bg-white border border-gray-100 shadow-sm max-w-lg mx-auto">
              <p className="text-gray-500 font-medium italic">
                No content available for this section.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
