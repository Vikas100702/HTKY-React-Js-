import { useState } from "react";
import { Phone, Languages, ChevronDown, ChevronUp } from "lucide-react";
import { useGetAboutDeity } from "../../hooks/queries/About/useGetAboutDeity";
import { APP_COLORS } from "../../constants/appColors";

export const AboutDeity = () => {
  const { data: deities, isLoading, isError } = useGetAboutDeity();

  // Local State to track expanded cards
  const [expandedCards, setExpandedCards] = useState({});

  const toggleExpand = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Skeleton Loader
  if (isLoading) {
    return (
      <section className="w-full py-16 bg-[#fdfbf7] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-center"
            >
              <div className="w-20 h-20 bg-gray-200 rounded-lg" />
              <div className="w-full space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Error / Empty State
  if (isError || !deities || deities.length === 0) {
    return (
      <section className="w-full py-20 flex justify-center items-center bg-[#fdfbf7]">
        <p className="text-lg font-semibold text-gray-500">
          Deity details are currently unavailable.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full py-12 lg:py-16 bg-[url('/src/assets/pattern-bg.jpg')]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-extrabold uppercase tracking-wide inline-block border-b-4 pb-2"
            style={{
              color: APP_COLORS.primary,
              borderColor: APP_COLORS.secondary,
            }}
          >
            ABOUT DEITIES
          </h2>
        </div>

        {/* Dynamic Card List */}
        <div className="space-y-6 lg:space-y-8">
          {deities.map((deity, index) => {
            const cardId = deity.id || index;
            const isExpanded = expandedCards[cardId];

            return (
              <div
                key={cardId}
                onClick={() => toggleExpand(cardId)}
                className={`flex ${
                  isExpanded
                    ? "flex-col md:flex-row gap-6 md:gap-10 p-6 sm:p-8 lg:p-10" // EXPANDED: Bada Padding & Stack on Mobile
                    : "flex-row gap-4 p-4 items-center" // COLLAPSED: Chota Padding & Row on Mobile
                } bg-white rounded-xl shadow-md border transition-all duration-500 ease-in-out hover:shadow-lg group cursor-pointer overflow-hidden`}
                style={{ borderColor: APP_COLORS.primary }}
              >
                {/* 📸 IMAGE SECTION */}
                <div
                  className={`${
                    isExpanded
                      ? "w-full md:w-1/3 lg:w-[30%]"
                      : "w-20 sm:w-24 md:w-32" // COLLAPSED
                  } flex-shrink-0 transition-all duration-500 ease-in-out`}
                >
                  <div
                    className={`relative w-full overflow-hidden shadow-sm border-2 transition-all duration-500 ease-in-out ${
                      isExpanded
                        ? "aspect-[3/4] md:aspect-auto md:h-80 lg:h-96 rounded-lg" // EXPANDED
                        : "aspect-square rounded-full md:rounded-lg" // COLLAPSED
                    }`}
                    style={{ borderColor: APP_COLORS.secondary }}
                  >
                    {deity.image ? (
                      <img
                        src={deity.image}
                        alt={deity.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span
                          className={`${isExpanded ? "text-sm" : "text-[10px]"} text-gray-400 font-medium text-center px-1`}
                        >
                          No Image
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* DETAILS SECTION */}
                <div
                  className={`flex flex-col ${
                    isExpanded ? "w-full md:w-2/3 lg:w-[70%]" : "flex-1"
                  } transition-all duration-500 ease-in-out`}
                >
                  {/* Title */}
                  <div className="flex justify-between items-center w-full">
                    <h3
                      className={`font-extrabold tracking-wide transition-all duration-500 ${
                        isExpanded
                          ? "text-2xl md:text-3xl"
                          : "text-sm md:text-xl"
                      }`}
                      style={{ color: APP_COLORS.primary }}
                    >
                      {deity.name}
                    </h3>
                    <div
                      className="p-1.5 md:p-2 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors flex-shrink-0"
                      style={{ color: APP_COLORS.primary }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 md:w-6 md:h-6" />
                      ) : (
                        <ChevronDown className="w-5 h-5 md:w-6 md:h-6" />
                      )}
                    </div>
                  </div>
                  <div
                    className={`grid transition-all duration-500 ease-in-out ${
                      isExpanded
                        ? "grid-rows-[1fr] opacity-100 mt-5" // EXPANDED
                        : "grid-rows-[0fr] opacity-0 mt-0" // COLLAPSED
                    }`}
                  >
                    {/* Grid require inner wrapper with overflow-hidden */}
                    <div className="overflow-hidden flex flex-col">
                      {/* Info Badges */}
                      <div className="flex flex-wrap gap-3 md:gap-4 mb-5">
                        {deity.phone && (
                          <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-gray-800 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                            <Phone
                              className="w-3.5 h-3.5"
                              style={{ color: APP_COLORS.primary }}
                            />
                            <span>{deity.phone}</span>
                          </div>
                        )}
                        {deity.spokenLanguages && (
                          <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-gray-800 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                            <Languages
                              className="w-3.5 h-3.5"
                              style={{ color: APP_COLORS.secondary }}
                            />
                            <span>{deity.spokenLanguages}</span>
                          </div>
                        )}
                      </div>

                      <hr className="border-gray-200 w-full mb-5" />

                      {/* Description Paragraphs */}
                      <div className="prose prose-base md:prose-lg max-w-none text-gray-700 leading-relaxed font-medium text-justify">
                        {deity.description
                          ?.split("\n")
                          .map((paragraph, idx) => (
                            <p key={idx} className="mb-4 last:mb-0">
                              {paragraph}
                            </p>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
