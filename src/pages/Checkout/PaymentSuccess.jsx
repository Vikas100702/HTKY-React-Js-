/**
 * @file src/pages/Checkout/PaymentSuccess.jsx
 * @description Enterprise-grade Payment Success & Official Temple Receipt Page.
 * Displays reconciled transaction details, devotee Sankalpam summary,
 * printable tax-exempt receipt, and invalidates stale booking queries.
 *
 * Strict Tech Stack: Pure ES6+ JavaScript (NO TypeScript), Tailwind CSS, Lucide Icons.
 * Aligns strictly with Non-Negotiables #1, #2, #3, #4, and #5.
 */

import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "../../store/useCartStore";
import {
  CheckCircle2,
  Printer,
  Home,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

/**
 * Formats timestamps into official receipt date-time strings.
 *
 * @param {string|number|Date} dateValue
 * @returns {string} Formatted string (e.g., "Nov 04, 2026 - 11:30 AM")
 */
const formatReceiptDateTime = (dateValue) => {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (isNaN(date.getTime())) return new Date().toLocaleString();

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Payment Success & Official Receipt Component
 * @returns {JSX.Element}
 */
export const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Global State Accessors
  const currencySymbol = useCartStore((state) => state.currencySymbol || "$");
  const clearCart = useCartStore((state) => state.clearCart);

  // Extract navigation payload safely
  const transactionState = location.state || {};
  const {
    invoiceNo = "",
    transactionId = "",
    paymentSource = "ONLINE_GATEWAY",
    totalAmount = 0,
    items = [],
    devoteeName = "Devotee",
    // devoteeEmail = "",
    acharyaSambhavana = 0,
    generalDonation = 0,
  } = transactionState;

  // Defensive Check: Ensure user did not land here via broken direct link
  const isValidTransaction = Boolean(invoiceNo || transactionId);

  // Invalidate Server Caches & Ensure Clean Cart State
  useEffect(() => {
    if (isValidTransaction) {
      clearCart();
      // Refetch user profile bookings, seva schedules, and calendar entries
      queryClient.invalidateQueries({ queryKey: ["devoteeBookings"] });
      queryClient.invalidateQueries({ queryKey: ["cartSession"] });
      queryClient.invalidateQueries({ queryKey: ["devoteeDetails"] });
    }
  }, [isValidTransaction, clearCart, queryClient]);

  // Derived Calculations
  const receiptTimestamp = useMemo(() => formatReceiptDateTime(new Date()), []);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Fallback for Direct or Invalid Access
  if (!isValidTransaction) {
    return (
      <main
        className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#faf8f5]"
        role="main"
      >
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-200 max-w-md w-full text-center space-y-4">
          <div
            className="w-14 h-14 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold"
            aria-hidden="true"
          >
            !
          </div>
          <h1 className="text-xl font-serif font-bold text-gray-900">
            No Active Receipt Found
          </h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            It looks like this receipt has expired or you navigated here
            directly. Please check your email or booking history.
          </p>
          <div className="pt-2">
            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2 w-full bg-[#900000] text-amber-300 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#7a0000] transition-colors shadow-sm"
            >
              Explore Services{" "}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#faf8f5] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0"
      role="main"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Success Banner (Hidden during print) */}
        <div className="text-center space-y-2 print:hidden">
          <div
            className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs"
            aria-hidden="true"
          >
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full inline-block">
            Payment Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
            Auspicious Pooja Booking Successful!
          </h1>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            May the blessings of the Almighty be with you and your family. A
            confirmation copy has been generated for temple records.
          </p>
        </div>

        {/* Printable Official Temple Receipt Card */}
        <section
          className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200/90 space-y-6 print:border-none print:shadow-none print:p-0"
          aria-label="Official Temple Payment Receipt"
        >
          {/* Receipt Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-50 text-[#900000] rounded-2xl flex items-center justify-center text-2xl font-serif font-bold shrink-0">
                ॐ
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-gray-900 leading-tight">
                  Hindu Temple of Kentucky (HTKY)
                </h2>
                <p className="text-[11px] text-gray-500">
                  Official Devotee Seva Booking & Donation Receipt
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                Receipt Number
              </span>
              <span className="text-sm font-mono font-bold text-[#900000]">
                #{invoiceNo}
              </span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-50/70 border border-gray-100 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                Devotee Name
              </span>
              <p className="font-bold text-gray-900 mt-0.5">{devoteeName}</p>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                Issued Date
              </span>
              <p className="font-semibold text-gray-800 mt-0.5">
                {receiptTimestamp}
              </p>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                Payment Channel
              </span>
              <p className="font-semibold text-gray-800 mt-0.5">
                {paymentSource}
              </p>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                Status
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
              </span>
            </div>
          </div>

          {/* Booked Services Itemization Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Reserved Seva & Pooja Details
            </h3>

            <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100 text-xs">
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-gray-900">
                        {item.name || item.serviceName || item.title}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500">
                        {item.startDate && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />{" "}
                            {item.startDate}
                          </span>
                        )}
                        <span>Qty: {item.quantity || 1}</span>
                      </div>
                    </div>
                    <div className="text-right font-bold text-gray-900">
                      {currencySymbol}
                      {Number(item.amount || item.unitPrice || 0).toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3.5 flex items-center justify-between text-gray-600">
                  <span>General Seva Offerings</span>
                  <span className="font-bold">
                    {currencySymbol}
                    {Number(totalAmount).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Add-on Donations */}
              {generalDonation > 0 && (
                <div className="p-3.5 flex items-center justify-between text-emerald-800 bg-emerald-50/40">
                  <span>Temple Support & General Donation</span>
                  <span className="font-bold">
                    +{currencySymbol}
                    {Number(generalDonation).toFixed(2)}
                  </span>
                </div>
              )}
              {acharyaSambhavana > 0 && (
                <div className="p-3.5 flex items-center justify-between text-amber-900 bg-amber-50/40">
                  <span>Acharya Sambhavana</span>
                  <span className="font-bold">
                    +{currencySymbol}
                    {Number(acharyaSambhavana).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Total Reconciliation */}
          <div className="pt-4 border-t border-gray-100 flex items-baseline justify-between">
            <span className="text-sm font-bold text-gray-900">
              Total Amount Paid
            </span>
            <span className="text-2xl font-serif font-extrabold text-[#900000]">
              {currencySymbol}
              {Number(totalAmount).toFixed(2)}
            </span>
          </div>

          {/* Tax Exemption Note */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2.5">
            <ShieldCheck
              className="w-4 h-4 text-amber-700 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="font-bold">Tax-Exempt Contribution Notice</p>
              <p className="text-amber-800 mt-0.5">
                The Hindu Temple of Kentucky is a recognized 501(c)(3) religious
                non-profit organization. No goods or services were provided in
                exchange for donations beyond religious fulfillment. Please
                retain this receipt for tax purposes.
              </p>
            </div>
          </div>
        </section>

        {/* Action Controls (Hidden during print) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#900000]"
          >
            <Printer className="w-4 h-4 text-gray-600" /> Print Official Receipt
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate("/services")}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#900000] text-amber-300 font-bold text-xs uppercase tracking-wider hover:bg-[#7a0000] transition-colors shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#900000]"
            >
              Book Another Seva <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center p-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
              title="Return to Home"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PaymentSuccess;

