/**
 * @file src/components/dashboard/DashboardSummaryCard.jsx
 * @description Reusable, Temple-themed KPI summary card for the Devotee Dashboard.
 * Features royal HTKY Crimson & Temple Gold gradients, subtle sacred radial corner
 * watermark, elevated icon medallion, 2-digit formatted metric count ("00", "06", "33"),
 * and an interactive "View All" footer bar.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Non-Negotiables #1, #2, #4, and #5.
 */

import { ArrowUpRight } from "lucide-react";

const ACCENT_VARIANTS = Object.freeze({
  crimson: {
    cardSurface: "from-white via-[#fffcf8] to-[#fcf0ee]",
    border: "border-[#900000]/20 hover:border-[#900000]/50",
    shadowHover: "hover:shadow-lg hover:shadow-[#900000]/10",
    topRibbon: "from-[#900000] via-[#b81d1d] to-amber-500",
    cornerGlow: "bg-[#900000]/[0.05] group-hover:bg-[#900000]/[0.09]",
    iconMedallion:
      "bg-gradient-to-br from-[#900000] to-[#680000] text-amber-200 shadow-sm shadow-[#900000]/25",
    badgePill: "bg-amber-50/90 text-[#900000] border-amber-200/90",
    countText: "text-[#900000]",
    footerDivider: "border-[#900000]/10",
    ctaText: "text-[#900000] group-hover:text-[#680000]",
    ctaChip:
      "bg-[#900000]/8 group-hover:bg-[#900000] group-hover:text-amber-200",
  },
  gold: {
    cardSurface: "from-white via-[#fffdf7] to-[#fdf3dc]",
    border: "border-amber-300/70 hover:border-amber-500",
    shadowHover: "hover:shadow-lg hover:shadow-amber-600/10",
    topRibbon: "from-amber-600 via-amber-500 to-[#900000]",
    cornerGlow: "bg-amber-500/[0.07] group-hover:bg-amber-500/[0.12]",
    iconMedallion:
      "bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-sm shadow-amber-700/25",
    badgePill: "bg-amber-100/80 text-amber-900 border-amber-300/80",
    countText: "text-amber-900",
    footerDivider: "border-amber-200/70",
    ctaText: "text-amber-900 group-hover:text-[#900000]",
    ctaChip: "bg-amber-500/15 group-hover:bg-amber-600 group-hover:text-white",
  },
  emerald: {
    cardBg: "from-[#fffdf7] via-[#fdf7e7] to-[#f8eccb]",
    border: "border-amber-300/80 hover:border-amber-600",
    glowRing: "group-hover:shadow-amber-900/15",
    topBar: "from-amber-700 via-yellow-500 to-red-800",
    auraFill: "text-amber-600/[0.08] group-hover:text-amber-600/[0.14]",
    iconOuter: "bg-amber-500/20 ring-1 ring-amber-500/40",
    iconInner: "bg-gradient-to-br from-amber-600 to-yellow-800 text-amber-50",
    badge: "bg-white/95 text-amber-900 border-amber-300/80",
    countText: "text-amber-900",
    ctaPill:
      "bg-white/95 group-hover:bg-amber-700 text-amber-900 group-hover:text-white border-amber-300 group-hover:border-amber-700",
  },
  saffron: {
    cardSurface: "from-white via-[#fffbf7] to-[#fdeee2]",
    border: "border-orange-300/70 hover:border-orange-500",
    shadowHover: "hover:shadow-lg hover:shadow-orange-600/10",
    topRibbon: "from-orange-600 via-amber-500 to-[#900000]",
    cornerGlow: "bg-orange-500/[0.06] group-hover:bg-orange-500/[0.11]",
    iconMedallion:
      "bg-gradient-to-br from-orange-600 to-red-800 text-amber-100 shadow-sm shadow-orange-700/25",
    badgePill: "bg-orange-50 text-orange-900 border-orange-200",
    countText: "text-orange-900",
    footerDivider: "border-orange-200/70",
    ctaText: "text-orange-800 group-hover:text-[#900000]",
    ctaChip:
      "bg-orange-500/10 group-hover:bg-orange-600 group-hover:text-white",
  },
  royal: {
    cardBg: "from-[#fffdfb] via-[#fcf7f4] to-[#f6ece6]",
    border: "border-amber-200/90 hover:border-[#900000]/45",
    glowRing: "group-hover:shadow-amber-950/10",
    topBar: "from-amber-700 via-[#900000] to-amber-500",
    auraFill: "text-[#900000]/[0.04] group-hover:text-[#900000]/[0.08]",
    iconOuter: "bg-[#900000]/10 ring-1 ring-amber-400/40",
    iconInner: "bg-gradient-to-br from-[#5c0a0a] to-[#900000] text-amber-200",
    badge: "bg-white/95 text-[#7a0000] border-amber-200/80",
    countText: "text-[#6b0f1a]",
    ctaPill:
      "bg-white/90 group-hover:bg-[#900000] text-[#7a0000] group-hover:text-amber-200 border-amber-200/90 group-hover:border-[#900000]",
  },
});

