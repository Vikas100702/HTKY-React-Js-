import { useState } from "react";
import { useGetAboutTemple } from "../../hooks/queries/About/useGetAboutTemple";
import { APP_COLORS } from "../../constants/appColors";

export const AboutTemple = () => {
  const { data: templeData, isLoading, isError } = useGetAboutTemple();

  // Local state to track which column's text is expanded
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (isLoading) {
    return (
      <section className="w-full py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex flex-col items-center">
                <div className="w-48 h-48 md:w-64 md:h-64 bg-gray-200 rounded-full mb-8" />
                <div className="h-6 bg-gray-200 w-1/2 mb-4 rounded" />
                <div className="h-2 bg-gray-200 w-1/4 mb-8 rounded" />
                <div className="w-full space-y-3">
                  <div className="h-4 bg-gray-200 w-full rounded" />
                  <div className="h-4 bg-gray-200 w-full rounded" />
                  <div className="h-4 bg-gray-200 w-3/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Fallback / Empty State
  if (isError || !templeData || templeData.length === 0) {
    return (
      <section className="w-full py-20 flex justify-center items-center bg-white">
        <p className="text-lg font-semibold text-gray-500">
          Temple details are currently unavailable.
        </p>
      </section>
    );
  }

  // 3. Helper to render text with inline "view more"
  const renderDescription = (text, id) => {
    const isExpanded = expandedItems[id];
    const MAX_LENGTH = 280; // Character limit before truncation
    const needsTruncation = text.length > MAX_LENGTH;

    // Slice the text if it needs truncation and is NOT expanded
    const displayText =
      needsTruncation && !isExpanded ? text.slice(0, MAX_LENGTH) + "..." : text;

    // Split by line breaks to render proper paragraphs
    const paragraphs = displayText.split("\n").filter((p) => p.trim() !== "");

    return (
      <div className="prose prose-sm lg:prose-base max-w-none text-gray-800 font-medium leading-relaxed text-justify md:text-justify">
        {paragraphs.map((p, idx) => {
          const isLast = idx === paragraphs.length - 1;
          return (
            <p key={idx} className="mb-4 last:mb-0">
              {p}
              {/* Only show the toggle button on the absolute last paragraph */}
              {isLast && needsTruncation && (
                <button
                  onClick={() => toggleExpand(id)}
                  className="inline-block font-bold text-blue-600 hover:text-blue-800 transition-colors ml-1 cursor-pointer"
                >
                  {isExpanded ? "view less" : "view more"}
                </button>
              )}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <section className="w-full py-16 lg:py-16 bg-[url('/src/assets/pattern-bg.jpg')] bg-repeat bg-fill bg-top min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className="text-xl md:text-4xl font-extrabold uppercase tracking-wide inline-block border-b-4 pb-2"
            style={{
              color: APP_COLORS.primary,
              borderColor: APP_COLORS.secondary,
            }}
          >
            ABOUT HINDU TEMPLE OF KENTUCKY
          </h2>
        </div>
        {/* Responsive 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {templeData.map((item) => (
            <div key={item.id} className="flex flex-col items-center">
              {/* Circular Image Container */}
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 mb-8 group overflow-hidden rounded-full shadow-lg border-4 border-white outline outline-1 outline-gray-200">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 font-medium text-sm">
                      No Image
                    </span>
                  </div>
                )}
              </div>

              {/* Title & Divider*/}
              <div className="flex flex-col items-center text-center mb-6 w-full">
                <h2
                  className="text-xl sm:text-2xl font-normal tracking-wide uppercase"
                  style={{
                    color: APP_COLORS.primary || "#800000",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {item.title}
                </h2>
                <img
                  src="/src/assets/border2.png"
                  alt="divider"
                  className="mt-3 w-32 md:w-40 h-auto opacity-70 pointer-events-none"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              {/* Description Body with Expand Logic */}
              <div className="w-full px-2 sm:px-4 lg:px-0 justify-center">
                {renderDescription(item.description, item.id)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
