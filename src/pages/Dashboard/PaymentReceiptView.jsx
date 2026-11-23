import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, CheckCircle2, Download } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import {
  fetchMyPayments,
  getCurrentMonthDateRange,
} from "../../services/dashboardApi";
import { downloadPaymentReceiptPdf } from "../../utils/paymentReceiptPdf";
import templeLogo from "../../assets/logo.png";

/**
 * Safely decodes Base64-encoded contact fields (email/phone) while returning plain text untouched.
 *
 * @param {string} val
 * @returns {string}
 */
const safeDecodeContact = (val) => {
  const str = String(val || "").trim();
  if (!str) return "";
  if (str.includes("@") || /^[\d\s()+-]+$/.test(str)) return str;
  try {
    const decoded = atob(str);
    return /^[\x20-\x7E]+$/.test(decoded) ? decoded : str;
  } catch {
    return str;
  }
};

/**
 * Formats date + time cleanly (e.g. `11/20/2026` + `05:19 AM` -> `Nov 20, 2026 05:19 AM`).
 *
 * @param {string} rawDate
 * @param {string} rawTime
 * @returns {string}
 */
const formatReceiptDateTime = (rawDate, rawTime) => {
  const dateStr = String(rawDate || "").trim();
  const timeStr = String(rawTime || "").trim();

  if (!dateStr) return timeStr || "—";

  let prettyDate = dateStr;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [mm, dd, yyyy] = parts.map((p) => parseInt(p, 10));
    const parsed = new Date(yyyy, mm - 1, dd);
    if (!Number.isNaN(parsed.getTime())) {
      prettyDate = parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    }
  }

  return timeStr ? `${prettyDate} ${timeStr}` : prettyDate;
};

/**
 * Normalizes a raw payment record into the official receipt view model.
 *
 * @param {Object} raw
 * @param {Object} fallbackUser
 * @param {string} routeReceiptId
 * @returns {Object}
 */
