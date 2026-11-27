/**
 * @file src/pages/Dashboard/MyRecurringDonations.jsx
 * @description Devotee Account "My Recurring Payments" (/account/recurring-donations) page.
 * Displays active and inactive recurring donation pledges with date/search filtering,
 * expandable installment receipt history (`paymentsData`), dynamic schedule descriptions,
 * and an interactive status switch to cancel active recurring pledges (`status: "INACTIVE"`).
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Critical Architectural Non-Negotiables #1, #2, #3, #4, and #5.
 */

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Loader2,
  Repeat,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useDevoteeProfile } from "../../hooks/queries/Profile/useDevoteeProfile";
import {
  fetchRecurringDonations,
  updateRecurringDonationStatus,
} from "../../services/dashboardApi";
import { useDateFilteredRecords } from "../../hooks/queries/Dashboard/useDateFilteredRecords";
import { AccountFilterToolbar } from "../../components/dashboard/AccountFilterToolbar";

/**
 * Generates the human-readable schedule summary sentence matching the backend
 * `generateRecurringMessage(row)` contract across Daily, Weekly, Monthly, and Anualy plans.
 *
 * @param {Object} row
 * @returns {string}
 */
const generateRecurringMessage = (row) => {
  const amountNum = Number(row?.serviceAmount ?? 0);
  const amount = Number.isFinite(amountNum) ? amountNum.toFixed(2) : "0.00";
  const frequency = String(
    row?.debitFequency || row?.debitFrequency || "",
  ).trim();
  const normalizedFreq = frequency.toLowerCase();

  if (normalizedFreq === "daily") {
    return `Your donation of $${amount} will be deducted daily from ${row?.startDailyDate || "—"} to ${row?.endDailyDate || "—"}.`;
  }

  if (normalizedFreq === "weekly") {
    return `Your donation of $${amount} will be deducted every ${row?.selectWeeklyDay || "—"} from ${row?.startWeeklyDate || "—"} to ${row?.endWeeklyDate || "—"}.`;
  }

  if (normalizedFreq === "monthly") {
    return `Your donation of $${amount} will be deducted on ${row?.selectmonthDate || "—"} of each month from ${row?.startMonthlyDate || "—"} to ${row?.endMonthlyDate || "—"}.`;
  }

  if (normalizedFreq === "anualy" || normalizedFreq === "annually") {
    return `Your donation of $${amount} will be deducted annually on ${row?.selectAnualyDateValue || "—"} ${row?.selectAnualyMonthValue || ""} from ${row?.startAnualyDate || "—"} to ${row?.endAnualyDate || "—"}.`.replace(
      /\s+/g,
      " ",
    );
  }

  return "No recurring donation schedule details.";
};

/**
 * Normalizes nested installment transactions (`paymentsData`) for an expanded recurring pledge row,
 * filtering out `TEMP` records and mapping `"Administrator"` source to `"Front Desk"`.
 *
 * @param {Object} item
 * @returns {Array<Object>}
 */
const normalizeInstallmentReceipts = (item) => {
  const rawPayments = Array.isArray(item?.paymentsData)
    ? item.paymentsData
    : [];

  return rawPayments
    .filter(
      (sub) =>
        String(sub?.paymentStatus || "")
          .trim()
          .toUpperCase() !== "TEMP",
    )
    .map((sub, idx) => {
      const amountNum = Number(sub?.totalAmount ?? sub?.serviceAmount ?? 0);
      const rawSource = String(sub?.source || sub?.paymentSource || "—").trim();
      const displaySource =
        rawSource.toLowerCase() === "administrator"
          ? "Front Desk"
          : rawSource || "—";

      const receiptNumber =
        String(
          sub?.batchNo ||
            sub?.tokenNumber ||
            sub?.mpiInvNumber ||
            sub?.invoiceNo ||
            "",
        ).trim() || "N/A";

      return {
        id: sub?._id || `installment-${idx}`,
        receiptNumber,
        formattedAmount: Number.isFinite(amountNum)
          ? `$${amountNum.toFixed(2)}`
          : "$0.00",
        paymentType: String(sub?.paymentType || "N/A").trim(),
        paymentSource: displaySource,
        bookingDate: String(
          sub?.recCreDate || sub?.cartCreDate || "N/A",
        ).trim(),
        statusName: String(sub?.statusName || sub?.paymentStatus || "COMPLETED")
          .trim()
          .toUpperCase(),
        rawPayment: sub,
      };
    });
};

/**
 * Normalizes a raw recurring donation pledge record from `api/analytics/getrecurringData`.
 *
 * @param {Object} item
 * @param {number} index
 * @returns {Object}
 */
