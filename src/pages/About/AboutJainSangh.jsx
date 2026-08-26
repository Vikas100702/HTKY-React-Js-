import { useGetJainSangh } from "../../hooks/queries/About/useGetAboutJainSangh";
import { APP_COLORS } from "../../constants/appColors";

export const AboutJainSangh = () => {
  const { data, isLoading, isError } = useGetJainSangh();

  const primaryColor = APP_COLORS?.primary || "#900000";

  if (isLoading) {
    return (
      <section className="w-full py-16 bg-slate-50/50 min-h-screen">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-16 space-y-12 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 h-96 bg-gray-200 rounded-2xl" />
            <div className="lg:col-span-7 space-y-6">
              <div className="h-10 bg-gray-200 rounded-lg w-1/2" />
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            <div className="h-48 bg-gray-200 rounded-xl" />
            <div className="h-48 bg-gray-200 rounded-xl" />
            <div className="h-48 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }


  // ERROR / EMPTY STATE

  if (isError || !data) {
    return (
      <section className="w-full py-24 flex justify-center items-center bg-white">
        <div className="p-8 rounded-2xl bg-amber-50/50 border border-amber-200/60 max-w-md text-center shadow-sm">
          <p className="text-lg font-semibold text-gray-700">
            Jain Sangh details are currently unavailable.
          </p>
        </div>
      </section>
    );
  }


  // MAIN PREMIUM RENDER

  return (
    <section className="w-full min-h-screen bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 text-gray-800 py-12 lg:py-20 overflow-hidden">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-16 space-y-16">
        {/* 1. Hero Section (Image + Title & Schedule Bento Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left: Image Card with Ambient Blur */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group w-full max-w-lg lg:max-w-none">
              <div
                className="absolute -inset-1.5 rounded-3xl blur-md opacity-25 group-hover:opacity-45 transition duration-500"
                style={{ backgroundColor: primaryColor }}
              />
              <div className="relative overflow-hidden rounded-2xl border border-amber-100 shadow-xl bg-white">
                <img
                  src={data.headerInfo.image}
                  alt="Mahavir Swami"
                  className="w-full h-80 sm:h-96 lg:h-[460px] object-cover object-center transform group-hover:scale-105 transition duration-700 ease-out"
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
                className="text-xs sm:text-sm font-bold tracking-widest uppercase px-3.5 py-1.5 rounded-full bg-amber-100/70 border border-amber-200 inline-block mb-3"
                style={{ color: primaryColor }}
              >
                Spiritual Heritage
              </span>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif leading-tight"
                style={{ color: primaryColor }}
              >
                {data.headerInfo.title}
              </h1>
            </div>

            {/* Schedule Bento Box */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-amber-100/80 shadow-lg shadow-amber-950/5 space-y-4">
              <h2 className="text-xs uppercase tracking-wider font-bold text-gray-400">
                Weekly Schedule & Rituals
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.headerInfo.schedule.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex flex-col p-3.5 rounded-xl bg-amber-50/40 border border-amber-100/50 hover:bg-amber-50/80 transition-colors"
                  >
                    <span className="font-bold text-gray-900 text-base">
                      {item.label}
                    </span>
                    {item.value && (
                      <span className="text-sm text-gray-600 font-medium mt-0.5">
                        {item.value}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 2. Main About Section (Vows & Philosophy Grid) */}
        <div className="space-y-10">
          {/* Intro Card */}
          {data.aboutSection.intro && (
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-100 shadow-md shadow-gray-200/50">
              <p className="text-lg sm:text-xl font-medium leading-relaxed text-gray-700">
                {data.aboutSection.intro}
              </p>
            </div>
          )}

          {/* Vows Grid Cards */}
          {data.aboutSection.vows?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold tracking-tight text-gray-900">
                Core Ethical Vows
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {data.aboutSection.vows.map((vow, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-100/60 inline-block"
                        style={{ color: primaryColor }}
                      >
                        0{idx + 1}
                      </span>
                      <h4 className="text-lg font-bold text-gray-900">
                        {vow.bold}
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {vow.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Philosophy Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-gradient-to-br from-amber-900 to-amber-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col justify-center space-y-4">
              <h3 className="text-2xl font-bold font-serif text-amber-200">
                Philosophical Pillars
              </h3>
              <p className="text-base sm:text-lg text-amber-100/90 leading-relaxed font-normal">
                {data.aboutSection.philosophyIntro}
              </p>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-md flex flex-col justify-center">
              <ul className="space-y-3">
                {data.aboutSection.philosophyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span
                      className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="text-base sm:text-lg text-gray-700 font-medium">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Additional Paragraphs */}
          {data.aboutSection.paragraphs?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {data.aboutSection.paragraphs.map((para, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white/70 border border-amber-100/60 shadow-sm"
                >
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                    {para}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Community Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xl space-y-8">
          <div className="space-y-3">
            <h3
              className="text-2xl sm:text-3xl font-bold font-serif"
              style={{ color: primaryColor }}
            >
              {data.communitySection.title}
            </h3>
            <p className="text-base sm:text-lg text-gray-700 font-medium">
              {data.communitySection.intro}
            </p>
            <p className="text-base sm:text-lg text-gray-600">
              {data.communitySection.pathshalaIntro}
            </p>
          </div>

          {/* Activities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {data.communitySection.activities.map((activity, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-xl bg-amber-50/30 border border-amber-100 flex items-start gap-4 hover:border-amber-300 transition-all"
              >
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm text-white flex-shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {idx + 1}
                </span>
                <span className="text-base text-gray-800 font-semibold self-center">
                  {activity}
                </span>
              </div>
            ))}
          </div>

          {/* Involvement CTA */}
          {data.communitySection.involvement?.link && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <span className="font-bold text-gray-900 text-base sm:text-lg">
                {data.communitySection.involvement.label}
              </span>
              <a
                href={data.communitySection.involvement.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-md hover:shadow-lg active:scale-95"
                style={{ backgroundColor: primaryColor }}
              >
                Get Involved &rarr;
              </a>
            </div>
          )}
        </div>

        {/* 4. Points of Contact Section */}
        <div className="space-y-6 pt-4">
          <h3
            className="text-2xl font-bold font-serif"
            style={{ color: primaryColor }}
          >
            {data.contactSection.title}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.contactSection.contacts.map((contact, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center gap-3.5"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-base font-semibold text-gray-800">
                  {contact}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
