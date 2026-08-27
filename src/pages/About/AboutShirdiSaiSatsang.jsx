import { useGetAboutShirdiSaiSatsang } from "../../hooks/queries/About/useGetAboutShirdiSaiSatsang";
import { APP_COLORS } from "../../constants/appColors";

export const AboutShirdiSaiSatsang = () => {
  const { data, isLoading, isError } = useGetAboutShirdiSaiSatsang();
  const primaryColor = APP_COLORS?.primary || "#900000";

  if (isLoading) {
    return (
      <section className="w-full py-16 bg-orange-50/30 min-h-screen">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 space-y-12 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 h-[400px] bg-gray-200 rounded-2xl" />
            <div className="lg:col-span-7 space-y-6">
              <div className="h-10 bg-gray-200 rounded-lg w-1/2" />
              <div className="h-48 bg-gray-200 rounded-xl w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-48 bg-gray-200 rounded-2xl w-full" />
            <div className="h-48 bg-gray-200 rounded-2xl w-full" />
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl w-full" />
        </div>
      </section>
    );
  }


  // ERROR / EMPTY STATE

  if (isError || !data) {
    return (
      <section className="w-full py-24 flex justify-center items-center bg-white min-h-screen">
        <div className="p-8 rounded-2xl bg-orange-50/50 border border-orange-200/60 max-w-md text-center shadow-sm">
          <p className="text-lg font-semibold text-gray-700">
            Shirdi Sai Satsang details are currently unavailable.
          </p>
        </div>
      </section>
    );
  }


  // MAIN PREMIUM RENDER

  return (
    <section className="w-full py-12 lg:py-20 bg-[url('/src/assets/pattern-bg.jpg')] bg-repeat bg-cover bg-top">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 space-y-16">
        {/* 1. Hero Section (Image + Title) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left: */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group w-full max-w-lg lg:max-w-none">
              <div
                className="absolute -inset-1.5 rounded-3xl blur-md opacity-25 group-hover:opacity-45 transition duration-500"
                style={{ backgroundColor: primaryColor }}
              />
              <div className="relative overflow-hidden rounded-2xl border border-orange-100 shadow-xl bg-white">
                <img
                  src={data.headerInfo.image}
                  alt={data.headerInfo.title}
                  className="w-full h-80 sm:h-96 lg:h-[460px] object-cover object-top transform group-hover:scale-105 transition duration-700 ease-out"
                  loading="lazy"
                  onError={(e) => (e.target.style.display = "none")}
                />
              </div>
            </div>
          </div>

          {/* Right: Title & Schedule Panel */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div>
              <span
                className="text-xs sm:text-sm font-bold tracking-widest uppercase px-3.5 py-1.5 rounded-full bg-orange-100/70 border border-orange-200 inline-block mb-3"
                style={{ color: primaryColor }}
              >
                Divine Gatherings
              </span>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif leading-tight"
                style={{ color: primaryColor }}
              >
                {data.headerInfo.title}
              </h1>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-orange-100/80 shadow-lg shadow-orange-950/5 space-y-5">
              <div className="space-y-1 border-b border-orange-100/80 pb-4">
                <h2 className="text-xs uppercase tracking-wider font-bold text-gray-400">
                  Puja Schedule
                </h2>
                <p className="text-base font-semibold text-gray-800">
                  {data.headerInfo.scheduleNote}
                </p>
                <p className="text-sm font-medium text-gray-600 flex items-center gap-2 pt-1">
                  <svg
                    className="w-4 h-4 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {data.headerInfo.venue}
                </p>
              </div>

              <ul className="space-y-3">
                {data.headerInfo.schedule.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 p-3 rounded-xl hover:bg-orange-50/50 transition-colors"
                  >
                    <span
                      className="font-bold whitespace-nowrap min-w-[140px]"
                      style={{ color: primaryColor }}
                    >
                      {item.time}
                    </span>
                    <span className="text-base text-gray-700 font-medium">
                      {item.activity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 2. About & Purpose */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pt-4">
          <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
            <h3
              className="text-2xl font-bold font-serif mb-4"
              style={{ color: primaryColor }}
            >
              {data.aboutSection.title}
            </h3>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed font-medium">
              {data.aboutSection.content}
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
            <h3
              className="text-2xl font-bold font-serif mb-4"
              style={{ color: primaryColor }}
            >
              {data.purposeSection.title}
            </h3>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed font-medium">
              {data.purposeSection.content}
            </p>
          </div>
        </div>

        {/* 3. Mission & Objectives Section */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-xl relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-10 pointer-events-none"
            style={{ backgroundColor: primaryColor }}
          />

          <h3
            className="text-2xl sm:text-3xl font-bold font-serif mb-8 relative z-10"
            style={{ color: primaryColor }}
          >
            {data.missionSection.title}
          </h3>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 relative z-10">
            {data.missionSection.points.map((point, idx) => (
              <li key={idx} className="flex items-start gap-4">
                <span
                  className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-orange-50 flex-shrink-0 text-xs font-bold"
                  style={{
                    color: primaryColor,
                    border: `1px solid ${primaryColor}`,
                  }}
                >
                  {idx + 1}
                </span>
                <span className="text-base lg:text-lg text-gray-700 font-medium leading-relaxed">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
