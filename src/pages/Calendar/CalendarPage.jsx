import {
  Calendar as CalendarIcon,
  BookOpen,
  Download,
  ChevronLeft,
  ChevronRight,
  Sun,
  Clock,
  Sparkles,
  Search,
  Compass,
  CalendarCheck2,
  Flame,
  ShieldAlert,
} from "lucide-react";
import { useCalendarController } from "./hooks/useCalendarController";
import { toMidnightKey } from "../../hooks/queries/Calendar/useCalendar";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const CalendarPage = () => {
  const {
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    currentDate,
    selectedDate,
    searchQuery,
    setSearchQuery,
    currentYear,
    currentMonth,
    monthDays,
    weekDays,
    selectedEvents,
    selectedPanchangam,
    goToToday,
    goToPrevious,
    goToNext,
    selectDate,
  } = useCalendarController();

  const isTodayDate = (date) =>
    toMidnightKey(date) === toMidnightKey(new Date());
  const isSelectedDate = (date) =>
    toMidnightKey(date) === toMidnightKey(selectedDate);

  const getHeaderDateTitle = () => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    if (viewMode === "week") {
      const first = weekDays[0]?.date;
      const last = weekDays[6]?.date;
      if (!first || !last) return `${MONTH_NAMES[currentMonth]} ${currentYear}`;
      return `${first.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${last.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return `${MONTH_NAMES[currentMonth]} ${currentYear}`;
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* TOP TOOLBAR: Brand & Yearly PDF & Events/Panchangam Toggle*/}
        <header className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-amber-100/60 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#800000]/10 flex items-center justify-center text-[#800000] shrink-0">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-700">
                Temple Almanac
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-serif tracking-tight">
                Festival & Panchangam Calendar
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            <a
              href="/Atlanta_Hanuman_Mandir_2026_Final_R4.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Yearly PDF</span>
            </a>

            <div className="bg-gray-100 p-1 rounded-2xl flex items-center">
              <button
                type="button"
                onClick={() => setActiveTab("calendar")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "calendar"
                    ? "bg-[#800000] text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <CalendarCheck2 className="w-4 h-4" />
                <span>Events</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("panchangam")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "panchangam"
                    ? "bg-[#800000] text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Panchangam</span>
              </button>
            </div>
          </div>
        </header>
        {/* NAVIGATION & VIEW SWITCHER (Month | Week | Day)*/}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-amber-100/60 flex flex-wrap items-center justify-between gap-4">
          {/* Navigation Controls (< > Today) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPrevious}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer"
            >
              Today
            </button>
            <h2 className="text-base sm:text-xl font-bold text-gray-800 ml-2">
              {getHeaderDateTitle()}
            </h2>
          </div>

          {/* VIEW MODE TOGGLE (MONTH | WEEK | DAY) */}
          <div className="bg-gray-100 p-1 rounded-2xl flex items-center">
            {["month", "week", "day"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                  viewMode === mode
                    ? "bg-[#800000] text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        {/* MAIN STAGE: Split Grid View*/}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 8 COLS: CALENDAR CONTAINER */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-amber-100/60 space-y-4">
            {/* ===================== MONTH VIEW ===================== */}
            {viewMode === "month" && (
              <div>
                <div className="grid grid-cols-7 text-center mb-2">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className={`py-2 text-[11px] font-black tracking-wider ${
                        day === "SUN" ? "text-[#800000]" : "text-gray-400"
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {monthDays.map((cell) => {
                    const isSelected = isSelectedDate(cell.date);
                    const isToday = isTodayDate(cell.date);

                    return (
                      <div
                        key={cell.key}
                        onClick={() => selectDate(cell.date)}
                        className={`min-h-[78px] sm:min-h-[96px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                          isSelected
                            ? "border-[#800000] ring-2 ring-[#800000]/15 bg-amber-50/20 shadow-md"
                            : isToday
                              ? "border-amber-300 bg-amber-50/30 hover:border-amber-400"
                              : cell.isCurrentMonth
                                ? "border-gray-100 bg-white hover:border-gray-300 hover:shadow-2xs"
                                : "border-transparent bg-gray-50/40 text-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs sm:text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                              isSelected
                                ? "bg-[#800000] text-white"
                                : isToday
                                  ? "bg-amber-500 text-white"
                                  : cell.isCurrentMonth
                                    ? "text-gray-800"
                                    : "text-gray-300"
                            }`}
                          >
                            {cell.dayNumber}
                          </span>

                          {cell.events.length > 0 && (
                            <span className="sm:hidden w-2 h-2 rounded-full bg-[#800000]" />
                          )}
                        </div>

                        <div className="hidden sm:flex flex-col gap-1 my-1 overflow-hidden">
                          {activeTab === "calendar" ? (
                            cell.events.slice(0, 2).map((ev, evIdx) => (
                              <div
                                key={evIdx}
                                className="text-[10px] font-semibold truncate px-1.5 py-0.5 rounded-md text-white shadow-2xs"
                                style={{
                                  backgroundColor: ev.colour || "#800000",
                                }}
                              >
                                {ev.refDataName}
                              </div>
                            ))
                          ) : cell.panchangam?.tithi &&
                            cell.panchangam.tithi !== "-" ? (
                            <div className="text-[10px] font-medium text-amber-900 bg-amber-50/80 rounded-sm px-1 truncate">
                              {cell.panchangam.tithi}
                            </div>
                          ) : null}

                          {activeTab === "calendar" &&
                            cell.events.length > 2 && (
                              <span className="text-[9px] font-bold text-gray-400 pl-1">
                                +{cell.events.length - 2} more
                              </span>
                            )}
                        </div>

                        {activeTab === "panchangam" &&
                          cell.panchangam?.paksha &&
                          cell.panchangam.paksha !== "-" && (
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter truncate">
                              {cell.panchangam.paksha
                                .replace("Paksha", "")
                                .trim()}
                            </span>
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===================== WEEK VIEW ===================== */}
            {viewMode === "week" && (
              <div className="space-y-3">
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((cell) => {
                    const isSelected = isSelectedDate(cell.date);
                    const isToday = isTodayDate(cell.date);
                    const dayName = WEEKDAYS[cell.date.getDay()];

                    return (
                      <div
                        key={cell.key}
                        onClick={() => selectDate(cell.date)}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#800000] bg-[#800000] text-white shadow-md"
                            : isToday
                              ? "border-amber-300 bg-amber-50/50 text-gray-800"
                              : "border-gray-100 bg-white hover:border-gray-200 text-gray-700"
                        }`}
                      >
                        <p
                          className={`text-[10px] font-black uppercase ${isSelected ? "text-amber-200" : "text-gray-400"}`}
                        >
                          {dayName}
                        </p>
                        <p className="text-base font-extrabold mt-0.5">
                          {cell.dayNumber}
                        </p>
                        <p
                          className={`text-[9px] font-semibold mt-1 truncate ${isSelected ? "text-white/80" : "text-gray-500"}`}
                        >
                          {cell.events.length} Events
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Week Day Expanded Schedule Cards */}
                <div className="space-y-2 mt-4 pt-3 border-t border-gray-100 max-h-[460px] overflow-y-auto pr-1">
                  {weekDays.map((cell) => (
                    <div
                      key={`week-card-${cell.key}`}
                      onClick={() => selectDate(cell.date)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelectedDate(cell.date)
                          ? "border-[#800000] bg-amber-50/20 ring-1 ring-[#800000]/10"
                          : "border-gray-100 bg-gray-50/40 hover:bg-white hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex flex-col items-center justify-center text-gray-800">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">
                            {WEEKDAYS[cell.date.getDay()]}
                          </span>
                          <span className="text-xs font-black">
                            {cell.dayNumber}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            {cell.date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate max-w-xs sm:max-w-md">
                            {cell.events.length > 0
                              ? cell.events.map((e) => e.refDataName).join(", ")
                              : "No Scheduled Events"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                        {cell.events.length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===================== DAY VIEW ===================== */}
            {viewMode === "day" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
                      Active Day View
                    </span>
                    <h3 className="text-lg font-black text-[#800000] font-serif">
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </h3>
                  </div>
                  <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-gray-700 border border-amber-200">
                    {selectedEvents.length} Events Today
                  </span>
                </div>

                {/* Day events timeline view */}
                {selectedEvents.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <CalendarCheck2 className="w-10 h-10 text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-700">
                      No Events Scheduled
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      There are no pooja or special events for this single day.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedEvents.map((ev, idx) => (
                      <div
                        key={`day-ev-${idx}`}
                        className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-amber-200 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: ev.colour || "#800000" }}
                          />
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">
                              {ev.refDataName}
                            </h4>
                            <p className="text-[11px] text-gray-500 font-medium">
                              {ev.dayTypes}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-[#800000]" />
                          <span>
                            {ev.startTime} – {ev.endTime}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column: selected date details */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-amber-100/60">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <div>
                  <span className="text-[10px] font-bold text-[#800000] tracking-wider uppercase">
                    Selected Date
                  </span>
                  <h3 className="text-base font-extrabold text-gray-900 font-serif">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              {activeTab === "calendar" && selectedEvents.length > 0 && (
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter events on this day..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-[#800000]"
                  />
                </div>
              )}

              {/* EVENTS LIST */}
              {activeTab === "calendar" ? (
                selectedEvents.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center">
                    <CalendarCheck2 className="w-10 h-10 text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-700">
                      No Events Scheduled
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      No special festivals or offerings for this day.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                    {selectedEvents.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100 hover:border-amber-200 transition-all flex flex-col gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: ev.colour || "#800000" }}
                          />
                          <h4 className="text-sm font-bold text-gray-800 line-clamp-1">
                            {ev.refDataName}
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-600 bg-white p-2 rounded-xl border border-gray-100">
                          <div>
                            <span className="text-gray-400 block text-[10px]">
                              Start Time
                            </span>
                            <span className="font-semibold text-gray-700">
                              {ev.startTime}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px]">
                              End Time
                            </span>
                            <span className="font-semibold text-gray-700">
                              {ev.endTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : !selectedPanchangam ? (
                <div className="py-10 text-center flex flex-col items-center">
                  <BookOpen className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-sm font-bold text-gray-700">
                    No Panchangam Found
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Panchangam data is not available for this date.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
                        {selectedPanchangam.paksha}
                      </span>
                      <span className="text-xs font-semibold text-amber-900">
                        {selectedPanchangam.weekday}
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-[#800000]">
                      {selectedPanchangam.tithi}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Nakshatra:{" "}
                      <span className="font-bold text-gray-800">
                        {selectedPanchangam.nakshatra}
                      </span>
                    </p>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-500" /> Celestial
                      Coordinates
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-gray-400 block text-[10px]">
                          Sunrise
                        </span>
                        <span className="font-bold text-gray-800">
                          {selectedPanchangam.sunRise}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-gray-400 block text-[10px]">
                          Sunset
                        </span>
                        <span className="font-bold text-gray-800">
                          {selectedPanchangam.sunSet}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-gray-400 block text-[10px]">
                          Moonrise
                        </span>
                        <span className="font-bold text-gray-800">
                          {selectedPanchangam.moonRise}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-gray-400 block text-[10px]">
                          Moonset
                        </span>
                        <span className="font-bold text-gray-800">
                          {selectedPanchangam.moonSet}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-teal-600" /> Samvat &
                      Vedic Details
                    </h5>
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Shaka Samvat</span>
                        <span className="font-bold text-gray-800">
                          {selectedPanchangam.shakaSamvat}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Amanta Month</span>
                        <span className="font-bold text-gray-800">
                          {selectedPanchangam.amantaMonth}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Purnimanta Month</span>
                        <span className="font-bold text-gray-800">
                          {selectedPanchangam.purnimantaMonth}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Yoga / Karana</span>
                        <span className="font-bold text-gray-800">
                          {selectedPanchangam.yoga} /{" "}
                          {selectedPanchangam.karana}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sun Sign</span>
                        <span className="font-bold text-gray-800">
                          {selectedPanchangam.sunsign}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#800000]" /> Muhurtas
                      & Kalam
                    </h5>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-red-50/50 border border-red-100">
                        <span className="text-red-900 font-semibold flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />{" "}
                          Rahu Kalam
                        </span>
                        <span className="font-bold text-red-900">
                          {selectedPanchangam.rahuKalam}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
                        <span className="text-emerald-900 font-semibold flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-emerald-600" />{" "}
                          Amrit Kalam
                        </span>
                        <span className="font-bold text-emerald-900">
                          {selectedPanchangam.amritKalam}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-700">
                        <span>Yamaganda</span>
                        <span className="font-bold">
                          {selectedPanchangam.yamaganda}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-700">
                        <span>Dur Muhurtam</span>
                        <span className="font-bold">
                          {selectedPanchangam.durMuhurtam}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



