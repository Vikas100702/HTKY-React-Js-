/**
 * @file src/pages/Dashboard/MyPujaBookings.jsx
 * @description Tabular detail view for a devotee's Puja Bookings (`/account/puja-bookings`).
 * Accessible from both the Dashboard "View All" action and the AccountLayout left sidebar.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 */

import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  Flame,
  RefreshCw,
} from "lucide-react";
import {
  PUJA_CATEGORY_OPTIONS,
  useMyPujaBookings,
} from "../../hooks/queries/Dashboard/useMyPujaBookings";
import { AccountFilterToolbar } from "../../components/dashboard/AccountFilterToolbar";

const PAYMENT_STATUS_BADGE = Object.freeze({
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  INITIATED: "bg-sky-50 text-sky-700 border-sky-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
});

export const MyPujaBookings = () => {
  const navigate = useNavigate();

  const {
    rows,
    totalEntries,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    categoryFilter,
    setCategoryFilter,
    dateMode,
    setDateMode,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    yearOptions,
    fromDateIso,
    setFromDateIso,
    toDateIso,
    setToDateIso,
    resolvedDateRange,
    searchQuery,
    setSearchQuery,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useMyPujaBookings({ pageSize: 10 });

  const startEntry = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalEntries);

  return (
    <div className="space-y-6">
      {/* ================= TOP HEADER BAR ================= */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <button
              type="button"
              onClick={() => navigate("/account/dashboard")}
              title="Back to Devotee Dashboard"
              className="mt-0.5 sm:mt-0 p-2 rounded-xl border border-stone-200 bg-[#fdfbf7] text-stone-600 hover:text-[#900000] hover:border-[#900000]/40 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#900000] to-[#6e0000] text-amber-200 flex items-center justify-center shadow-xs shrink-0">
              <Flame className="w-5 h-5" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#900000] tracking-tight">
                My Puja Bookings
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Showing records from{" "}
                <span className="font-semibold text-stone-700">
                  {resolvedDateRange.startDate}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-stone-700">
                  {resolvedDateRange.endDate}
                </span>
              </p>
            </div>
          </div>

          {/* Right Controls: Category Filter Dropdown + Refresh (No '+' button) */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-amber-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Filter Puja Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-[#900000] hover:bg-[#780000] text-white text-xs font-bold uppercase tracking-wider pl-8 pr-8 py-2.5 rounded-xl shadow-xs border border-[#900000] focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer transition-colors"
              >
                {PUJA_CATEGORY_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    className="bg-white text-stone-900 font-semibold"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-amber-200">
                ▼
              </span>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh Bookings"
              className="p-2.5 rounded-xl border border-stone-200 bg-[#fdfbf7] text-stone-600 hover:text-[#900000] hover:border-[#900000]/40 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetching ? "animate-spin text-[#900000]" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Reusable Date Mode + Search Toolbar */}
        <AccountFilterToolbar
          dateMode={dateMode}
          onDateModeChange={setDateMode}
          selectedMonth={selectedMonth}
          onSelectedMonthChange={setSelectedMonth}
          selectedYear={selectedYear}
          onSelectedYearChange={setSelectedYear}
          yearOptions={yearOptions}
          fromDateIso={fromDateIso}
          onFromDateChange={setFromDateIso}
          toDateIso={toDateIso}
          onToDateChange={setToDateIso}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by receipt #, service name, status..."
        />
      </div>

      {/* ================= ERROR ALERT ================= */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between gap-4 text-rose-900">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-xs sm:text-sm font-medium">
              {error?.message ||
                "Unable to load your puja bookings right now. Please try again."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3.5 py-1.5 rounded-lg bg-[#900000] text-white text-xs font-bold hover:bg-[#780000] transition-colors cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ================= TABULAR BOOKINGS CARD ================= */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[880px]">
            <thead>
              <tr className="bg-gradient-to-r from-[#900000] to-[#740000] text-amber-50 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Receipt #</th>
                <th className="py-3.5 px-4">Booking Date</th>
                <th className="py-3.5 px-4">Service Name</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Service Date/Time</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Preferred Priest</th>
                <th className="py-3.5 px-4">Location</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200/80 text-xs sm:text-sm text-stone-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    {Array.from({ length: 8 }).map((__, colIdx) => (
                      <td key={`cell-${colIdx}`} className="py-3.5 px-4">
                        <div className="h-4 bg-stone-200/80 rounded w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="text-base font-serif font-bold text-stone-800">
                        No Puja Bookings Found
                      </p>
                      <p className="text-xs text-stone-500">
                        No records matched the selected category or date range.
                        Try switching the category filter or expanding the date
                        period.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const badgeStyle =
                    PAYMENT_STATUS_BADGE[row.paymentStatus] ||
                    "bg-stone-100 text-stone-700 border-stone-200";

                  return (
                    <tr
                      key={row.id}
                      className={`${
                        idx % 2 === 1 ? "bg-[#fdfbf7]" : "bg-white"
                      } hover:bg-amber-50/40 transition-colors`}
                    >
                      <td className="py-3.5 px-4 font-bold text-stone-900 whitespace-nowrap">
                        {row.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {row.bookingDate}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-stone-900">
                        {row.serviceName}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#900000] whitespace-nowrap">
                        {row.formattedAmount}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {row.serviceDateTime}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${badgeStyle}`}
                        >
                          {row.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {row.preferredPriest}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {row.location}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION FOOTER ================= */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#fdfbf7] border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-stone-600">
          <p className="font-medium">
            Showing{" "}
            <span className="font-bold text-stone-900">{startEntry}</span> to{" "}
            <span className="font-bold text-stone-900">{endEntry}</span> of{" "}
            <span className="font-bold text-stone-900">{totalEntries}</span>{" "}
            entries
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 font-semibold hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-3 py-1.5 rounded-lg bg-[#900000] text-white font-bold">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 font-semibold hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPujaBookings;
