/**
 * @file src/pages/About/AboutBoardCommittee.jsx
 * @description Renders the Board & Committee directory with dynamic Category Tabs
 * and grouped Sub-sections (mgmtGroupType) in a responsive 3-column grid.
 * Fixed: Removed useEffect to prevent cascading renders using Derived State.
 */
import { useState, useMemo } from "react";
import { User } from "lucide-react";
import { useGetBC } from "../../hooks/queries/About/useGetBoardCommittee";
import { APP_COLORS } from "../../constants/appColors";

export const AboutBoardCommittee = () => {
  // 1. Fetch Server State
  const { data: bcData, isLoading, isError } = useGetBC();

  // 2. Local UI State for User Selection (Empty by default)
  const [selectedTab, setSelectedTab] = useState("");

  // 3. Extract unique Categories for Tabs
  const categories = useMemo(() => {
    if (!bcData || !Array.isArray(bcData)) return [];
    return [...new Set(bcData.map((item) => item.mgmtCategory))].filter(
      Boolean,
    );
  }, [bcData]);

  // 4. Derived State: Auto-resolve Active Tab (NO useEffect needed!)
  // If user hasn't clicked anything yet, fallback to the 0th category.
  const activeTab = selectedTab || (categories.length > 0 ? categories[0] : "");

  // 5. Group data by mgmtGroupType strictly for the currently Active Tab
  const groupedData = useMemo(() => {
    if (!bcData || !activeTab) return {};

    const filteredByTab = bcData.filter(
      (item) => item.mgmtCategory === activeTab,
    );

    return filteredByTab.reduce((acc, item) => {
      const group = item.mgmtGroupType || "Members";
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {});
  }, [bcData, activeTab]);

  // ==========================================
  // SKELETON LOADER (Sub-100ms Performance)
  // ==========================================
  if (isLoading) {
    return (
      <section className="w-full py-16 bg-[#fdfbf7] min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs Skeleton */}
          <div className="flex gap-2 mb-0">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 w-40 bg-gray-200 rounded-t-lg animate-pulse"
              />
            ))}
          </div>
          {/* Container Skeleton */}
          <div className="bg-white p-8 rounded-b-xl rounded-tr-xl border border-gray-200 shadow-sm">
            <div className="h-8 w-64 bg-gray-200 rounded mb-6 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 border rounded-lg animate-pulse bg-gray-50"
                >
                  <div className="w-16 h-16 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2 py-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ==========================================
  // ERROR / EMPTY STATE
  // ==========================================
  if (isError || !bcData || bcData.length === 0) {
    return (
      <section className="w-full py-20 flex justify-center items-center bg-[#fdfbf7]">
        <p className="text-lg font-semibold text-gray-500">
          Board & Committee details are currently unavailable.
        </p>
      </section>
    );
  }

  // ==========================================
  // MAIN RENDER (Dynamic Tabs & Grid)
  // ==========================================
  return (
    <section className="w-full py-12 lg:py-16 bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Dynamic Tabs Row */}
        <div className="flex flex-wrap gap-1 mb-0 relative z-10">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedTab(category)}
              className={`px-5 py-3 text-xs md:text-sm font-bold uppercase transition-all duration-300 rounded-t-lg border-t border-x outline-none focus:outline-none ${
                activeTab === category
                  ? "bg-[#900000] text-white border-[#900000] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
                  : "bg-[#e2e4e9] text-gray-700 border-[#d1d5db] hover:bg-[#d1d5db]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 2. Main Content Box */}
        <div className="bg-white border border-gray-200 rounded-b-xl rounded-tr-xl shadow-lg p-6 sm:p-8 md:p-10 w-full relative z-20">
          {/* Render Grouped Sections for Active Tab */}
          {Object.entries(groupedData).map(([groupName, members]) => (
            <div key={groupName} className="mb-12 last:mb-0">
              {/* Inner Heading */}
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 border-b pb-2 capitalize">
                {groupName}
              </h3>

              {/* 3-Column Responsive Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center p-3 sm:p-4 bg-[#fef6f1] border rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
                    style={{
                      borderColor: APP_COLORS.primary,
                    }}
                  >
                    {/* Avatar Left */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 mr-4">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover rounded-full shadow-sm border-[3px] border-white bg-white"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center border-[3px] border-white shadow-sm">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Info Right */}
                    <div className="flex flex-col overflow-hidden justify-center space-y-0.5">
                      <span
                        className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate"
                        style={{ color: APP_COLORS.primary || "#900000" }}
                      >
                        {member.designation}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-gray-900 truncate">
                        {member.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Failsafe */}
          {Object.keys(groupedData).length === 0 && (
            <p className="text-gray-500 text-center py-10 font-medium">
              No active members found for this category.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
