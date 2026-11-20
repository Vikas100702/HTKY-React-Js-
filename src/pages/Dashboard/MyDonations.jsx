/**
 * @file src/pages/Dashboard/MyDonations.jsx
 * @description Tabular detail view for a devotee's Donations (`/account/donations`).
 * Accessible from both the Dashboard "View All" action and the AccountLayout left sidebar.
 * Reuses `fetchMyDonations`, `useDateFilteredRecords`, and `AccountFilterToolbar`.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  HandHeart,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { fetchMyDonations } from "../../services/dashboardApi";
import { useDateFilteredRecords } from "../../hooks/queries/Dashboard/useDateFilteredRecords";
import { AccountFilterToolbar } from "../../components/dashboard/AccountFilterToolbar";

const formatTitleCase = (str) =>
  String(str || "")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const normalizeDonationRow = (item, index) => {
  const receiptNumber =
    String(
      item?.batchNo || item?.tokenNumber || item?.mpiInvNumber || "",
    ).trim() || "—";
  const donationDate = String(
    item?.cartCreDate || item?.recCreDate || "—",
  ).trim();
  const donationName =
    String(
      item?.ServiceSetup || item?.serviceName || item?.serviceTypes || "",
    ).trim() || "Temple Donation";

  const parsedAmount = Number(item?.serviceAmount ?? 0);
  const formattedAmount = Number.isFinite(parsedAmount)
    ? `$${parsedAmount.toFixed(2)}`
    : "$0.00";

  const paymentMethod = formatTitleCase(item?.paymentType);
  const rawStatus = String(item?.paymentStatus || "COMPLETED")
    .trim()
    .toUpperCase();
  const paymentStatusLabel =
    paymentMethod ||
    (rawStatus === "COMPLETED" ? "Paid" : formatTitleCase(rawStatus));

  return {
    id: item?._id || item?.insertedId || `donation-${index}`,
    receiptNumber,
    donationDate,
    donationName,
    amount: parsedAmount,
    formattedAmount,
    paymentStatusLabel,
  };
};

export const MyDonations = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const memberId = user?._id || user?.id || user?.memberId || "";

  const [page, setPage] = useState(1);

  const {
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
    pageSize,
  } = useDateFilteredRecords({
    pageSize: 10,
  });

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [
      "myDonationsList",
      memberId,
      resolvedDateRange.startDate,
      resolvedDateRange.endDate,
    ],
    queryFn: async ({ signal }) => {
      if (!memberId) {
        return { count: 0, records: [], dateRange: resolvedDateRange };
      }
      return await fetchMyDonations(
        {
          memberId,
          startDate: resolvedDateRange.startDate,
          endDate: resolvedDateRange.endDate,
        },
        { signal },
      );
    },
    enabled: Boolean(memberId),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });

  const normalizedRows = useMemo(() => {
    const list = Array.isArray(data?.records) ? data.records : [];
    return list.map(normalizeDonationRow);
  }, [data]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedRows;
    return normalizedRows.filter(
      (row) =>
        row.receiptNumber.toLowerCase().includes(q) ||
        row.donationDate.toLowerCase().includes(q) ||
        row.donationName.toLowerCase().includes(q) ||
        row.paymentStatusLabel.toLowerCase().includes(q),
    );
  }, [normalizedRows, searchQuery]);

  const totalEntries = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const paginatedRows = useMemo(() => {
    const startIdx = (safePage - 1) * pageSize;
    return filteredRows.slice(startIdx, startIdx + pageSize);
  }, [filteredRows, safePage, pageSize]);

  const startEntry = totalEntries === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endEntry = Math.min(safePage * pageSize, totalEntries);

  return (
    <div className="space-y-6">
      {/* ================= TOP HEADER & FILTER CARD ================= */}
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
              <HandHeart className="w-5 h-5" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#900000] tracking-tight">
                My Donations
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

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh Donations"
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
          onDateModeChange={(val) => {
            setDateMode(val);
            setPage(1);
          }}
          selectedMonth={selectedMonth}
          onSelectedMonthChange={(val) => {
            setSelectedMonth(val);
            setPage(1);
          }}
          selectedYear={selectedYear}
          onSelectedYearChange={(val) => {
            setSelectedYear(val);
            setPage(1);
          }}
          yearOptions={yearOptions}
          fromDateIso={fromDateIso}
          onFromDateChange={(val) => {
            setFromDateIso(val);
            setPage(1);
          }}
          toDateIso={toDateIso}
          onToDateChange={(val) => {
            setToDateIso(val);
            setPage(1);
          }}
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setPage(1);
          }}
          searchPlaceholder="Search by receipt #, donation name, payment method..."
        />
        <AccountFilterToolbar
          dateMode={dateMode}
          onDateModeChange={(val) => {
            setDateMode(val);
            setPage(1);
          }}
          selectedMonth={selectedMonth}
          onSelectedMonthChange={(val) => {
            setSelectedMonth(val);
            setPage(1);
          }}
          selectedYear={selectedYear}
          onSelectedYearChange={(val) => {
            setSelectedYear(val);
            setPage(1);
          }}
          yearOptions={yearOptions}
          fromDateIso={fromDateIso}
          onFromDateChange={(val) => {
            setFromDateIso(val);
            setPage(1);
          }}
          toDateIso={toDateIso}
          onToDateChange={(val) => {
            setToDateIso(val);
            setPage(1);
          }}
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setPage(1);
          }}
          searchPlaceholder="Search by receipt #, donation name, payment method..."
        />
      </div>

      {/* ================= ERROR ALERT ================= */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between gap-4 text-rose-900">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-xs sm:text-sm font-medium">
              {error?.message ||
                "Unable to load your donations right now. Please try again."}
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

      {/* ================= TABULAR DONATIONS CARD ================= */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-gradient-to-r from-[#900000] to-[#740000] text-amber-50 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-5">Receipt #</th>
                <th className="py-3.5 px-5">Donation Date</th>
                <th className="py-3.5 px-5">Donation Name</th>
                <th className="py-3.5 px-5">Amount</th>
                <th className="py-3.5 px-5">Payment Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200/80 text-xs sm:text-sm text-stone-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    {Array.from({ length: 5 }).map((__, colIdx) => (
                      <td key={`cell-${colIdx}`} className="py-3.5 px-5">
                        <div className="h-4 bg-stone-200/80 rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-5 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="text-base font-serif font-bold text-stone-800">
                        No Donations Found
                      </p>
                      <p className="text-xs text-stone-500">
                        No donation records matched the selected date range. Try
                        selecting a different month, year, or custom date range.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`${
                      idx % 2 === 1 ? "bg-[#fdfbf7]" : "bg-white"
                    } hover:bg-amber-50/40 transition-colors`}
                  >
                    <td className="py-3.5 px-5 font-bold text-stone-900 whitespace-nowrap">
                      {row.receiptNumber}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {row.donationDate}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-stone-900">
                      {row.donationName}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-[#900000] whitespace-nowrap">
                      {row.formattedAmount}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap font-medium text-stone-800">
                      {row.paymentStatusLabel}
                    </td>
                  </tr>
                ))
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1 || isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 font-semibold hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-3 py-1.5 rounded-lg bg-[#900000] text-white font-bold">
              {safePage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages || isLoading}
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

export default MyDonations;
