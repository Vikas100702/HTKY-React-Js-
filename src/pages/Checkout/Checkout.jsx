/**
 * @file src/pages/Checkout/Checkout.jsx
 * @description Enterprise-grade, crash-resilient Devotee Checkout Page.
 * Evaluates active membership eligibility (PHP `membershipStatusCheck` parity),
 * computes per-item & global membership discounts, displays transparent original vs.
 * discounted pricing, conditionally renders quantity steppers strictly for items
 * with `qtyCounterEnabled === true`, validates Sankalpam details, reserves temporary
 * slots, and mounts `HostedPaymentModal` for PCI-compliant gateway tokenization.
 *
 * Strict Tech Stack: Pure ES6+ JavaScript (NO TypeScript), Tailwind CSS, Zustand, TanStack Query.
 * Aligns strictly with Non-Negotiables #1, #2, #3, #4, and #5.
 */

import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/useCartStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useDevoteeProfile } from "../../hooks/queries/Profile/useDevoteeProfile";
import { useGetCumulativeAmount } from "../../hooks/queries/Dashboard/useDashboard";
import { useMembershipSettings } from "../../hooks/queries/Membership/useMembershipSettings";
import { useCheckout } from "../../hooks/queries/Checkout/checkoutApi";
import {
  evaluateMembershipStatus,
  calculateCartDiscounts,
} from "../../utils/membershipDiscount";
import { FamilySankalpamForm } from "../../components/profile/FamilySankalpamForm";
import { HostedPaymentModal } from "../../components/checkout/HostedPaymentModal";
import { decodeBase64 } from "../../utils/base64";
import logo from "../../assets/logo.png";
import membershipBadge from "../../assets/membership.png";
import {
  Trash2,
  Plus,
  Minus,
  Sparkles,
  Calendar,
  Clock,
  HeartHandshake,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Tag,
} from "lucide-react";

const QUICK_DONATIONS = [11, 21, 51, 101];

/**
 * Checkout Page Component
 * @returns {JSX.Element}
 */