const buildReceiptViewModel = (raw, fallbackUser, routeReceiptId) => {
  const source = raw || {};
  const user = fallbackUser || {};

  const receiptNumber =
    String(
      source?.batchNo ||
        source?.tokenNumber ||
        source?.mpiInvNumber ||
        routeReceiptId ||
        "",
    ).trim() || "—";

  const devoteeName = (
    String(
      source?.memberName ||
        source?.refDataName ||
        user?.refDataName ||
        `${user?.firstName || ""} ${user?.lastName || ""}`,
    ).trim() || "DEVOTEE"
  ).toUpperCase();

  const devoteePhone =
    safeDecodeContact(
      source?.prsnPhone || source?.phone || user?.phone || "",
    ) || "—";

  const devoteeEmail =
    safeDecodeContact(
      source?.prsnEmail || source?.email || user?.email || "",
    ) || "—";

  const dateTimeLabel = formatReceiptDateTime(
    source?.cartCreDate || source?.recCreDate,
    source?.cartCreTime || source?.recCreTime,
  );

  const paymentMode = String(source?.paymentType || "CREDIT CARD")
    .trim()
    .toUpperCase();

  const paymentSource = String(
    source?.source || source?.paymentSource || "WEBSITE",
  )
    .trim()
    .toUpperCase();

  const status = String(source?.paymentStatus || "COMPLETED")
    .trim()
    .toUpperCase();

  const rawItems =
    (Array.isArray(source?.paymentsData) && source.paymentsData) ||
    (Array.isArray(source?.serviceDetails) && source.serviceDetails) ||
    (Array.isArray(source?.services) && source.services) ||
    [];

  const items =
    rawItems.length > 0
      ? rawItems.map((sub, idx) => {
          const qty = Number(sub?.qty ?? sub?.quantity ?? 1) || 1;
          const unitAmount = Number(
            sub?.serviceAmount ?? sub?.unitPrice ?? sub?.amount ?? 0,
          );
          const lineTotal = Number.isFinite(unitAmount) ? unitAmount * qty : 0;

          return {
            id: sub?._id || `receipt-item-${idx}`,
            srNo: idx + 1,
            serviceName:
              String(
                sub?.ServiceSetup ||
                  sub?.serviceName ||
                  sub?.serviceTypes ||
                  "",
              ).trim() || "Temple Service",
            serviceType: String(
              sub?.serviceTypes || sub?.serviceCategoryTypes || "",
            ).trim(),
            serviceDate: String(
              sub?.serviceDate || sub?.cartCreDate || "",
            ).trim(),
            serviceTime: String(sub?.startTime || sub?.time || "").trim(),
            quantity: qty,
            unitAmount: Number.isFinite(unitAmount) ? unitAmount : 0,
            lineTotal,
            formattedAmount: `$${lineTotal.toFixed(2)}`,
          };
        })
      : [
          {
            id: "single-offering",
            srNo: 1,
            serviceName:
              String(
                source?.ServiceSetup ||
                  source?.serviceName ||
                  source?.serviceTypes ||
                  "",
              ).trim() || "Temple Offering",
            serviceType: String(source?.serviceTypes || "").trim(),
            serviceDate: String(
              source?.serviceDate || source?.cartCreDate || "",
            ).trim(),
            serviceTime: String(source?.startTime || "").trim(),
            quantity: Number(source?.qty ?? 1) || 1,
            unitAmount: Number(source?.totalAmount ?? 0) || 0,
            lineTotal: Number(source?.totalAmount ?? 0) || 0,
            formattedAmount: `$${(Number(source?.totalAmount ?? 0) || 0).toFixed(2)}`,
          },
        ];

  const donationAmount = Number(
    source?.generaldonations ?? source?.general_donation ?? 0,
  );
  const acharyaSambhavana = Number(source?.acharyasanbhavana ?? 0);
  const totalDiscounts = Number(
    source?.discountedAmount ?? source?.discountAmount ?? 0,
  );

  const parsedTotal = Number(
    source?.totalAmount ?? source?.paidAmount ?? source?.serviceAmount ?? 0,
  );
  const totalAmount = Number.isFinite(parsedTotal) ? parsedTotal : 0;

  return {
    receiptNumber,
    devoteeName,
    devoteePhone,
    devoteeEmail,
    dateTimeLabel,
    paymentMode,
    paymentSource,
    status,
    items,
    donationAmount: Number.isFinite(donationAmount) ? donationAmount : 0,
    acharyaSambhavana: Number.isFinite(acharyaSambhavana)
      ? acharyaSambhavana
      : 0,
    totalDiscounts: Number.isFinite(totalDiscounts) ? totalDiscounts : 0,
    totalAmount,
    formattedTotalAmount: `$${totalAmount.toFixed(2)}`,
  };
};

