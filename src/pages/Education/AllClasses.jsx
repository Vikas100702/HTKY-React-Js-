/**
 * @file src/pages/Classes/AllClasses.jsx
 * @description Premium, responsive UI for displaying all temple classes.
 * Consumes the useGetAllClasses hook and renders a clean, visually appealing grid of interactive cards.
 */

import { Clock, Mail, Globe, User } from "lucide-react";
import { useGetAllClasses } from "../../hooks/queries/Education/useGetAllClasses";
import { APP_COLORS } from "../../constants/appColors";

export const AllClasses = () => {
  const { data, isLoading, isError } = useGetAllClasses();
  const primaryColor = APP_COLORS?.primary || "#900000";

  if (isLoading) {
    return (
      <section className="w-full py-16 bg-[#fcfbf9] min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header Skeleton */}
          <div className="flex flex-col items-center space-y-4 animate-pulse mb-12">
            <div className="h-10 bg-gray-200 rounded-lg w-64" />
            <div className="h-4 bg-gray-200 rounded w-96" />
          </div>
          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-80"
              >
                <div className="h-8 bg-gray-200 rounded w-2/3 mb-8" />
                <div className="space-y-6 flex-grow">
                  <div className="h-5 bg-gray-200 rounded w-full" />
                  <div className="h-12 bg-gray-200 rounded w-full" />
                  <div className="h-5 bg-gray-200 rounded w-4/5" />
                </div>
                <div className="h-10 bg-gray-200 rounded w-full mt-4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }


  // ERROR / EMPTY STATE

  if (isError || !data || data.length === 0) {
    return (
      <section className="w-full py-24 flex justify-center items-center bg-[#fcfbf9] min-h-[60vh]">
        <div className="p-8 rounded-2xl bg-orange-50/50 border border-orange-200/60 max-w-md text-center shadow-sm">
          <p className="text-lg font-semibold text-gray-700">
            Class schedules are currently unavailable. Please check back later.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-12 lg:py-16 bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* 1. Page Header */}
        <div className="text-center space-y-5">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-wide uppercase relative inline-block pb-4"
            style={{ color: primaryColor, fontFamily: "Georgia, serif" }}
          >
            Classes & Activities
            <span
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-1.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          </h2>
        </div>

        {/* 2. Responsive Class Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {data.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col group relative overflow-hidden"
              style={{ borderColor: primaryColor }}
            >
              <div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                style={{ backgroundColor: primaryColor }}
              />

              {/* Card Header */}
              <h3
                className="text-2xl font-bold mb-6 pb-4 border-b font-serif relative z-10"
                style={{ color: primaryColor }}
              >
                {item.class}
              </h3>

              {/* Card Body (Info Rows) */}
              <div className="flex-grow space-y-5 text-gray-700 relative z-10">
                {/* Timings Row */}
                {item.timings && item.timings.length > 0 && (
                  <div className="flex items-start gap-3.5">
                    <Clock
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      style={{ color: primaryColor }}
                    />
                    <ul className="space-y-1.5">
                      {item.timings.map((time, idx) => (
                        <li
                          key={idx}
                          className="font-semibold text-gray-800 leading-snug"
                        >
                          {time}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contacts Row */}
                {item.contactPhone && item.contactPhone.length > 0 && (
                  <div className="flex items-start gap-3.5">
                    <User
                      className="w-5 h-5 mt-2 flex-shrink-0"
                      style={{ color: primaryColor }}
                    />
                    <ul className="space-y-2 w-full">
                      {item.contactPhone.map((cp, idx) => (
                        <li
                          key={idx}
                          className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-50/80 px-3.5 py-2.5 rounded-xl border border-gray-100/50"
                        >
                          <span className="font-semibold text-gray-900 text-sm md:text-base">
                            {cp.contact}
                          </span>
                          <a
                            href={`tel:${cp.phoneNumber.replace(/[^0-9]/g, "")}`}
                            className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors mt-0.5 sm:mt-0"
                          >
                            {cp.phoneNumber}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Email Row */}
                {item.email && (
                  <div className="flex items-start gap-3.5 pt-1">
                    <Mail
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      style={{ color: primaryColor }}
                    />
                    <a
                      href={`mailto:${item.email}`}
                      className="font-medium text-gray-700 hover:text-blue-600 break-all transition-colors leading-snug"
                    >
                      {item.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Card Footer (Action Buttons) */}
              {(item.website || item.facebook) && (
                <div className="mt-8 pt-5 border-t border-gray-100 flex flex-wrap gap-3 relative z-10">
                  {item.website && (
                    <a
                      href={item.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border transition-all duration-300 flex-1 hover:shadow-md hover:bg-orange-50/30"
                      style={{
                        color: primaryColor,
                        borderColor: `${primaryColor}40`,
                      }}
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  {item.facebook && (
                    <a
                      href={item.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-[#1877F2] text-white hover:bg-[#166fe5] transition-all duration-300 flex-1 shadow-sm hover:shadow-md"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Facebook
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