const normalizeRecurringRow = (item, index) => {
  const serviceName =
    String(
      item?.serviceName || item?.ServiceSetup || item?.refDataName || "",
    ).trim() || "Recurring Donation";
  const frequencyType =
    String(item?.debitFequency || item?.debitFrequency || "—").trim() || "—";
  const detailsMessage = generateRecurringMessage(item);

  const completedInstallments = Number(item?.installment ?? 0) || 0;
  const totalTransactions =
    item?.totalNumberofTransactions !== undefined &&
    item?.totalNumberofTransactions !== null &&
    item?.totalNumberofTransactions !== ""
      ? item.totalNumberofTransactions
      : "—";

  const status = String(item?.status || "INACTIVE")
    .trim()
    .toUpperCase();

  return {
    id: item?._id || item?.insertedId || `recurring-${index}`,
    recurringId: item?._id || "",
    serviceName,
    frequencyType,
    detailsMessage,
    installmentLabel: `${completedInstallments} / ${totalTransactions}`,
    status,
    isActive: status === "ACTIVE",
    installments: normalizeInstallmentReceipts(item),
    rawItem: item,
  };
};

/**
 * @component MyRecurringDonations
 * @description Renders the Devotee Account "My Recurring Payments" view with date range filters,
 * search bar, expandable installment receipts, and active pledge cancellation toggle.
 */
