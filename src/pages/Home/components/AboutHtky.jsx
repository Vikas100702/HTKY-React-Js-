import { useNavigate } from "react-router-dom";
import { useGetAboutHtky } from "../../../hooks/queries/Home/useAboutHtky";

export const AboutHtky = () => {
  const navigate = useNavigate();
  const { data: aboutList, isLoading } = useGetAboutHtky();

  if (isLoading) {
    return (
      <section className="w-full py-16 bg-gradient-to-b from-amber-50/50 to-white">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-16">
          <div className="animate-pulse flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/2 h-96 bg-gray-200 rounded-2xl" />
            <div className="w-full md:w-1/2 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const item = aboutList?.[0];
  if (!item) return null;

  return (
    <section className="w-full py-7 md:py-10 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 text-gray-800">
      {/* Expanded max-width limit from 7xl (1280px) to 1800px */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 items-center">
          {/* Left Image Section */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group w-full max-w-lg lg:max-w-none">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-800 via-amber-600 to-red-900 rounded-2xl blur opacity-20 group-hover:opacity-35 transition duration-300"></div>

              <div className="relative overflow-hidden rounded-2xl border-4 border-amber-600/20 shadow-xl bg-white">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-80 sm:h-96 lg:h-[450px] object-cover object-center transform group-hover:scale-105 transition duration-500 ease-out"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/600x400?text=Hindu+Temple+of+Kentucky";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Content Section */}
          <div className="lg:col-span-7 flex flex-col justify-center text-center lg:text-left space-y-6">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight text-red-950 font-serif leading-tight">
              {item.title}
            </h2>

            <p className="text-base sm:text-lg lg:text-xl text-gray-700 text-justify leading-relaxed font-normal">
              {item.description}
            </p>

            {/* Dynamic CTA Buttons */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-6">
              {Array.isArray(item.buttons) &&
                item.buttons.map((btn, idx) => {
                  const isPrimary = idx === 0;
                  return (
                    <button
                      key={idx}
                      onClick={() => navigate(btn.path)}
                      className={`px-8 py-3.5 rounded-lg text-xs sm:text-sm lg:text-base font-bold uppercase tracking-wider transition-all duration-300 shadow-md transform active:scale-95 ${
                        isPrimary
                          ? "bg-red-800 hover:bg-red-900 text-white hover:shadow-lg border border-red-900"
                          : "bg-amber-600 hover:bg-amber-700 text-white hover:shadow-lg border border-amber-700"
                      }`}
                    >
                      {btn.label}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