export const PaymentReceiptView = () => {
  const navigate = useNavigate();
  const { receiptId } = useParams();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const memberId = user?._id || user?.id || user?.memberId || "";

  const passedRawRecord = location.state?.rawPayment || null;
  const passedDateRange = location.state?.dateRange || null;

  // Fallback fetch if user refreshes the receipt URL directly without location.state
  const {
    data: fallbackData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["paymentReceiptFallback", memberId, receiptId],
    queryFn: async ({ signal }) => {
      const range = passedDateRange || getCurrentMonthDateRange(new Date());
      return await fetchMyPayments(
        {
          memberId,
          startDate: range.startDate,
          endDate: range.endDate,
        },
        { signal },
      );
    },
    enabled: Boolean(memberId) && !passedRawRecord,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const resolvedRawRecord = useMemo(() => {
    if (passedRawRecord) return passedRawRecord;
    const list = Array.isArray(fallbackData?.records)
      ? fallbackData.records
      : [];
    const target = decodeURIComponent(String(receiptId || "")).trim();
    return (
      list.find(
        (rec) =>
          String(rec?.batchNo ?? "").trim() === target ||
          String(rec?.tokenNumber ?? "").trim() === target ||
          String(rec?.mpiInvNumber ?? "").trim() === target ||
          String(rec?._id ?? "").trim() === target,
      ) || null
    );
  }, [passedRawRecord, fallbackData, receiptId]);

  const receipt = useMemo(
    () =>
      buildReceiptViewModel(
        resolvedRawRecord,
        user,
        decodeURIComponent(String(receiptId || "")),
      ),
    [resolvedRawRecord, user, receiptId],
  );

  const handleDownloadPdf = () => {
    downloadPaymentReceiptPdf(receipt);
  };

  return (
    <div className="space-y-5">
      {/* ================= TOP ACTION BAR ================= */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/account/payments")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-[#fdfbf7] text-xs sm:text-sm font-semibold text-stone-700 hover:text-[#900000] hover:border-[#900000]/40 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Payments</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isLoading && !resolvedRawRecord}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#900000] hover:bg-[#780000] text-white text-xs sm:text-sm font-bold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-200" />
            <span>Download Receipt</span>
          </button>
        </div>
      </div>

      {/* ================= ERROR NOTICE IF DIRECT RELOAD FAILED ================= */}
      {isError && !resolvedRawRecord && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3 text-rose-900 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>
            Unable to retrieve full receipt details automatically. Please return
            to My Payments and select View Receipt again.
          </span>
        </div>
      )}

      {/* ================= OFFICIAL TEMPLE RECEIPT SHEET ================= */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-md overflow-hidden max-w-4xl mx-auto">
        {/* Top Temple Crimson & Gold Header */}
        <div className="bg-gradient-to-r from-[#900000] via-[#7c0000] to-[#900000] text-white px-6 sm:px-10 py-7 border-b-4 border-amber-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white p-1.5 shadow-md ring-2 ring-amber-300/80 shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={templeLogo}
                  alt="Hindu Temple of Kentucky Emblem"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-wide text-white">
                  Hindu Temple of Kentucky
                </h1>
                <p className="text-xs sm:text-sm text-amber-100/90 mt-0.5">
                  4213 Accomack Drive, Louisville, KY 40241
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right shrink-0">
              <span className="inline-block px-3.5 py-1 rounded-lg bg-amber-400/20 border border-amber-300/50 text-amber-200 text-xs font-bold uppercase tracking-widest">
                Payment Receipt
              </span>
              <p className="text-lg sm:text-xl font-serif font-bold text-white mt-2">
                Receipt #{receipt.receiptNumber}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{receipt.status}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-10 space-y-7">
          {/* Two-Column Devotee & Transaction Metadata Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Devotee Details Card */}
            <div className="rounded-xl border border-stone-200/90 bg-[#fdfbf7] p-4 sm:p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#900000] pb-2.5 mb-3 border-b border-stone-200">
                Devotee Details
              </h2>
              <dl className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="font-semibold text-stone-500">Name</dt>
                  <dd className="font-bold text-stone-900 text-right">
                    {receipt.devoteeName}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="font-semibold text-stone-500">Phone</dt>
                  <dd className="font-medium text-stone-800 text-right">
                    {receipt.devoteePhone}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="font-semibold text-stone-500">Email</dt>
                  <dd className="font-medium text-stone-800 text-right break-all">
                    {receipt.devoteeEmail}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Transaction Details Card */}
            <div className="rounded-xl border border-stone-200/90 bg-[#fdfbf7] p-4 sm:p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#900000] pb-2.5 mb-3 border-b border-stone-200">
                Transaction Details
              </h2>
              <dl className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="font-semibold text-stone-500">Receipt #</dt>
                  <dd className="font-bold text-[#900000] text-right">
                    {receipt.receiptNumber}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="font-semibold text-stone-500">Date & Time</dt>
                  <dd className="font-medium text-stone-800 text-right">
                    {receipt.dateTimeLabel}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="font-semibold text-stone-500">Payment Mode</dt>
                  <dd className="font-bold text-emerald-700 text-right">
                    {receipt.paymentMode} ({receipt.paymentSource})
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Itemized Offerings Table */}
          <div className="rounded-xl border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-[#900000] to-[#740000] text-amber-50 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-14 text-center">#</th>
                    <th className="py-3 px-4">Service / Offering Name</th>
                    <th className="py-3 px-4 text-center w-20">Qty</th>
                    <th className="py-3 px-4 text-right w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/80 text-xs sm:text-sm">
                  {isLoading && !resolvedRawRecord ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 px-4 text-center text-stone-500"
                      >
                        Loading official receipt items...
                      </td>
                    </tr>
                  ) : (
                    receipt.items.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={idx % 2 === 1 ? "bg-[#fdfbf7]" : "bg-white"}
                      >
                        <td className="py-3.5 px-4 text-center font-semibold text-stone-500 align-top">
                          {item.srNo}
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <p className="font-bold text-stone-900">
                            {item.serviceName}
                          </p>
                          {(item.serviceDate || item.serviceTime) && (
                            <p className="text-xs text-stone-500 mt-0.5">
                              {item.serviceDate && (
                                <span>Service Date: {item.serviceDate}</span>
                              )}
                              {item.serviceDate && item.serviceTime && (
                                <span> • </span>
                              )}
                              {item.serviceTime && (
                                <span>Service Time: {item.serviceTime}</span>
                              )}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-stone-700 align-top">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-stone-900 align-top whitespace-nowrap">
                          {item.formattedAmount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Rows */}
            <div className="bg-[#fdfbf7] border-t border-stone-200 divide-y divide-stone-200/80 text-xs sm:text-sm">
              {receipt.donationAmount > 0 && (
                <div className="px-4 sm:px-6 py-3 flex items-center justify-end gap-8">
                  <span className="font-bold text-stone-700">Donation:</span>
                  <span className="font-bold text-stone-900 w-28 text-right">
                    ${receipt.donationAmount.toFixed(2)}
                  </span>
                </div>
              )}

              {receipt.acharyaSambhavana > 0 && (
                <div className="px-4 sm:px-6 py-3 flex items-center justify-end gap-8">
                  <span className="font-bold text-stone-700">
                    Acharya Sambhavana:
                  </span>
                  <span className="font-bold text-stone-900 w-28 text-right">
                    ${receipt.acharyaSambhavana.toFixed(2)}
                  </span>
                </div>
              )}

              {receipt.totalDiscounts > 0 && (
                <div className="px-4 sm:px-6 py-3 flex items-center justify-end gap-8">
                  <span className="font-bold text-stone-700">
                    Total Discounts:
                  </span>
                  <span className="font-bold text-emerald-700 w-28 text-right">
                    -${receipt.totalDiscounts.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="px-4 sm:px-6 py-4 bg-amber-50/80 flex items-center justify-end gap-8">
                <span className="text-sm sm:text-base font-serif font-bold text-[#900000]">
                  Total Amount:
                </span>
                <span className="text-base sm:text-lg font-serif font-bold text-[#900000] w-28 text-right">
                  {receipt.formattedTotalAmount}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Acknowledgement & Download CTA */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-stone-200/80">
            <div className="space-y-1">
              <p className="text-sm font-serif font-bold text-[#900000]">
                Received with Thanks.
              </p>
              <p className="text-xs font-semibold text-stone-700">
                Temple Management — Hindu Temple of Kentucky
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isLoading && !resolvedRawRecord}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#900000] hover:bg-[#780000] text-white text-xs sm:text-sm font-bold shadow-sm disabled:opacity-50 transition-all cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4 text-amber-200" />
              <span>Download Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceiptView;
