/**
 * @file src/pages/About/AboutPriest.jsx
 * @description Premium, responsive UI for displaying Temple Priests.
 * Built with scalable CSS grid and strictly consumes sanitized data from the adapter.
 */

import { Phone, Languages } from "lucide-react";
import { useGetAboutPriest } from "../../hooks/queries/About/useGetAboutPriest";
import { APP_COLORS } from "../../constants/appColors";

export const AboutPriest = () => {
  const { data: priests, isLoading, isError } = useGetAboutPriest();

  // 1. Premium Skeleton Loader
  if (isLoading) {
    return (
      <section className="w-full py-16 bg-[#fdfbf7] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse flex flex-col md:flex-row gap-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100"
            >
              <div className="w-full md:w-1/3 lg:w-1/4 h-72 bg-gray-200 rounded-md" />
              <div className="w-full md:w-2/3 lg:w-3/4 space-y-4 py-4">
                <div className="h-8 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="space-y-2 pt-4">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-4/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // 2. Error / Empty State Handling
  if (isError || !priests || priests.length === 0) {
    return (
      <section className="w-full py-20 flex justify-center items-center bg-[#fdfbf7]">
        <p className="text-lg font-semibold text-gray-500">
          Priest details are currently unavailable.
        </p>
      </section>
    );
  }

  // 3. Main Dynamic Rendering
  return (
    <section className="w-full py-12 lg:py-12 bg-[url('/src/assets/pattern-bg.jpg')]">
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
            Our Respected Priests
          </h2>
        </div>

        {/* Dynamic List Rendering */}
        <div className="space-y-12 lg:space-y-12">
          {priests.map((priest, index) => (
            <div
              key={priest.id || index}
              className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl group"
              style={{ borderColor: APP_COLORS.primary }}
            >
              {/* Image Section */}
              <div className="w-full md:w-1/3 lg:w-[30%] flex-shrink-0">
                <div
                  className="relative w-full aspect-[3/4] md:aspect-auto md:h-80 lg:h-96 rounded-lg overflow-hidden shadow-md border-2"
                  style={{ borderColor: APP_COLORS.secondary }}
                >
                  {priest.image ? (
                    <img
                      src={priest.image}
                      alt={priest.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    // Fallback block if no image is available
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 font-medium">
                        Image Not Available
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Details Section */}
              <div className="w-full md:w-2/3 lg:w-[70%] flex flex-col space-y-5">
                {/* Name */}
                <h3
                  className="text-2xl md:text-3xl font-extrabold tracking-wide"
                  style={{ color: APP_COLORS.primary }}
                >
                  {priest.name}
                </h3>

                {/* Info Badges (Phone & Languages) */}
                <div className="flex flex-wrap gap-4 md:gap-6 pt-1">
                  {priest.phone && (
                    <div className="flex items-center gap-2 text-sm md:text-base font-bold text-gray-800 bg-red-50/50 px-4 py-2 rounded-full border border-red-100">
                      <Phone
                        className="w-4 h-4"
                        style={{ color: APP_COLORS.primary }}
                      />
                      <span>{priest.phone}</span>
                    </div>
                  )}
                  {priest.spokenLanguages && (
                    <div className="flex items-center gap-2 text-sm md:text-base font-bold text-gray-800 bg-orange-50/50 px-4 py-2 rounded-full border border-orange-100">
                      <Languages
                        className="w-4 h-4"
                        style={{ color: APP_COLORS.secondary }}
                      />
                      <span>{priest.spokenLanguages}</span>
                    </div>
                  )}
                </div>

                <hr className="border-gray-200 w-full" />

                {/* Description - Allowing dynamic height for large paragraphs */}
                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed font-medium text-justify">
                  {/* Using split to handle line breaks if any exist in the raw string */}
                  {priest.description.split("\n").map((paragraph, idx) => (
                    <p key={idx} className="mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
