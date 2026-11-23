/**
 * @file src/pages/Events/EventDetails.jsx
 * @description Presentational route page for `/event/:eventSlug/:eventId`.
 * Renders the top Event Hero (image lightbox, date range, rich description,
 * sponsorship amount, and direct Add to Cart when parent `serviceAmount > 0`)
 * followed by the lower child offerings section reusing `UniversalServiceCard`
 * and `CommonCartFooter` for 100% UI/UX consistency across Services, Sponsorships,
 * Donations, and Events.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Critical Architectural Non-Negotiables #1, #2, #3, #4, and #5.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { useEventDetailData } from "../../hooks/queries/Home/useEventsData";
import { useGetClientSettings } from "../../hooks/queries/Donations/useGetDonations";
import { useCartStore } from "../../store/useCartStore";
import { useServicesStore } from "../../store/useServicesStore";
import { UniversalServiceCard } from "../../components/shared/UniversalServiceCard";
import { CommonCartFooter } from "../../components/shared/CommonCartFooter";
import { APP_COLORS } from "../../constants/appColors";
import { APP_FONTS } from "../../constants/appTheme";
import bgCard from "../../assets/bg-card.png";

/**
 * Strips potentially unsafe tags and inline event handlers from backend rich-text HTML.
 *
 * @param {string} rawHtml
 * @returns {string}
 */
const sanitizeEventHtml = (rawHtml) => {
  if (!rawHtml || typeof rawHtml !== "string") return "";
  return rawHtml
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
};

/**
 * Formats a numeric USD value safely as `0.00`.
 *
 * @param {number|string} value
 * @returns {string}
 */
const formatUsd = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
};

/**
 * Decorative ornamental divider matching the temple crimson aesthetic.
 */
const TempleOrnamentDivider = () => (
  <div
    className="flex items-center justify-center gap-2 my-1.5"
    aria-hidden="true"
  >
    <span className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#900000]/60" />
    <span className="w-1.5 h-1.5 rotate-45 bg-[#D97706]" />
    <span className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#900000]/60" />
  </div>
);

/**
 * Loading skeleton matching the Event Hero and 3-column UniversalServiceCard grid.
 */
const EventDetailsSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
    <div className="bg-white/95 rounded-2xl shadow-xs border border-gray-200 p-6 md:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 flex flex-col items-center gap-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="w-full max-w-sm aspect-[4/3] bg-gray-200 rounded-xl" />
          <div className="h-4 bg-gray-200 rounded w-36" />
        </div>
        <div className="lg:col-span-7 flex flex-col items-center gap-4">
          <div className="h-6 bg-gray-200 rounded w-52" />
          <div className="w-full space-y-2.5">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-11/12" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
          </div>
          <div className="h-6 bg-gray-200 rounded w-64 mt-2" />
          <div className="h-10 bg-gray-200 rounded-xl w-40 mt-2" />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs"
        >
          <div className="h-48 bg-gray-200 w-full" />
          <div className="p-5 space-y-3">
            <div className="h-5 bg-gray-200 rounded-md w-3/4" />
            <div className="h-6 bg-gray-200 rounded-md w-20" />
            <div className="h-4 bg-gray-200 rounded-md w-full" />
            <div className="h-9 bg-gray-200 rounded-lg w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Accessible Lightbox Modal for "View image in large".
 */