export const MyRecurringDonations = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const authUser = useAuthStore((state) => state.user);
  const { profile } = useDevoteeProfile();

  const [expandedRowIds, setExpandedRowIds] = useState(() => new Set());
  const [confirmTargetRow, setConfirmTargetRow] = useState(null);
  const [pendingToggleId, setPendingToggleId] = useState(null);
  const [feedbackBanner, setFeedbackBanner] = useState(null);

  const memberId = useMemo(() => {
    return (
      profile?._id || authUser?._id || authUser?.id || authUser?.memberId || ""
    );
  }, [profile, authUser]);

  // Shared Date Filter + Search + Pagination State (defaults to current Month)
  const {
    filterMode,
    setFilterMode,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    resolvedDateRange,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    resetFilters,
  } = useDateFilteredRecords({ initialMode: "month", pageSize: 10 });

  // Fetch recurring donation pledges for the selected date range
  const {
    data: recurringData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "dashboard",
      "recurringDonations",
      memberId,
      resolvedDateRange.startDate,
      resolvedDateRange.endDate,
    ],
    queryFn: ({ signal }) =>
      fetchRecurringDonations(
        {
          memberId,
          startDate: resolvedDateRange.startDate,
          endDate: resolvedDateRange.endDate,
        },
        { signal },
      ),
    enabled: Boolean(memberId),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Cancel recurring donation pledge mutation (`status: "INACTIVE"`)
  const cancelRecurringMutation = useMutation({
    mutationFn: ({ recurringId }) =>
      updateRecurringDonationStatus({
        recurringId,
        memberId,
        status: "INACTIVE",
      }),
    onSuccess: (res) => {
      setFeedbackBanner({
        type: "success",
        message: res?.message || "Recurring donation cancelled successfully.",
      });
      setPendingToggleId(null);
      setConfirmTargetRow(null);
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "recurringDonations"],
      });
    },
    onError: (err) => {
      setFeedbackBanner({
        type: "error",
        message:
          err?.message ||
          "Failed to update recurring donation status. Please try again.",
      });
      setPendingToggleId(null);
      setConfirmTargetRow(null);
    },
  });

  // Normalize all rows
  const normalizedRows = useMemo(() => {
    const rawList = Array.isArray(recurringData?.records)
      ? recurringData.records
      : [];
    return rawList.map((item, idx) => normalizeRecurringRow(item, idx));
  }, [recurringData]);

  // Apply search query across serviceName, frequencyType, detailsMessage, status & receipt numbers
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedRows;

    return normalizedRows.filter((row) => {
      const parentMatch =
        row.serviceName.toLowerCase().includes(q) ||
        row.frequencyType.toLowerCase().includes(q) ||
        row.detailsMessage.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q);

      if (parentMatch) return true;

      return row.installments.some(
        (sub) =>
          sub.receiptNumber.toLowerCase().includes(q) ||
          sub.paymentType.toLowerCase().includes(q) ||
          sub.paymentSource.toLowerCase().includes(q),
      );
    });
  }, [normalizedRows, searchQuery]);

  // Client-side pagination
  const totalEntries = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, safeCurrentPage, pageSize]);

  const showingFrom =
    totalEntries === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const showingTo = Math.min(safeCurrentPage * pageSize, totalEntries);

  const toggleRowExpand = (rowId) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const handleRequestCancelToggle = (row) => {
    if (!row?.isActive || !row?.recurringId || pendingToggleId) return;
    setFeedbackBanner(null);
    setConfirmTargetRow(row);
  };

  const handleConfirmCancel = () => {
    if (!confirmTargetRow?.recurringId) return;
    setPendingToggleId(confirmTargetRow.id);
    cancelRecurringMutation.mutate({
      recurringId: confirmTargetRow.recurringId,
    });
  };

  const handleDismissConfirm = () => {
    if (cancelRecurringMutation.isPending) return;
    setConfirmTargetRow(null);
  };

  const handleViewInstallmentReceipt = (sub) => {
    const safeReceiptParam = encodeURIComponent(
      String(sub.receiptNumber || sub.id || "receipt"),
    );
    navigate(`/account/payments/receipt/${safeReceiptParam}`, {
      state: {
        rawPayment: sub.rawPayment,
        dateRange: resolvedDateRange,
      },
    });
  };

  return (
    <section
      aria-labelledby="my-recurring-donations-heading"
      className="space-y-6 font-sans"
    >
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1
            id="my-recurring-donations-heading"
            className="text-xl sm:text-2xl font-serif font-bold text-[#900000] tracking-tight flex items-center gap-2.5"
          >
            <Repeat className="w-6 h-6 text-amber-600 shrink-0" />
            <span>My Recurring Payments</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Review your automated recurring donation schedules, installment
            receipts, and active plans.
          </p>
        </div>
      </div>

      {/* 2. Status Feedback Banner (Success / Error on Cancel) */}
      {feedbackBanner && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium ${
            feedbackBanner.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackBanner.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            aria-label="Dismiss notification"
            className="p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Shared Reusable Date & Search Filter Toolbar */}
      <AccountFilterToolbar
        filterMode={filterMode}
        onFilterModeChange={setFilterMode}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        fromDate={fromDate}
        onFromDateChange={setFromDate}
        toDate={toDate}
        onToDateChange={setToDate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by donation name, frequency, or receipt #..."
        totalCount={totalEntries}
        isFetching={isFetching}
        onReset={resetFilters}
      />

      {/* 4. Error Banner */}
      {isError && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 text-red-700 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              {error?.message ||
                "Unable to load recurring donations right now."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 5. Main Recurring Donations Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-[#900000] text-white text-xs font-bold uppercase tracking-wider">
                <th scope="col" className="py-3.5 px-3 w-12 text-center">
                  <span className="sr-only">Expand Installments</span>
                </th>
                <th scope="col" className="py-3.5 px-4">
                  Payments For
                </th>
                <th scope="col" className="py-3.5 px-4 whitespace-nowrap">
                  Frequency Type
                </th>
                <th scope="col" className="py-3.5 px-4">
                  Details
                </th>
                <th
                  scope="col"
                  className="py-3.5 px-4 text-center whitespace-nowrap"
                >
                  No Tnx
                </th>
                <th
                  scope="col"
                  className="py-3.5 px-4 text-center whitespace-nowrap"
                >
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200 text-xs sm:text-sm text-stone-700">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, skIdx) => (
                  <tr key={`skeleton-${skIdx}`} className="animate-pulse">
                    <td className="py-4 px-3 text-center">
                      <div className="h-5 w-5 bg-stone-200 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-36 bg-stone-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-20 bg-stone-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-64 bg-stone-200 rounded" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-4 w-12 bg-stone-200 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-5 w-11 bg-stone-200 rounded-full mx-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 px-4 text-center text-stone-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Repeat className="w-8 h-8 text-stone-300" />
                      <p className="font-semibold text-stone-700">
                        No data available
                      </p>
                      <p className="text-xs text-stone-400 max-w-md">
                        No recurring donation pledges were found for the
                        selected date filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const isExpanded = expandedRowIds.has(row.id);
                  const isRowUpdating = pendingToggleId === row.id;

                  return (
                    <React.Fragment key={row.id}>
                      <tr
                        className={`transition-colors ${
                          isExpanded ? "bg-amber-50/40" : "hover:bg-stone-50/80"
                        }`}
                      >
                        {/* Expand Toggle Cell */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleRowExpand(row.id)}
                            aria-expanded={isExpanded}
                            aria-label={
                              isExpanded
                                ? `Collapse installments for ${row.serviceName}`
                                : `Expand installments for ${row.serviceName}`
                            }
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 bg-white hover:bg-amber-50 hover:border-amber-300 text-stone-600 transition-colors cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-[#900000]" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Payments For */}
                        <td className="py-3.5 px-4 font-semibold text-stone-900">
                          {row.serviceName}
                        </td>

                        {/* Frequency Type */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                            {row.frequencyType}
                          </span>
                        </td>

                        {/* Details */}
                        <td className="py-3.5 px-4 text-stone-600 leading-relaxed max-w-md">
                          {row.detailsMessage}
                        </td>

                        {/* No Tnx */}
                        <td className="py-3.5 px-4 text-center font-semibold text-stone-800 whitespace-nowrap">
                          {row.installmentLabel}
                        </td>

                        {/* Status Toggle (Only shown when ACTIVE, matching PHP behavior) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {row.isActive ? (
                            <div className="inline-flex items-center justify-center gap-2">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={true}
                                aria-label={`Cancel recurring donation for ${row.serviceName}`}
                                disabled={isRowUpdating}
                                onClick={() => handleRequestCancelToggle(row)}
                                className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#900000]/30 disabled:opacity-50 cursor-pointer"
                              >
                                <span className="inline-block h-4 w-4 translate-x-6 transform rounded-full bg-white shadow transition-transform" />
                              </button>
                              {isRowUpdating && (
                                <Loader2 className="w-4 h-4 animate-spin text-[#900000]" />
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-500">
                              INACTIVE
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Nested Child Installment Table */}
                      {isExpanded && (
                        <tr className="bg-stone-50/90">
                          <td colSpan={6} className="p-3 sm:p-4">
                            <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-xs">
                              {row.installments.length === 0 ? (
                                <div className="py-6 px-4 text-center text-xs text-stone-500">
                                  No installment receipts recorded for this
                                  recurring pledge yet.
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse min-w-[640px]">
                                    <thead>
                                      <tr className="bg-stone-100 text-stone-700 text-[11px] font-bold uppercase tracking-wider border-b border-stone-200">
                                        <th className="py-2.5 px-3 text-center">
                                          Receipt #
                                        </th>
                                        <th className="py-2.5 px-3 text-center">
                                          Total Amount
                                        </th>
                                        <th className="py-2.5 px-3 text-center">
                                          Payment Type
                                        </th>
                                        <th className="py-2.5 px-3 text-center">
                                          Payment Source
                                        </th>
                                        <th className="py-2.5 px-3 text-center">
                                          Booking Date
                                        </th>
                                        <th className="py-2.5 px-3 text-center">
                                          Status
                                        </th>
                                        <th className="py-2.5 px-3 text-center">
                                          View Receipt
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                                      {row.installments.map((sub) => (
                                        <tr
                                          key={sub.id}
                                          className="hover:bg-amber-50/30 transition-colors"
                                        >
                                          <td className="py-2.5 px-3 text-center font-semibold text-stone-900">
                                            {sub.receiptNumber}
                                          </td>
                                          <td className="py-2.5 px-3 text-center font-semibold text-emerald-700">
                                            {sub.formattedAmount}
                                          </td>
                                          <td className="py-2.5 px-3 text-center">
                                            {sub.paymentType}
                                          </td>
                                          <td className="py-2.5 px-3 text-center">
                                            {sub.paymentSource}
                                          </td>
                                          <td className="py-2.5 px-3 text-center">
                                            {sub.bookingDate}
                                          </td>
                                          <td className="py-2.5 px-3 text-center">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                              {sub.statusName}
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-3 text-center">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleViewInstallmentReceipt(
                                                  sub,
                                                )
                                              }
                                              title={`View Receipt #${sub.receiptNumber}`}
                                              aria-label={`View Receipt #${sub.receiptNumber}`}
                                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#900000] hover:bg-red-50 transition-colors cursor-pointer"
                                            >
                                              <Eye className="w-4 h-4" />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 6. Table Footer & Pagination */}
        <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-stone-600">
          <div>
            Showing{" "}
            <span className="font-semibold text-stone-900">{showingFrom}</span>{" "}
            to <span className="font-semibold text-stone-900">{showingTo}</span>{" "}
            of{" "}
            <span className="font-semibold text-stone-900">{totalEntries}</span>{" "}
            entries
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-white font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-2.5 py-1 font-semibold text-stone-700">
              Page {safeCurrentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-white font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Confirmation Modal ("Do you want to cancel this?") */}
      {confirmTargetRow && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-recurring-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#900000] flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2
                  id="cancel-recurring-modal-title"
                  className="text-base sm:text-lg font-serif font-bold text-stone-900"
                >
                  Do you want to cancel this?
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Are you sure you want to cancel your recurring donation for{" "}
                  <span className="font-semibold text-stone-900">
                    {confirmTargetRow.serviceName}
                  </span>
                  ? Future scheduled deductions will be stopped.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleDismissConfirm}
                disabled={cancelRecurringMutation.isPending}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
              >
                No, Keep Active
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelRecurringMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#900000] hover:bg-[#780000] text-amber-300 text-xs font-bold uppercase tracking-wider shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {cancelRecurringMutation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Yes, Cancel Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MyRecurringDonations;
