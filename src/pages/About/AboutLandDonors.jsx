import { useState } from "react";
import { useGetLandDonors } from "../../hooks/queries/About/useGetLandDonors"; // Adjust path as needed

export const AboutLandDonors = () => {
  // Fetch data using our robust custom hook
  const { data: donorCategories, isLoading, isError } = useGetLandDonors();

  // State to track the currently active tab (defaults to the first category)
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // ------------------------------------------
  // LOADING & ERROR STATES
  // ------------------------------------------
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#980000]"></div>
      </div>
    );
  }

  if (isError || !donorCategories || donorCategories.length === 0) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        Unable to load donor information at this time.
      </div>
    );
  }

  // Safely extract the currently active category data
  const activeCategoryData = donorCategories[activeTabIndex];

  // ------------------------------------------
  // RENDER UI
  // ------------------------------------------
  return (
    <div className="w-full max-w-7xl mx-auto p-4 font-sans">
      {/* TAB HEADERS */}
      <div className="flex gap-1 mb-0">
        {donorCategories.map((categoryObj, index) => {
          const isActive = activeTabIndex === index;
          return (
            <button
              key={`tab-${index}`}
              onClick={() => setActiveTabIndex(index)}
              className={`px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-[#A30000] text-white rounded-t-md shadow-md" // Active Tab Styles
                  : "bg-white text-gray-700 hover:bg-gray-100 rounded-t-md border-t border-x border-gray-200" // Inactive Tab Styles
              }`}
            >
              {categoryObj.category.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT CONTAINER */}
      <div className="bg-[#FCF8F8] border border-gray-200 rounded-b-md rounded-tr-md p-6 md:p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#4A2B32] mb-8">
          List Of {activeCategoryData?.category || "Donors"}
        </h2>

        {/* DONOR CARDS GRID */}
        {activeCategoryData?.items && activeCategoryData.items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {activeCategoryData.items.map((donor) => (
              <div
                key={donor.id}
                className="bg-[#FFEFE3] border border-[#F4D9C9] rounded-md p-5 shadow-sm flex items-center min-h-[80px] hover:shadow-md transition-shadow duration-200"
              >
                <span className="font-bold text-gray-900 text-sm md:text-base">
                  {donor.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 italic py-8 text-center">
            No donors found for this category.
          </div>
        )}
      </div>
    </div>
  );
};
