/**
 * @file src/components/dashboard/AccountFilterToolbar.jsx
 * @description Reusable Date Mode (`Month`, `Year`, `Date Range`) + Search bar
 * shared across Account tabular views (`MyDonations`, `MySponsors`, `MyPayments`, `RecurringDonations`).
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 */

import { Search } from "lucide-react";
import { ACCOUNT_DATE_MODE_OPTIONS } from "../../hooks/queries/Dashboard/useDateFilteredRecords";

export const AccountFilterToolbar = ({
  dateMode,
  onDateModeChange,
  selectedMonth,
  onSelectedMonthChange,
  selectedYear,
  onSelectedYearChange,
  yearOptions = [],
  fromDateIso,
  onFromDateChange,
  toDateIso,
  onToDateChange,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search records...",
  showDateFilters = true,
}) => {
  return (
    <div className="mt-5 pt-5 border-t border-stone-200/80 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
      {showDateFilters && (
        <>
          {/* Date Mode Selector (Month / Year / Date Range) */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              Select Date
            </label>
            <select
              value={dateMode}
              onChange={(e) => onDateModeChange(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-3.5 py-2.5 text-sm font-medium text-stone-800 focus:border-[#900000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#900000]/15 cursor-pointer"
            >
              {ACCOUNT_DATE_MODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional Date Pickers based on dateMode */}
          {dateMode === "month" && (
            <div className="md:col-span-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Select Month
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => onSelectedMonthChange(e.target.value)}
                onClick={(e) => {
                  if (typeof e.target.showPicker === "function") {
                    e.target.showPicker();
                  }
                }}
                className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-3.5 py-2 text-sm font-medium text-stone-800 focus:border-[#900000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#900000]/15 cursor-pointer"
              />
            </div>
          )}

          {dateMode === "year" && (
            <div className="md:col-span-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Select Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => onSelectedYearChange(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-3.5 py-2.5 text-sm font-medium text-stone-800 focus:border-[#900000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#900000]/15 cursor-pointer"
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {dateMode === "range" && (
            <>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDateIso}
                  onChange={(e) => onFromDateChange(e.target.value)}
                  onClick={(e) => {
                    if (typeof e.target.showPicker === "function") {
                      e.target.showPicker();
                    }
                  }}
                  className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-3 py-2 text-sm font-medium text-stone-800 focus:border-[#900000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#900000]/15 cursor-pointer"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDateIso}
                  min={fromDateIso || undefined}
                  onChange={(e) => onToDateChange(e.target.value)}
                  onClick={(e) => {
                    if (typeof e.target.showPicker === "function") {
                      e.target.showPicker();
                    }
                  }}
                  className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] px-3 py-2 text-sm font-medium text-stone-800 focus:border-[#900000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#900000]/15 cursor-pointer"
                />
              </div>
            </>
          )}
        </>
      )}

      {/* Search Input */}
      <div className={showDateFilters ? "md:col-span-5" : "md:col-span-12"}>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
          Search
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-stone-300 bg-[#fdfbf7] pl-10 pr-4 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-[#900000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#900000]/15"
          />
        </div>
      </div>
    </div>
  );
};

export default AccountFilterToolbar;