export const Checkout = () => {
  const navigate = useNavigate();

  // ================= GLOBAL AUTH & CART STORE =================
  const user = useAuthStore((state) => state.user);
  const memberId = user?._id || user?.id || user?.memberId || "";

  const items = useCartStore((state) => state.items || []);
  const totalCount = useCartStore((state) => state.totalCount || 0);
  const generalDonation = useCartStore((state) => state.generalDonation || 0);
  const acharyaSambhavana = useCartStore(
    (state) => state.acharyaSambhavana || 0,
  );
  const currencySymbol = useCartStore((state) => state.currencySymbol || "$");
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const setGeneralDonation = useCartStore((state) => state.setGeneralDonation);
  const showToast = useCartStore((state) => state.showToast);

  // ================= DEVOTEE PROFILE & SANKALPAM =================
  const {
    devoteeProfile,
    gotras,
    nakshatras,
    formData: sankalpamData,
    errors: sankalpamErrors,
    isLoading: isProfileLoading,
    isSaving: isSankalpamSaving,
    updateField,
    addFamilyMember,
    removeFamilyMember,
    updateFamilyMember,
    validate: validateSankalpam,
    saveSankalpam,
  } = useDevoteeProfile();

  // ================= MEMBERSHIP & CUMULATIVE SPENDING QUERIES =================
  const { data: cumulativeData } = useGetCumulativeAmount(memberId);
  const {
    membershipDiscount: settingsDiscountValue,
    discountType: settingsDiscountType,
  } = useMembershipSettings();

  // ================= CHECKOUT MUTATION HOOKS =================
  const {
    checkSareeAvailability,
    addServiceCartTemp,
    isProcessing: isCheckoutApiProcessing,
  } = useCheckout();

  // ================= LOCAL COMPONENT STATE =================
  const [notes, setNotes] = useState("");
  const [customDonationInput, setCustomDonationInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hosted Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeInvoiceNumber, setActiveInvoiceNumber] = useState("");

  // ================= MEMBERSHIP ELIGIBILITY & DISCOUNT CALCULATION =================
  const membershipEvaluation = useMemo(() => {
    const cumulativeTotal = Number(cumulativeData?.totalAmount ?? 0);
    return evaluateMembershipStatus(devoteeProfile, user, cumulativeTotal);
  }, [devoteeProfile, user, cumulativeData]);

  const discountSummary = useMemo(() => {
    return calculateCartDiscounts({
      items,
      isMemberActive: membershipEvaluation.isActive,
      membershipSettings: {
        membershipDiscount: settingsDiscountValue,
        discountType: settingsDiscountType,
      },
    });
  }, [
    items,
    membershipEvaluation.isActive,
    settingsDiscountValue,
    settingsDiscountType,
  ]);

  const {
    processedItems,
    subtotalAmount: originalSubtotal,
    totalMembershipDiscount,
    grandTotalAmount: discountedOfferingsSubtotal,
  } = discountSummary;

  const finalPayableAmount = Math.max(
    0,
    discountedOfferingsSubtotal +
      Number(generalDonation || 0) +
      Number(acharyaSambhavana || 0),
  );

  // Check if Sankalpam is required by any cart item
  const isSankalpamRequired = useMemo(() => {
    return items.some((item) => {
      const flag =
        item?.includeSankalpam ||
        item?.rawItem?.includeSankalpam ||
        item?.serviceSetup?.includeSankalpam ||
        "";
      return String(flag).trim().toUpperCase() === "YES";
    });
  }, [items]);

  // Stepper Handlers
  const handleIncreaseQty = (item) => {
    const currentQty = Number(item.quantity) || 1;
    updateQuantity(item.id || item._id, currentQty + 1);
  };

  const handleDecreaseQty = (item) => {
    const currentQty = Number(item.quantity) || 1;
    const targetId = item.id || item._id;
    if (currentQty <= 1) {
      removeItem(targetId);
    } else {
      updateQuantity(targetId, currentQty - 1);
    }
  };

  // Donation Handlers synchronized with Zustand store
  const handleSelectQuickDonation = (amount) => {
    if (generalDonation === amount) {
      setGeneralDonation(0);
      setCustomDonationInput("");
    } else {
      setGeneralDonation(amount);
      setCustomDonationInput(String(amount));
    }
  };

  const handleCustomDonationChange = (e) => {
    const val = e.target.value;
    setCustomDonationInput(val);
    const parsed = Math.max(0, parseFloat(val) || 0);
    setGeneralDonation(parsed);
  };

  // ================= CHECKOUT ORCHESTRATION PIPELINE =================
  const handleProceedPayment = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Step 1: Validate Sankalpam if mandatory
    if (isSankalpamRequired) {
      const isValid = validateSankalpam();
      if (!isValid) {
        showToast("Please fill all mandatory Sankalpam details.", "error");
        setErrorMessage(
          "Please resolve the errors highlighted in the Family Sankalpam section.",
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Step 2: Persist Sankalpam Form to Devotee Profile
      if (isSankalpamRequired) {
        const saveResponse = await saveSankalpam();
        if (
          saveResponse?.statusCode !== "1" &&
          saveResponse?.statusCode !== 1
        ) {
          const failMsg =
            saveResponse?.message || "Failed to save Sankalpam information.";
          showToast(failMsg, "error");
          setErrorMessage(failMsg);
          setIsSubmitting(false);
          return;
        }
      }

      // Step 3: Check Saree Availability if cart contains saree items
      const hasSareeItem = processedItems.some(
        (i) =>
          (i.itemType || "").toUpperCase() === "SAREE" ||
          (i.category || "").toUpperCase() === "SAREE",
      );

      if (hasSareeItem) {
        const sareeCheckRes = await checkSareeAvailability({ name: "saree" });
        if (sareeCheckRes?.status === "0" || sareeCheckRes?.status === 0) {
          const unavailableMsg =
            sareeCheckRes?.message ||
            "Selected saree seva is currently unavailable.";
          showToast(unavailableMsg, "error");
          setErrorMessage(unavailableMsg);
          setIsSubmitting(false);
          return;
        }
      }

      // Step 4: Reserve Temporary Booking Slot with Discounted Line Items
      const invoiceNumber = String(Date.now());
      const tempHoldResponse = await addServiceCartTemp({
        invoiceNum: invoiceNumber,
        totalAmount: finalPayableAmount,
        cartItems: processedItems,
        eventDetail: {},
        serviceDetail: { notes },
      });

      if (
        tempHoldResponse?.statusCode === 2 ||
        tempHoldResponse?.statusCode === 2
      ) {
        const expiredMsg =
          tempHoldResponse?.Message ||
          "Some services are no longer available for booking.";
        showToast(expiredMsg, "warning");
        setErrorMessage(expiredMsg);
        setIsSubmitting(false);
        return;
      }

      // Step 5: Open Hosted Payment Gateway Modal in-place
      setActiveInvoiceNumber(invoiceNumber);
      setIsPaymentModalOpen(true);
    } catch (err) {
      const errorText =
        err?.errorMessage ||
        err?.message ||
        "An unexpected error occurred during checkout.";
      showToast(errorText, "error");
      setErrorMessage(errorText);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Callback triggered after successful gateway authorization & finalization
  const handlePaymentSuccess = (finalizedResult) => {
    setIsPaymentModalOpen(false);

    const receiptItems = processedItems.map((item) => ({
      ...item,
      amount: item.lineFinalTotal,
    }));

    navigate("/checkout/success", {
      state: {
        invoiceNo: finalizedResult?.invoiceNo || activeInvoiceNumber,
        transactionId:
          finalizedResult?.transactionStatus?.transaction_id ||
          activeInvoiceNumber,
        paymentSource:
          finalizedResult?.addToCart?.paymentSource || "MPI_CARD_NOT_PRESENT",
        totalAmount: finalPayableAmount,
        items: receiptItems,
        devoteeName:
          devoteeProfile?.refDataName ||
          `${sankalpamData.firstName || ""} ${sankalpamData.lastName || ""}`.trim() ||
          "Devotee",
        devoteeEmail: devoteeProfile?.email
          ? decodeBase64(devoteeProfile.email)
          : "",
        acharyaSambhavana,
        generalDonation,
        membershipDiscount: totalMembershipDiscount,
      },
      replace: true,
    });
  };

  // Empty Cart View
  if (items.length === 0) {
    return (
      <main
        className="min-h-[75vh] flex items-center justify-center px-4 py-16"
        role="main"
      >
        <div className="bg-white/90 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-sm border border-amber-200/50 max-w-md w-full text-center">
          <div
            className="w-16 h-16 bg-red-50 text-[#900000] rounded-2xl flex items-center justify-center mx-auto text-2xl font-serif font-bold mb-4"
            aria-hidden="true"
          >
            ॐ
          </div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">
            Your Cart is Empty
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Explore our auspicious pooja services, temple seva offerings, and
            religious sponsorships.
          </p>
          <Link
            to="/services"
            className="inline-flex items-center justify-center gap-2 w-full bg-[#900000] text-amber-300 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#7a0000] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#900000] focus:ring-offset-2"
          >
            Explore Services{" "}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </main>
    );
  }

  const isActionLoading =
    isSankalpamSaving || isCheckoutApiProcessing || isSubmitting;

  return (
    <main
      className="min-h-screen bg-[#faf8f5] py-8 sm:py-12 px-4 sm:px-6 lg:px-8"
      role="main"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200/70">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full bg-[#900000]"
                aria-hidden="true"
              />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#900000]">
                Secure Checkout
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-1">
              Review & Confirm Offerings
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/services")}
            className="self-start sm:self-auto px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Continue Browsing ✕
          </button>
        </header>

        {/* Active Membership Benefit Banner */}
        {membershipEvaluation.isActive && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <img
                src={membershipBadge}
                alt=""
                className="w-8 h-8 object-contain shrink-0"
              />
              <div>
                <p className="text-xs sm:text-sm font-bold text-emerald-950">
                  Active{" "}
                  {membershipEvaluation.membershipName || "Temple Membership"}{" "}
                  Detected
                </p>
                <p className="text-[11px] text-emerald-800">
                  Member discounts are automatically applied to eligible temple
                  services and offerings below.
                </p>
              </div>
            </div>
            {totalMembershipDiscount > 0 && (
              <span className="self-start sm:self-center px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold tracking-wide shadow-2xs">
                You Save {currencySymbol}
                {totalMembershipDiscount.toFixed(2)}
              </span>
            )}
          </div>
        )}

        {/* Global Error Notice */}
        {errorMessage && (
          <div
            className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3"
            role="alert"
          >
            <AlertCircle
              className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1 text-xs text-red-700 font-medium leading-relaxed">
              {errorMessage}
            </div>
          </div>
        )}

        <form
          onSubmit={handleProceedPayment}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          noValidate
        >
          {/* SANKALPAM FORM + ORDER SUMMARY */}
          <section
            className="lg:col-span-7 space-y-6"
            aria-label="Order Details and Sankalpam"
          >
            {/* SHARED FAMILY SANKALPAM COMPONENT */}
            {isSankalpamRequired && (
              <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-amber-300/80 relative">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="p-2 rounded-xl bg-amber-100 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <img
                        src={logo}
                        alt=""
                        className="w-11 h-11 object-contain shrink-0"
                      />
                    </span>
                    <div>
                      <h2 className="text-base sm:text-lg font-serif font-bold text-gray-900">
                        Family Sankalpam Details
                      </h2>
                      <p className="text-xs text-gray-500">
                        Chanted by temple priests during the auspicious ritual
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-red-100 text-[#900000] px-2.5 py-1 rounded-full">
                    Mandatory
                  </span>
                </div>

                <FamilySankalpamForm
                  formData={sankalpamData}
                  errors={sankalpamErrors}
                  gotras={gotras}
                  nakshatras={nakshatras}
                  isLoading={isProfileLoading}
                  updateField={updateField}
                  addFamilyMember={addFamilyMember}
                  removeFamilyMember={removeFamilyMember}
                  updateFamilyMember={updateFamilyMember}
                />
              </div>
            )}

            {/* ORDER SUMMARY */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-200/80">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <span
                    className="p-2 rounded-xl bg-red-50 text-[#900000]"
                    aria-hidden="true"
                  >
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-lg font-serif font-bold text-gray-900">
                      Your Selected Offerings
                    </h2>
                    <p className="text-xs text-gray-500">
                      {totalCount} item(s) in cart
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-gray-400 hover:text-red-600 transition-colors cursor-pointer focus:outline-none focus:underline"
                >
                  Clear Cart
                </button>
              </div>

              {/* Items List with Original vs. Member Discounted Breakdown */}
              <div className="divide-y divide-gray-100" role="list">
                {processedItems.map((item) => {
                  const itemId = item.id || item._id;
                  const qty = Number(item.quantity) || 1;
                  const hasDiscount =
                    item.isDiscountApplied && item.lineDiscountTotal > 0;

                  return (
                    <div
                      key={itemId}
                      className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      role="listitem"
                    >
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/60 uppercase tracking-wide">
                            {item.category || item.itemType || "SEVA"}
                          </span>
                          {hasDiscount && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                              <Tag className="w-2.5 h-2.5" aria-hidden="true" />
                              Member Discount (-{currencySymbol}
                              {item.lineDiscountTotal.toFixed(2)})
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                          {item.name ||
                            item.title ||
                            item.serviceName ||
                            item.refDataName}
                        </h3>

                        {/* Unit Price Breakdown */}
                        <div className="text-[11px] text-gray-500 flex flex-wrap items-center gap-2">
                          <span>
                            Unit Price: {currencySymbol}
                            {item.originalUnitPrice.toFixed(2)}
                          </span>
                          {hasDiscount && (
                            <span className="text-emerald-700 font-semibold">
                              → Member Price: {currencySymbol}
                              {item.unitPrice.toFixed(2)} / unit
                            </span>
                          )}
                        </div>

                        {(item.startDate ||
                          item.selectedDate ||
                          item.time ||
                          item.selectedTime) && (
                          <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-gray-600">
                            {(item.startDate || item.selectedDate) && (
                              <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                                <Calendar
                                  className="w-3 h-3 text-gray-400"
                                  aria-hidden="true"
                                />
                                {item.startDate || item.selectedDate}
                              </span>
                            )}
                            {(item.time || item.selectedTime) && (
                              <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                                <Clock
                                  className="w-3 h-3 text-gray-400"
                                  aria-hidden="true"
                                />
                                {item.time || item.selectedTime}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5">
                        {item.qtyCounterEnabled ? (
                          <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleDecreaseQty(item)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors shadow-2xs cursor-pointer focus:outline-none"
                              aria-label={
                                qty === 1
                                  ? "Remove item from cart"
                                  : "Decrease item quantity"
                              }
                            >
                              {qty === 1 ? (
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              ) : (
                                <Minus className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <span
                              className="w-8 text-center text-xs font-bold text-gray-900"
                              aria-live="polite"
                            >
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleIncreaseQty(item)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-gray-700 hover:bg-gray-100 hover:text-emerald-700 transition-colors shadow-2xs cursor-pointer focus:outline-none"
                              aria-label="Increase item quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeItem(itemId)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors shadow-2xs cursor-pointer focus:outline-none"
                            aria-label="Remove item from cart"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="text-right min-w-[85px] flex flex-col items-end">
                          {hasDiscount && (
                            <span className="text-xs text-gray-400 line-through">
                              {currencySymbol}
                              {item.lineOriginalTotal.toFixed(2)}
                            </span>
                          )}
                          <span className="text-sm sm:text-base font-serif font-bold text-gray-900">
                            {currencySymbol}
                            {item.lineFinalTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100 space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">
                    Original Offerings Subtotal
                  </span>
                  <span className="font-semibold text-gray-800">
                    {currencySymbol}
                    {Number(originalSubtotal).toFixed(2)}
                  </span>
                </div>
                {totalMembershipDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 text-xs sm:text-sm">
                    <span className="font-semibold">
                      Membership Discount Applied
                    </span>
                    <span className="font-bold">
                      -{currencySymbol}
                      {Number(totalMembershipDiscount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* SPECIAL SANKALPAM NOTES */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/80">
              <label
                htmlFor="sankalpam-notes"
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                Special Sankalpam Instructions / Gotra Names
              </label>
              <textarea
                id="sankalpam-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention any additional family names, specific sankalpam intent, or pooja instructions..."
                className="w-full text-xs p-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#900000] transition-all"
              />
            </div>
          </section>

          {/* PROFILE + DONATION + ACTION SUMMARY */}
          <aside
            className="lg:col-span-5 space-y-6 lg:sticky lg:top-24"
            aria-label="Payment Summary"
          >
            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-200/80 space-y-5">
              {/* Devotee Info Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                
                    <img
                      src={membershipBadge}
                      alt=""
                      className="w-8 h-8 object-contain shrink-0"
                    />{" "}
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-900">
                      {devoteeProfile?.refDataName ||
                        `${sankalpamData.firstName || ""} ${sankalpamData.lastName || ""}`.trim() ||
                        "DEVOTEE"}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {devoteeProfile?.email
                        ? decodeBase64(devoteeProfile.email)
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[11px] font-semibold text-gray-700 block">
                    {decodeBase64(devoteeProfile?.phone) || ""}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                      membershipEvaluation.isActive
                        ? "text-emerald-800 bg-emerald-100"
                        : "text-emerald-700 bg-emerald-50"
                    }`}
                  >
                    {membershipEvaluation.isActive
                      ? `${membershipEvaluation.membershipType || "ACTIVE"} MEMBER`
                      : "Signed In"}
                  </span>
                </div>
              </div>

              {/* Additional Temple Donation */}
              <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <HeartHandshake
                      className="w-4 h-4 text-[#900000]"
                      aria-hidden="true"
                    />
                    Support Temple Fund
                  </span>
                  <span className="text-[11px] text-gray-400">Optional</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {QUICK_DONATIONS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSelectQuickDonation(amt)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#900000] ${
                        generalDonation === amt
                          ? "bg-[#900000] text-amber-300 border-[#900000] shadow-2xs"
                          : "bg-white text-gray-700 border-gray-200 hover:border-amber-300"
                      }`}
                    >
                      +${amt}
                    </button>
                  ))}
                </div>

                <div className="relative pt-1">
                  <span
                    className="absolute left-3 top-3 text-xs font-bold text-gray-400"
                    aria-hidden="true"
                  >
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={customDonationInput}
                    onChange={handleCustomDonationChange}
                    placeholder="Custom donation amount"
                    aria-label="Custom donation amount"
                    className="w-full pl-7 pr-3 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#900000]"
                  />
                </div>
              </div>

              {/* Complete Price & Discount Breakdown */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Offerings Subtotal (Original)</span>
                  <span>
                    {currencySymbol}
                    {Number(originalSubtotal).toFixed(2)}
                  </span>
                </div>

                {totalMembershipDiscount > 0 && (
                  <>
                    <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                      <span>Membership Discount</span>
                      <span>
                        -{currencySymbol}
                        {Number(totalMembershipDiscount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-700 font-semibold pt-1 border-t border-dashed border-gray-200">
                      <span>Offerings After Discount</span>
                      <span>
                        {currencySymbol}
                        {Number(discountedOfferingsSubtotal).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}

                {generalDonation > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                    <span>Temple Support Donation</span>
                    <span>
                      +{currencySymbol}
                      {Number(generalDonation).toFixed(2)}
                    </span>
                  </div>
                )}

                {acharyaSambhavana > 0 && (
                  <div className="flex justify-between text-xs text-amber-800 font-semibold">
                    <span>Acharya Sambhavana</span>
                    <span>
                      +{currencySymbol}
                      {Number(acharyaSambhavana).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2.5 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-900">
                    Final Amount to Pay:
                  </span>
                  <span className="text-2xl sm:text-3xl font-serif font-extrabold text-[#900000]">
                    {currencySymbol}
                    {Number(finalPayableAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isActionLoading}
                className="w-full py-3.5 bg-[#900000] text-amber-300 hover:bg-[#7a0000] rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#900000] focus:ring-offset-2"
              >
                {isActionLoading ? (
                  <>
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Processing Reservation...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      Proceed to Pay {currencySymbol}
                      {Number(finalPayableAmount).toFixed(2)}
                    </span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-gray-400 text-center">
                All offerings and donations are tax-exempt according to temple
                regulations.
              </p>
            </div>
          </aside>
        </form>

        {/* HOSTED SECURE PAYMENT MODAL */}
        <HostedPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          payableAmount={finalPayableAmount}
          invoiceNumber={activeInvoiceNumber}
          cartItems={processedItems}
          devoteeProfile={devoteeProfile}
          acharyaSambhavana={acharyaSambhavana}
          generalDonation={generalDonation}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </main>
  );
};

export default Checkout;