const EventImageLightbox = ({ isOpen, imageUrl, title, onClose }) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} full preview`}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-[#D97706]"
      >
        <div
          className="flex items-center justify-between px-5 py-3.5 text-white"
          style={{ backgroundColor: APP_COLORS.primary }}
        >
          <h3
            className="text-base sm:text-lg font-bold truncate pr-4"
            style={{ fontFamily: APP_FONTS.heading }}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image preview"
            className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-stone-950 flex items-center justify-center max-h-[80vh] overflow-auto p-3">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[75vh] w-auto object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export const EventDetails = () => {
  const { eventSlug = "", eventId = "" } = useParams();
  const navigate = useNavigate();

  const decodedEventName = useMemo(() => {
    try {
      return decodeURIComponent(String(eventSlug).replace(/\+/g, " ")).trim();
    } catch {
      return String(eventSlug).replace(/\+/g, " ").trim();
    }
  }, [eventSlug]);

  const { data, isLoading, isError, refetch } = useEventDetailData({
    eventId,
    eventName: decodedEventName,
  });

  const { data: clientSettings } = useGetClientSettings();
  const currencySymbol = clientSettings?.generalSetting?.currencySymbol || "$";

  // Global Cart & Services UI Toast Store
  const totalCount = useCartStore((state) => state.totalCount || 0);
  const insertItem = useCartStore(
    (state) => state.insertItem || state.addItem || state.upsertItem,
  );

  const activeToast = useServicesStore((state) => state.activeToast);
  const clearToast = useServicesStore((state) => state.clearToast);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addedFeedback, setAddedFeedback] = useState(false);

  const [activeGroupTab, setActiveGroupTab] = useState("ALL");
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroupCollapse = (groupTitle) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  useEffect(() => {
    if (!activeToast) return undefined;
    const timer = setTimeout(() => {
      clearToast();
    }, 3500);
    return () => clearTimeout(timer);
  }, [activeToast, clearToast]);

  const event = data?.event || null;
  const hasDirectAmount = Boolean(data?.hasDirectAmount);
  const groupedSections = useMemo(
    () => data?.groupedSections || [],
    [data?.groupedSections],
  );
  const ungroupedItems = useMemo(
    () => data?.ungroupedItems || [],
    [data?.ungroupedItems],
  );

  const sanitizedDescription = useMemo(
    () => sanitizeEventHtml(event?.description || ""),
    [event?.description],
  );

  // Filter grouped & ungrouped offerings when user searches
  const filteredGroupedSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groupedSections;
    return groupedSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            (item.title || "").toLowerCase().includes(q) ||
            (item.description || "").toLowerCase().includes(q) ||
            (section.groupTitle || "").toLowerCase().includes(q),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [groupedSections, searchQuery]);

  const filteredUngroupedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ungroupedItems;
    return ungroupedItems.filter(
      (item) =>
        (item.title || "").toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q),
    );
  }, [ungroupedItems, searchQuery]);

  const handleDirectAddToCart = () => {
    if (!event || typeof insertItem !== "function") return;
    const resolvedTitle = event.refDataName || event.title || "Temple Event";
    const resolvedDates = event.startDate ? [event.startDate] : [];

    insertItem({
      id: event.id,
      title: resolvedTitle,
      refDataName: resolvedTitle,
      amount: Number(event.amount || 0),
      quantity: 1,
      qtyCounterEnabled: false,
      image: event.imageUrl || "",
      category: "EVENT",
      itemType: "EVENT",
      serviceCategoryTypes: event.serviceCategoryTypes || "EVENTS",
      serviceTypes: event.serviceTypes || "",
      selectedDates: resolvedDates,
      selectedTime: event.startTime || "",
      includeSankalpam: event.includeSankalpam || "",
      rawItem: event.rawItem || event,
    });

    setAddedFeedback(true);
    window.setTimeout(() => setAddedFeedback(false), 1800);
  };

  const cardTextureStyle = {
    backgroundImage: `url(${bgCard})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const hasChildOfferings =
    !hasDirectAmount &&
    (groupedSections.length > 0 || ungroupedItems.length > 0);

  return (
    <section
      className="w-full min-h-screen bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top pb-28"
      aria-labelledby="event-hero-heading"
    >
      {/* 1. Back Navigation Bar */}
      <div className="bg-white/90 border-b border-gray-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-xs sm:text-sm font-bold text-[#900000] shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home & Upcoming Events</span>
          </Link>
          {event?.serviceCategoryTypes && (
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-[#900000] border border-amber-200">
              {event.serviceCategoryTypes}
            </span>
          )}
        </div>
      </div>

      {/* 2. Validation / Warning Alert Banner (From UniversalServiceCard) */}
      {activeToast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className={`flex items-center justify-between p-4 rounded-r-xl shadow-sm border-l-4 ${
              activeToast.type === "warning"
                ? "bg-amber-50 border-amber-600 text-amber-900"
                : activeToast.type === "success"
                  ? "bg-emerald-50 border-emerald-600 text-emerald-900"
                  : "bg-red-50 border-red-600 text-red-900"
            }`}
            role="alert"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">
                {activeToast.type === "warning"
                  ? "⚠️"
                  : activeToast.type === "success"
                    ? "✅"
                    : "🛑"}
              </span>
              <span className="text-xs sm:text-sm font-medium">
                {activeToast.message}
              </span>
            </div>
            <button
              type="button"
              onClick={clearToast}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-md text-xs font-bold cursor-pointer"
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <EventDetailsSkeleton />
      ) : isError ? (
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-xs border border-red-200 p-8">
            <h2 className="text-lg font-serif font-bold text-[#900000] mb-2">
              Unable to Load Event Details
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-6">
              Please check your connection and try loading this temple event
              again.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xs cursor-pointer"
              style={{ backgroundColor: APP_COLORS.primary }}
            >
              Retry
            </button>
          </div>
        </div>
      ) : !event ? (
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-8">
            <h2 className="text-lg font-serif font-bold text-[#900000] mb-2">
              Event Not Found
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-6">
              This temple event may have concluded or the link is no longer
              active.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white"
              style={{ backgroundColor: APP_COLORS.primary }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Upcoming Events</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
          {/* 3. TOP HERO CARD */}
          <section
            aria-labelledby="event-hero-heading"
            className="bg-white/95 rounded-2xl shadow-xs border border-gray-200 p-6 sm:p-8 lg:p-10"
            style={cardTextureStyle}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Column: Event Title + Image + View Image in Large */}
              <div className="lg:col-span-5 flex flex-col items-center text-center">
                <h1
                  id="event-hero-heading"
                  className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold tracking-tight text-[#900000]"
                >
                  {event.title}
                </h1>
                <TempleOrnamentDivider />

                {event.imageUrl ? (
                  <div className="mt-3 flex flex-col items-center w-full">
                    <div className="w-full max-w-[340px] rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-auto max-h-[300px] object-contain mx-auto"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1d4ed8] hover:text-[#900000] underline underline-offset-4 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>View image in large</span>
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Right Column: Date Range + HTML Description + Sponsorship Amount + Direct Cart CTA */}
              <div className="lg:col-span-7 flex flex-col items-center text-center">
                {event.dateRangeLabel && (
                  <div className="mb-3">
                    <p className="text-lg sm:text-xl font-serif font-bold text-[#900000]">
                      {event.dateRangeLabel}
                    </p>
                    <TempleOrnamentDivider />
                  </div>
                )}

                {sanitizedDescription && (
                  <div
                    className="w-full text-gray-700 text-sm sm:text-base leading-relaxed prose prose-sm max-w-none [&_h4]:text-base [&_h4]:sm:text-lg [&_h4]:leading-relaxed [&_h4]:my-1"
                    dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                  />
                )}

                {!hasChildOfferings && (
                  <div className="mt-5 flex flex-col items-center">
                    <p className="text-base sm:text-lg font-serif font-bold text-[#900000]">
                      {event.title} Sponsorship Amount:
                    </p>
                    <TempleOrnamentDivider />
                    <p className="text-lg sm:text-xl font-extrabold text-gray-900 mt-1">
                      {currencySymbol}
                      {formatUsd(event.amount)}
                    </p>
                  </div>
                )}

                {/* FLOW A: Direct Add to Cart (When parent event has serviceAmount > 0) */}
                {hasDirectAmount && (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleDirectAddToCart}
                      className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider text-stone-900 bg-[#FBBF24] hover:bg-[#F59E0B] active:scale-[0.99] shadow-xs border border-amber-500/60 transition-all cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>
                        {addedFeedback ? "Added to Cart!" : "Add to Cart"}
                      </span>
                    </button>

                    {totalCount > 0 && (
                      <button
                        type="button"
                        onClick={() => navigate("/checkout")}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider text-amber-300 bg-[#900000] hover:bg-[#780000] shadow-xs transition-all cursor-pointer"
                      >
                        <span>Proceed to Checkout ({totalCount})</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 4. LOWER SECTION: Reusing UniversalServiceCard + Search Bar */}
          {hasChildOfferings && (
            <main
              aria-label="Event Sponsorships and Offerings"
              className="space-y-8"
            >
              {/* Full-Width Search Bar (Identical to Services / Sponsorships / Donations) */}
              <div className="w-full pb-6 border-b border-gray-200">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search offerings, prasadam, sponsorships..."
                    aria-label="Search event offerings"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#900000] focus:border-transparent transition-all shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* FLOW B: Group Quick-Jump Tabs + Collapsible Sections by `EventDispay` */}
              {filteredGroupedSections.length > 0 && (
                <div className="space-y-6">
                  {/* Horizontal Group Filter Pills (Prevents long scrolling when groups have many items) */}
                  {filteredGroupedSections.length > 1 && (
                    <div
                      role="tablist"
                      aria-label="Filter offerings by category group"
                      className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeGroupTab === "ALL"}
                        onClick={() => setActiveGroupTab("ALL")}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                          activeGroupTab === "ALL"
                            ? "bg-[#900000] text-white shadow-xs"
                            : "bg-white text-gray-700 border border-gray-200 hover:border-[#900000]/40 hover:text-[#900000]"
                        }`}
                      >
                        All Groups (
                        {filteredGroupedSections.reduce(
                          (sum, sec) => sum + sec.items.length,
                          0,
                        )}
                        )
                      </button>

                      {filteredGroupedSections.map((sec) => {
                        const isSelected = activeGroupTab === sec.groupTitle;
                        return (
                          <button
                            key={sec.groupTitle}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            onClick={() => setActiveGroupTab(sec.groupTitle)}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#900000] text-white shadow-xs"
                                : "bg-white text-gray-700 border border-gray-200 hover:border-[#900000]/40 hover:text-[#900000]"
                            }`}
                          >
                            {sec.groupTitle} ({sec.items.length})
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Filtered & Collapsible Group Sections */}
                  {filteredGroupedSections
                    .filter(
                      (section) =>
                        activeGroupTab === "ALL" ||
                        section.groupTitle === activeGroupTab,
                    )
                    .map((section) => {
                      const isCollapsed =
                        activeGroupTab === "ALL" &&
                        Boolean(collapsedGroups[section.groupTitle]);

                      return (
                        <div key={section.groupTitle} className="space-y-4">
                          <button
                            type="button"
                            onClick={() => {
                              if (activeGroupTab === "ALL") {
                                toggleGroupCollapse(section.groupTitle);
                              }
                            }}
                            aria-expanded={!isCollapsed}
                            className="w-full flex items-center justify-between border-b border-gray-200 pb-2.5 text-left group cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#900000] group-hover:text-[#780000] transition-colors">
                                {section.groupTitle}
                              </h2>
                              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                                {section.items.length}{" "}
                                {section.items.length === 1
                                  ? "Offering"
                                  : "Offerings"}
                              </span>
                            </div>

                            {activeGroupTab === "ALL" && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 group-hover:text-[#900000]">
                                <span>
                                  {isCollapsed ? "Expand" : "Collapse"}
                                </span>
                                {isCollapsed ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronUp className="w-4 h-4" />
                                )}
                              </span>
                            )}
                          </button>

                          {!isCollapsed && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {section.items.map((service) => (
                                <UniversalServiceCard
                                  key={service.id}
                                  service={service}
                                  currencySymbol={currencySymbol}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* FLOW C: Ungrouped Offerings when `EventDispay` is Empty */}
              {filteredUngroupedItems.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredUngroupedItems.map((service) => (
                    <UniversalServiceCard
                      key={service.id}
                      service={service}
                      currencySymbol={currencySymbol}
                    />
                  ))}
                </div>
              )}

              {filteredGroupedSections.length === 0 &&
                filteredUngroupedItems.length === 0 &&
                searchQuery.trim() !== "" && (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs max-w-xl mx-auto">
                    <h2 className="text-lg font-bold text-gray-900">
                      No Offerings Found
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      No active offerings match “{searchQuery}”.
                    </p>
                  </div>
                )}
            </main>
          )}
        </div>
      )}

      {/* 5. Reusable Common Cart Footer */}
      {(hasChildOfferings || totalCount > 0) && (
        <CommonCartFooter checkoutPath="/checkout" />
      )}

      {/* Full-Resolution Image Lightbox Modal */}
      <EventImageLightbox
        isOpen={isLightboxOpen}
        imageUrl={event?.imageUrl}
        title={event?.title || "Temple Event"}
        onClose={() => setIsLightboxOpen(false)}
      />
    </section>
  );
};

export default EventDetails;
