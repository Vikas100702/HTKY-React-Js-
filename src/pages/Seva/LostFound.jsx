import {
  Search,
  Mail,
  User,
  Phone,
  AlignLeft,
  MapPin,
  SearchX,
} from "lucide-react";

import { useGetLostFound } from "../../hooks/queries/Seva/useGetLostFound";
import { APP_COLORS } from "../../constants/appColors";

export const LostFound = () => {
  const { data, isLoading, isError } = useGetLostFound();
  const primaryColor = APP_COLORS?.primary || "#900000";
  const getListIcon = (index) => {
    const icons = [
      <User className="w-4 h-4" />,
      <Phone className="w-4 h-4" />,
      <AlignLeft className="w-4 h-4" />,
      <MapPin className="w-4 h-4" />,
    ];
    return (
      icons[index] || <span className="w-1.5 h-1.5 rounded-full bg-current" />
    );
  };

  if (isLoading) {
    return (
      <section className="w-full py-16 bg-[#fcfbf9] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 animate-pulse">
          <div className="flex flex-col items-center space-y-6 max-w-3xl mx-auto mb-16">
            <div className="h-10 bg-gray-200 rounded-lg w-3/4" />
            <div className="h-24 bg-gray-200 rounded-xl w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-3xl w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ERROR / EMPTY STATE

  if (isError || !data) {
    return (
      <section className="w-full py-24 flex justify-center items-center bg-[#fcfbf9] min-h-[60vh]">
        <div className="p-8 rounded-2xl bg-orange-50/50 border border-orange-200/60 max-w-md text-center shadow-sm">
          <p className="text-lg font-semibold text-gray-700">
            Information is currently unavailable. Please check back later.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 lg:py-24 bg-gradient-to-b from-orange-50/30 to-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* 1. Header & Intro */}
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1
            className="text-3xl md:text-4xl lg:text-4xl font-extrabold tracking-wide font-serif inline-block relative pb-4"
            style={{ color: primaryColor }}
          >
            {data.headerInfo.title}
            <span
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-1.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          </h1>

          <p className="text-lg md:text-xl text-gray-700 text-justify leading-relaxed font-medium">
            {data.headerInfo.description}
          </p>
        </div>

        {/* 2. Lost & Found Reporting Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {data.sections.map((section) => {
            const isLost = section.id === "report-lost";

            return (
              <div
                key={section.id}
                className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-gray-100 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div
                  className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-10 transition-opacity duration-500 pointer-events-none ${isLost ? "bg-red-500" : "bg-emerald-500"}`}
                />

                {/* Icon & Title */}
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="p-4 rounded-2xl bg-gray-50 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    {isLost ? (
                      <SearchX className="w-7 h-7 text-gray-700" />
                    ) : (
                      <Search
                        className="w-7 h-7 text-gray-700"
                        style={{ color: primaryColor }}
                      />
                    )}
                  </div>
                  <h2 className="text-2xl font-bold font-serif text-gray-900">
                    {section.title}
                  </h2>
                </div>
                <p className="text-base text-gray-600 font-medium leading-relaxed mb-8 relative z-10">
                  {section.instruction.split(data.contactEmail)[0]}
                  <a
                    href={`mailto:${data.contactEmail}`}
                    className="font-bold hover:underline mx-1 transition-colors"
                    style={{ color: primaryColor }}
                  >
                    {data.contactEmail}
                  </a>
                  {section.instruction.split(data.contactEmail)[1]}
                </p>

                {/* Requirements List */}
                <div className="flex-grow relative z-10 bg-gray-50/80 rounded-2xl p-6 border border-gray-100">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                    Required Details
                  </p>
                  <ul className="space-y-4">
                    {section.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors">
                          {getListIcon(i)}
                        </div>
                        <span className="text-gray-800 font-medium">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <a
                  href={`mailto:${data.contactEmail}?subject=${encodeURIComponent(section.title)}`}
                  className="mt-8 flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Mail className="w-5 h-5" />
                  Email {isLost ? "Lost" : "Found"} Report
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
