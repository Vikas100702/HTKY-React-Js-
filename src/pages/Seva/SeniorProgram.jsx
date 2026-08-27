import {
  HeartHandshake,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { useGetAboutSeniorProgram } from "../../hooks/queries/Seva/useGetSeniorProgram";
import { APP_COLORS } from "../../constants/appColors";

export const SeniorProgram = () => {
  const { data, isLoading, isError } = useGetAboutSeniorProgram();
  const primaryColor = APP_COLORS?.primary || "#900000";

  if (isLoading) {
    return (
      <section className="w-full py-16 bg-[#fcfbf9] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 animate-pulse">
          <div className="flex flex-col items-center space-y-4 mb-12">
            <div className="h-10 bg-gray-200 rounded-lg w-3/4 max-w-lg" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="h-40 bg-gray-200 rounded-3xl w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-64 bg-gray-200 rounded-3xl w-full" />
            <div className="h-64 bg-gray-200 rounded-3xl w-full" />
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
            Senior Program details are currently unavailable. Please check back
            later.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-12 lg:py-16 bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top">
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full blur-[100px] opacity-[0.03] pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      />
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.03] pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* 1. Page Header */}
        <div className="text-center space-y-4">
          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-wide font-serif"
            style={{ color: primaryColor }}
          >
            {data.headerInfo.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-medium tracking-wide">
            {data.headerInfo.subtitle}
          </p>
        </div>

        {/* 2. Welcome Section */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 lg:p-12 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden group">
          <div
            className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500"
            style={{ backgroundColor: primaryColor }}
          />
          <h2
            className="text-2xl sm:text-3xl font-bold font-serif mb-6 relative z-10"
            style={{ color: primaryColor }}
          >
            {data.welcomeSection.title}
          </h2>
          <p className="text-base md:text-lg text-gray-700 leading-relaxed font-medium relative z-10">
            {data.welcomeSection.content}
          </p>
        </div>

        {/* 3. Activities Grid */}
        <div className="space-y-10">
          <div className="text-center">
            <h2
              className="text-3xl md:text-4xl font-bold font-serif inline-block relative pb-4"
              style={{ color: primaryColor }}
            >
              {data.activitiesSection.title}
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.activitiesSection.activities.map((activity, idx) => (
              <div
                key={idx}
                className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col h-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: primaryColor }}
                  />
                  <h3 className="font-bold text-lg text-gray-900 leading-tight">
                    {activity.bold.replace(":", "")}
                  </h3>
                </div>
                <p className="text-gray-600 font-medium leading-relaxed flex-grow">
                  {activity.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Schedule, Join Us & Contact Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
          {/* Left Column: Schedule & Join Us */}
          <div className="lg:col-span-7 space-y-8 h-full">
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-gray-100 h-full flex flex-col justify-center space-y-10">
              {/* Schedule */}
              <div>
                <h3
                  className="text-2xl font-bold font-serif mb-4 flex items-center gap-3"
                  style={{ color: primaryColor }}
                >
                  <CalendarDays className="w-6 h-6" />
                  {data.scheduleSection.title}
                </h3>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed font-medium">
                  {data.scheduleSection.content}
                </p>
              </div>

              <hr className="border-gray-100" />

              {/* Join Us */}
              <div>
                <h3
                  className="text-2xl font-bold font-serif mb-4 flex items-center gap-3"
                  style={{ color: primaryColor }}
                >
                  <HeartHandshake className="w-6 h-6" />
                  {data.joinUsSection.title}
                </h3>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed font-medium mb-6">
                  {data.joinUsSection.content}
                </p>
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-50 border border-orange-100/50">
                  <p
                    className="font-bold text-sm md:text-base"
                    style={{ color: primaryColor }}
                  >
                    {data.joinUsSection.closing}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Information */}
          <div className="lg:col-span-5 h-full">
            <div
              className="rounded-3xl p-8 sm:p-10 shadow-lg border h-full relative overflow-hidden"
              style={{
                backgroundColor: `${primaryColor}08`,
                borderColor: `${primaryColor}20`,
              }}
            >
              <h3
                className="text-2xl font-bold font-serif mb-8"
                style={{ color: primaryColor }}
              >
                Get in Touch
              </h3>

              <ul className="space-y-8">
                <li className="flex items-start gap-4 group">
                  <div className="p-3 rounded-full bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                    <Phone
                      className="w-5 h-5"
                      style={{ color: primaryColor }}
                    />
                  </div>
                  <div className="pt-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                      Phone
                    </p>
                    <a
                      href={`tel:${data.contactInfo.phone.replace(/[^0-9]/g, "")}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {data.contactInfo.phone}
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4 group">
                  <div className="p-3 rounded-full bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" style={{ color: primaryColor }} />
                  </div>
                  <div className="pt-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                      Email
                    </p>
                    <a
                      href={`mailto:${data.contactInfo.email}`}
                      className="text-lg font-semibold text-gray-900 break-all hover:text-blue-600 transition-colors"
                    >
                      {data.contactInfo.email}
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4 group">
                  <div className="p-3 rounded-full bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                    <MapPin
                      className="w-5 h-5"
                      style={{ color: primaryColor }}
                    />
                  </div>
                  <div className="pt-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                      Address
                    </p>
                    <p className="text-lg font-semibold text-gray-900 leading-snug">
                      {data.contactInfo.address}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
