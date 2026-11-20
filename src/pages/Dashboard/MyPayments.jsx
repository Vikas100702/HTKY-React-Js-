/**
 * @file src/pages/Dashboard/MyPayments.jsx
 * @description Tabular detail view for a devotee's Payments (`/account/payments`).
 * Accessible from both the Dashboard "View All" action and the AccountLayout left sidebar.
 * Reuses `fetchMyPayments`, `useDateFilteredRecords`, and `AccountFilterToolbar`.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 */

import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CreditCard,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { fetchMyPayments } from "../../services/dashboardApi";
import { useDateFilteredRecords } from "../../hooks/queries/Dashboard/useDateFilteredRecords";
import { AccountFilterToolbar } from "../../components/dashboard/AccountFilterToolbar";

const STATUS_BADGE_MAP = Object.freeze({
  COMPLETED: "bg-emerald-600 text-white border-emerald-600",
  PAID: "bg-emerald-600 text-white border-emerald-600",
  SCHEDULED: "bg-emerald-600 text-white border-emerald-600",
  PENDING: "bg-amber-500 text-white border-amber-500",
  FAILED: "bg-rose-600 text-white border-rose-600",
});

const normalizeLineItems = (item) => {
  const nestedItems =
    (Array.isArray(item?.paymentsData) && item.paymentsData) ||
    (Array.isArray(item?.serviceDetails) && item.serviceDetails) ||
    (Array.isArray(item?.services) && item.services) ||
    (Array.isArray(item?.data) && item.data) ||
    (Array.isArray(item?.cartData) && item.cartData) ||
    [];

  if (nestedItems.length > 0) {
    return nestedItems.map((sub, i) => {
      const unitPriceNum = Number(
        sub?.serviceAmount ?? sub?.unitPrice ?? sub?.amount ?? 0,
      );
      return {
        id: sub?._id || `sub-${i}`,
        serviceName:
          String(
            sub?.ServiceSetup || sub?.serviceName || sub?.serviceTypes || "",
          ).trim() || "Temple Service",
        serviceType:
          String(
            sub?.serviceTypes ||
              sub?.serviceType ||
              sub?.serviceCategoryTypes ||
              "",
          ).trim() || "—",
        serviceDate: String(
          sub?.serviceDate ||
            sub?.cartCreDate ||
            item?.serviceDate ||
            item?.cartCreDate ||
            "—",
        ).trim(),
        formattedUnitPrice: Number.isFinite(unitPriceNum)
          ? `$${unitPriceNum.toFixed(2)}`
          : "$0.00",
        quantity: Number(sub?.qty ?? sub?.quantity ?? 1) || 1,
        status: String(sub?.serviceStatus || sub?.status || "SCHEDULED")
          .trim()
          .toUpperCase(),
      };
    });
  }

  // Fallback single-row item from top-level payment record
  const unitPriceNum = Number(item?.serviceAmount ?? item?.totalAmount ?? 0);
  return [
    {
      id: item?._id || "single-line",
      serviceName:
        String(
          item?.ServiceSetup || item?.serviceName || item?.serviceTypes || "",
        ).trim() || "Temple Service",
      serviceType: String(
        item?.serviceTypes || item?.serviceCategoryTypes || "SERVICE",
      ).trim(),
      serviceDate: String(item?.serviceDate || item?.cartCreDate || "—").trim(),
      formattedUnitPrice: Number.isFinite(unitPriceNum)
        ? `$${unitPriceNum.toFixed(2)}`
        : "$0.00",
      quantity: Number(item?.qty ?? 1) || 1,
      status: String(item?.serviceStatus || "SCHEDULED")
        .trim()
        .toUpperCase(),
    },
  ];
};

const normalizePaymentRow = (item, index) => {
  const receiptNumber =
    String(
      item?.batchNo || item?.tokenNumber || item?.mpiInvNumber || "",
    ).trim() || "—";

  const parsedTotal = Number(
    item?.totalAmount ?? item?.paidAmount ?? item?.serviceAmount ?? 0,
  );
  const formattedTotalAmount = Number.isFinite(parsedTotal)
    ? `$${parsedTotal.toFixed(2)}`
    : "$0.00";

  const paymentSource = String(item?.source || item?.paymentSource || "WEBSITE")
    .trim()
    .toUpperCase();

  const bookingDate = String(
    item?.cartCreDate || item?.recCreDate || "—",
  ).trim();

  const status = String(item?.paymentStatus || "COMPLETED")
    .trim()
    .toUpperCase();

  return {
    id: item?._id || item?.insertedId || `payment-${index}`,
    receiptNumber,
    totalAmount: parsedTotal,
    formattedTotalAmount,
    paymentSource,
    bookingDate,
    status,
    lineItems: normalizeLineItems(item),
  };
};

