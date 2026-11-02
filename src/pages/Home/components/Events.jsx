import { useState } from "react";
import {
  useTempleScheduleData,
  useTodaysPanchangamData,
  useUpcomingEventsData,
} from "../../../hooks/queries/Home/useEventsData";
import { APP_COLORS } from "../../../constants/appColors";
import { APP_FONTS } from "../../../constants/appTheme";
import bgCard from "../../../assets/bg-card.png";

const DataRow = ({ label, value }) => (
  <div className="flex items-start py-3 border-b border-dotted border-gray-400 last:border-0">
    <span className="w-2/5 font-semibold text-gray-700 text-lg">{label}</span>
    <span className="w-[5%] text-gray-500">:</span>
    <span className="w-[55%] text-gray-600 break-words text-lg">
      {value || "N/A"}
    </span>
  </div>
);

const WidgetSkeleton = () => (
  <div className="flex-1 p-5 flex flex-col gap-4 w-full h-full animate-pulse">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="flex flex-col gap-2 border-b border-gray-200 pb-3 last:border-0"
      >
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

export const EventsWidget = () => {
  const { data: events = [], isLoading, isError } = useTempleScheduleData();
  const [activeTab, setActiveTab] = useState("DAILY");
  const tabs = ["DAILY", "WEEKLY", "MONTHLY"];

  const { data: panchangamData, isLoading: isPanchangamLoading } =
    useTodaysPanchangamData();

  const { data: upcomingEventData = [], isLoading: isUpcomingEventLoading } =
    useUpcomingEventsData();

  if (isError) return null;

  // Active tab filtering
  const filteredEvents = events.filter(
    (event) => event.scheduleType === activeTab,
  );

  const cardBgStyle = {
    backgroundImage: `url(${bgCard})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* 3-Column Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        {/* CARD 1: Upcoming Events */}
        <div
          className="w-full h-[500px] flex flex-col shadow-lg border border-gray-200 overflow-hidden rounded-sm md:col-span-2 lg:col-span-1"
          style={cardBgStyle}
        >
          {/* Header */}
          <div
            className="text-center py-3 border-b-2 shrink-0"
            style={{
              backgroundColor: APP_COLORS.primary,
              borderColor: APP_COLORS.secondary,
            }}
          >
            <h2
              className="text-xl md:text-2xl font-bold uppercase text-white tracking-wide"
              style={{ fontFamily: APP_FONTS.heading }}
            >
              UPCOMING EVENTS
            </h2>
          </div>
          {/* Events List / Empty State */}
          <div className="w-full flex-1 flex text-gray-400">
            {isUpcomingEventLoading ? (
              <div className="w-full h-full bg-white/80">
                <WidgetSkeleton />
              </div>
            ) : upcomingEventData.length > 0 ? (
              <ul className="flex flex-col w-full text-left h-full overflow-y-auto">
                {upcomingEventData.map((event) => (
                  <li
                    key={event.id}
                    className="py-4 px-5 border-b border-dotted border-gray-400 hover:bg-black/5 transition-colors flex items-center gap-4"
                  >
                    {/* Left Side: Thumbnail Image */}
                    {event.thumbnailImage && (
                      <div className="shrink-0 w-16 h-16 rounded-md overflow-hidden border border-gray-300 shadow-sm flex items-center justify-center">
                        <img
                          src={event.thumbnailImage}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {/* Right Side: Text Content */}
                    <div className="flex-1 flex flex-col justify-center">
                      <h3
                        className="text-base font-bold mb-0.5 uppercase text-sm leading-tight"
                        style={{ color: APP_COLORS.primary }}
                      >
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {event.date} {event.timing && ` | ${event.timing}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 font-semibold italic p-4 text-center">
                No Upcoming Events found.
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: Temple Schedule */}
        <div
          className="w-full h-[500px] flex flex-col shadow-lg border border-gray-200 overflow-hidden rounded-sm"
          style={cardBgStyle}
        >
          {/* Header */}
          <div
            className="text-center py-3 border-b-2 shrink-0"
            style={{
              backgroundColor: APP_COLORS.primary,
              borderColor: APP_COLORS.secondary,
            }}
          >
            <h2
              className="text-xl md:text-2xl font-bold uppercase text-white tracking-wide"
              style={{ fontFamily: APP_FONTS.heading }}
            >
              TEMPLE SCHEDULES
            </h2>
          </div>
          {/* Tabs */}
          <div className="flex items-center justify-center space-x-2 py-3 border-b border-gray-200 shadow-inner">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1 text-sm font-bold uppercase transition-all duration-200 rounded ${
                    isActive
                      ? "text-white border-2 scale-105"
                      : "text-gray-600 bg-gray-300 hover:bg-gray-400 border-2 border-transparent"
                  }`}
                  style={{
                    backgroundColor: isActive ? APP_COLORS.primary : "",
                    borderColor: isActive ? APP_COLORS.secondary : "",
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>
          {/* Events List / Empty State */}
          <div className="w-full flex-1 overflow-y-auto">
            {isLoading ? (
              <WidgetSkeleton />
            ) : filteredEvents.length > 0 ? (
              <ul className="flex flex-col">
                {filteredEvents.map((event) => (
                  <li
                    key={event.id}
                    className="py-4 px-5 border-b border-dotted border-gray-400 hover:bg-black/5 transition-colors"
                  >
                    <h3
                      className="text-base font-bold mb-0.5 uppercase text-sm"
                      style={{ color: APP_COLORS.primary }}
                    >
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-800 font-medium">
                      {event.timing}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 font-semibold italic p-4 text-center">
                No {activeTab.toLowerCase()} schedules found.
              </div>
            )}
          </div>
        </div>

        {/* CARD 3: Today's Panchangam */}
        <div
          className="w-full h-[500px] flex flex-col shadow-lg border border-gray-200 overflow-hidden rounded-sm"
          style={cardBgStyle}
        >
          {/* Header */}
          <div
            className="text-center py-3 border-b-2 shrink-0"
            style={{
              backgroundColor: APP_COLORS.primary,
              borderColor: APP_COLORS.secondary,
            }}
          >
            <h2
              className="text-xl md:text-2xl font-bold uppercase text-white tracking-wide"
              style={{ fontFamily: APP_FONTS.heading }}
            >
              TODAY'S PANCHANGAM
            </h2>
          </div>
          <div className="flex justify-between items-center px-5 py-3 bg-[#fdf5e6] border-b border-gray-200 shrink-0">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase font-bold text-gray-500">
                Date
              </span>
              <span
                className="font-bold"
                style={{ color: APP_COLORS.textBrandPrimary }}
              >
                {panchangamData?.date || ""}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[11px] uppercase font-bold text-gray-500">
                Day
              </span>
              <span
                className="font-bold"
                style={{ color: APP_COLORS.textBrandPrimary }}
              >
                {panchangamData?.day || ""}
              </span>
            </div>
          </div>
          {/* Tabular Data List / Empty State */}
          <div className="w-full overflow-y-auto p-5 flex flex-col text-xl md:text-base border-b border-dotted border-gray-400">
            {isPanchangamLoading ? (
              <WidgetSkeleton />
            ) : panchangamData ? (
              <>
                <DataRow label="Tithi" value={panchangamData.tithi} />
                <DataRow label="Nakshatra" value={panchangamData.nakshatra} />
                <DataRow label="Yog" value={panchangamData.yoga} />
                <DataRow label="Karan" value={panchangamData.karana} />
                <DataRow label="Sunrise" value={panchangamData.sunRise} />
                <DataRow label="Sunset" value={panchangamData.sunSet} />
                <DataRow label="RahuKalam" value={panchangamData.rahuKalam} />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 font-semibold italic p-4 text-center">
                No Panchangam data available for today.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