export const DashboardSummaryCard = ({
  title,
  count = "00",
  subtitle = "",
  icon: Icon,
  variant = "crimson",
  isLoading = false,
  actionLabel = "View All",
  onAction,
}) => {
  const theme = ACCENT_VARIANTS[variant] || ACCENT_VARIANTS.crimson;

  if (isLoading) {
    return (
      <div
        className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs animate-pulse space-y-4"
        aria-busy="true"
      >
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-xl bg-stone-200" />
          <div className="h-5 bg-stone-200 rounded-full w-20" />
        </div>
        <div className="space-y-2 pt-1">
          <div className="h-3 bg-stone-200 rounded w-1/2" />
          <div className="h-9 bg-stone-200 rounded w-16" />
        </div>
        <div className="h-4 bg-stone-100 rounded w-24" />
      </div>
    );
  }

  return (
    <article
      onClick={onAction}
      role={typeof onAction === "function" ? "button" : undefined}
      tabIndex={typeof onAction === "function" ? 0 : undefined}
      onKeyDown={(e) => {
        if (
          typeof onAction === "function" &&
          (e.key === "Enter" || e.key === " ")
        ) {
          e.preventDefault();
          onAction();
        }
      }}
      className={`group relative overflow-hidden rounded-2xl border ${theme.border} bg-gradient-to-br ${theme.cardSurface} p-5 shadow-xs ${theme.shadowHover} hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between ${
        typeof onAction === "function" ? "cursor-pointer" : ""
      }`}
    >
      {/* Top Temple Gradient Ribbon */}
      <div
        className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${theme.topRibbon}`}
      />

      {/* Decorative Sacred Arch Corner Glow */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-8 -top-8 w-28 h-28 rounded-full transition-colors duration-300 ${theme.cornerGlow}`}
      />

      {/* Header Row: Medallion Icon + Period Pill */}
      <div className="relative flex items-center justify-between gap-3 pt-1">
        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl ${theme.iconMedallion} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}
          >
            <Icon className="w-5 h-5" strokeWidth={2.1} />
          </div>
        )}

        {subtitle && (
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${theme.badgePill} shadow-2xs`}
          >
            {subtitle}
          </span>
        )}
      </div>

      {/* Center Metric Row: Title + Large Temple Serif Count */}
      <div className="relative mt-5 flex items-end justify-between gap-2">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-600">
            {title}
          </h3>
          <p
            className={`mt-1 text-3xl sm:text-4xl font-serif font-extrabold tracking-tight ${theme.countText}`}
          >
            {count}
          </p>
        </div>

        {/* Subtle Decorative Temple Diamond */}
        <span
          aria-hidden="true"
          className="text-amber-500/40 font-serif text-lg select-none pb-1"
        >
          ✦
        </span>
      </div>

      {/* Footer Row: Interactive View All Trigger */}
      {typeof onAction === "function" && (
        <div
          className={`relative mt-4 pt-3 border-t ${theme.footerDivider} flex items-center justify-between`}
        >
          <span
            className={`text-xs font-extrabold uppercase tracking-wider ${theme.ctaText} transition-colors`}
          >
            {actionLabel}
          </span>
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${theme.ctaChip}`}
          >
            <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      )}
    </article>
  );
};

export default DashboardSummaryCard;