export const MyPayments = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const memberId = user?._id || user?.id || user?.memberId || "";

  const [page, setPage] = useState(1);
  const [expandedRowIds, setExpandedRowIds] = useState({});

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
      "myPaymentsList",
      memberId,
      resolvedDateRange.startDate,
      resolvedDateRange.endDate,
    ],
    queryFn: async ({ signal }) => {
      if (!memberId) {
        return { count: 0, records: [], dateRange: resolvedDateRange };
      }
      return await fetchMyPayments(
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
    return list.map(normalizePaymentRow);
  }, [data]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedRows;
    return normalizedRows.filter(
      (row) =>
        row.receiptNumber.toLowerCase().includes(q) ||
        row.paymentSource.toLowerCase().includes(q) ||
        row.bookingDate.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q) ||
        row.lineItems.some((sub) => sub.serviceName.toLowerCase().includes(q)),
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

  const toggleExpandRow = (rowId) => {
    setExpandedRowIds((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const handleViewReceipt = (row) => {
    window.alert(
      `Coming Soon! Receipt #${row.receiptNumber} preview will be available shortly.`,
    );
  };

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
              <CreditCard className="w-5 h-5" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#900000] tracking-tight">
                My Payments
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Showing transactions from{" "}
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
              title="Refresh Payments"
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
          searchPlaceholder="Search by receipt #, payment source, service name..."
        />
      </div>

      {/* ================= ERROR ALERT ================= */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between gap-4 text-rose-900">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-xs sm:text-sm font-medium">
              {error?.message ||
                "Unable to load your payment history right now. Please try again."}
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

      {/* ================= TABULAR PAYMENTS CARD ================= */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-gradient-to-r from-[#900000] to-[#740000] text-amber-50 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center" />
                <th className="py-3.5 px-4">Receipt #</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Payment Source</th>
                <th className="py-3.5 px-4">Booking Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">View Receipt</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200/80 text-xs sm:text-sm text-stone-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, colIdx) => (
                      <td key={`cell-${colIdx}`} className="py-3.5 px-4">
                        <div className="h-4 bg-stone-200/80 rounded w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-5 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="text-base font-serif font-bold text-stone-800">
                        No Payments Found
                      </p>
                      <p className="text-xs text-stone-500">
                        No payment transactions matched the selected date range.
                        Try selecting a different month, year, or custom date
                        range.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const isExpanded = Boolean(expandedRowIds[row.id]);
                  const badgeStyle =
                    STATUS_BADGE_MAP[row.status] ||
                    "bg-stone-600 text-white border-stone-600";

                  return (
                    <Fragment key={row.id}>
                      <tr
                        className={`${
                          idx % 2 === 1 ? "bg-[#fdfbf7]" : "bg-white"
                        } hover:bg-amber-50/40 transition-colors`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleExpandRow(row.id)}
                            aria-label={
                              isExpanded
                                ? "Collapse service details"
                                : "Expand service details"
                            }
                            className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:text-[#900000] hover:border-[#900000]/40 transition-colors cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-stone-900 whitespace-nowrap">
                          {row.receiptNumber}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#900000] whitespace-nowrap">
                          {row.formattedTotalAmount}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-stone-800 whitespace-nowrap">
                          {row.paymentSource}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {row.bookingDate}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide border ${badgeStyle}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleViewReceipt(row)}
                            title="View Receipt"
                            aria-label={`View receipt ${row.receiptNumber}`}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-[#900000] hover:bg-amber-100/70 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Nested Service Breakdown Table */}
                      {isExpanded && (
                        <tr className="bg-stone-50/90">
                          <td colSpan={7} className="p-4 sm:px-8">
                            <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-[#7a0000] text-amber-50 font-bold uppercase tracking-wider">
                                    <th className="py-2.5 px-4">
                                      Service Name
                                    </th>
                                    <th className="py-2.5 px-4">
                                      Service Type
                                    </th>
                                    <th className="py-2.5 px-4">
                                      Service Date
                                    </th>
                                    <th className="py-2.5 px-4">Unit Price</th>
                                    <th className="py-2.5 px-4 text-center">
                                      Quantity
                                    </th>
                                    <th className="py-2.5 px-4">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200/70 text-stone-700">
                                  {row.lineItems.map((sub) => {
                                    const subBadge =
                                      STATUS_BADGE_MAP[sub.status] ||
                                      "bg-emerald-600 text-white border-emerald-600";
                                    return (
                                      <tr key={sub.id}>
                                        <td className="py-2.5 px-4 font-semibold text-stone-900">
                                          {sub.serviceName}
                                        </td>
                                        <td className="py-2.5 px-4 uppercase">
                                          {sub.serviceType}
                                        </td>
                                        <td className="py-2.5 px-4">
                                          {sub.serviceDate}
                                        </td>
                                        <td className="py-2.5 px-4 font-semibold">
                                          {sub.formattedUnitPrice}
                                        </td>
                                        <td className="py-2.5 px-4 text-center font-semibold">
                                          {sub.quantity}
                                        </td>
                                        <td className="py-2.5 px-4">
                                          <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${subBadge}`}
                                          >
                                            {sub.status}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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

export default MyPayments;
