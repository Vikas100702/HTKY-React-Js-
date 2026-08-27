/**
 * @file src/pages/Services/GriefSupport.jsx
 * @description Premium, compassionate UI for the Grief Support page.
 * Uses a soft, comforting layout to present sensitive information respectfully.
 */

import {
  Heart,
  Users,
  Flame,
  HeartHandshake,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { useGetGriefSupport } from "../../hooks/queries/Seva/useGetGriefSupport";
import { APP_COLORS } from "../../constants/appColors";

export const GriefSupport = () => {
  const { data, isLoading, isError } = useGetGriefSupport();
  const primaryColor = APP_COLORS?.primary || "#900000";

  // Helper for mapping icons to services
  const getServiceIcon = (id) => {
    switch (id) {
      case "counseling":
        return <Users className="w-8 h-8" style={{ color: primaryColor }} />;
      case "spiritual":
        return <Flame className="w-8 h-8" style={{ color: primaryColor }} />;
      case "community":
        return (
          <HeartHandshake className="w-8 h-8" style={{ color: primaryColor }} />
        );
      default:
        return <Heart className="w-8 h-8" style={{ color: primaryColor }} />;
    }
  };


  // SKELETON LOADER

  if (isLoading) {
    return (
      <section className="w-full py-16 bg-[#fcfbf9] min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg w-3/4 max-w-lg mx-auto mb-12" />
          <div className="h-40 bg-gray-200 rounded-3xl w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-2xl w-full" />
            ))}
          </div>
          <div className="h-48 bg-gray-200 rounded-3xl w-full" />
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
    <section className="w-full py-12 lg:py-16 bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top">
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50/40 to-transparent pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* 1. Page Header */}
        <div className="text-center space-y-4">
          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-wide font-serif"
            style={{ color: primaryColor }}
          >
            {data.headerInfo.title}
          </h1>
        </div>

        {/* 2. Welcome Section */}
        <div
          className="bg-white rounded-3xl p-8 sm:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border text-center relative overflow-hidden"
          style={{ borderColor: primaryColor }}
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-orange-50/50">
              <Heart className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold font-serif mb-6"
            style={{ color: primaryColor }}
          >
            {data.welcomeSection.title}
          </h2>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed font-medium max-w-3xl mx-auto">
            {data.welcomeSection.content}
          </p>
        </div>

        {/* 3. Services Grid */}
        <div className="space-y-10">
          <div className="text-center">
            <h2
              className="text-3xl md:text-4xl font-bold font-serif inline-block relative pb-4"
              style={{ color: primaryColor }}
            >
              {data.servicesSection.title}
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {data.servicesSection.services.map((service) => (
              <div
                key={service.id}
                className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border flex flex-col items-center text-center group"
                style={{ borderColor: primaryColor }}
              >
                <div className="mb-6 p-4 rounded-2xl bg-gray-50 group-hover:bg-orange-50 transition-colors duration-300">
                  {getServiceIcon(service.id)}
                </div>
                <h3 className="font-bold font-serif text-xl text-gray-900 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 font-medium leading-relaxed flex-grow">
                  {service.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Access Services & Contact Information */}
        <div
          className="rounded-3xl p-8 sm:p-12 shadow-lg border relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10"
          style={{
            backgroundColor: `${primaryColor}08`,
            borderColor: `${primaryColor}20`,
          }}
        >
          <div className="md:w-1/2 space-y-4 text-center md:text-left">
            <h3
              className="text-2xl sm:text-3xl font-bold font-serif"
              style={{ color: primaryColor }}
            >
              {data.accessSection.title}
            </h3>
            <p className="text-lg text-gray-700 font-medium leading-relaxed">
              {data.accessSection.content}
            </p>
          </div>

          <div className="md:w-1/2 w-full">
            <div
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border space-y-6"
              style={{ borderColor: primaryColor }}
            >
              <div className="flex items-center gap-4 group">
                <div className="p-3 rounded-full bg-gray-50 group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                    Email
                  </p>
                  <a
                    href={`mailto:${data.accessSection.contactInfo.email}`}
                    className="text-base sm:text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors break-all"
                  >
                    {data.accessSection.contactInfo.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="p-3 rounded-full bg-gray-50 group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                    Phone
                  </p>
                  <a
                    href={`tel:${data.accessSection.contactInfo.phone.replace(/[^0-9]/g, "")}`}
                    className="text-base sm:text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                  >
                    {data.accessSection.contactInfo.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="p-3 rounded-full bg-gray-50 group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                    Address
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-gray-800 leading-snug">
                    {data.accessSection.contactInfo.address}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
