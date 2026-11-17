/**
 * @file src/components/Membership/MembershipCheckoutModal.jsx
 * @description Secure Membership Checkout Modal with BridgePay (MPI) Gateway integration.
 *
 * Execution Pipeline on PAY NOW:
 * 1. Tokenizes card details client-side via BridgePay `TokenPay.createToken()`.
 * 2. Executes `useEnrollMembership` mutation:
 *    a) Charges tokenized card via `api/vaaptech/mpiCardPaymentTest` or `mpiCardPayment`.
 *    b) Upon `responseCode === "00000"`, registers membership via `api/home/addMemberShip`
 *       with Base64-encoded contacts and `JSON.stringify` benefits.
 *    c) Invalidates cached `devoteeDetails` so Dashboard reflects active membership immediately.
 * 3. Forwards reconciled receipt metadata to `onSuccess` for `/checkout/success`.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript), Tailwind CSS.
 * Aligns strictly with Non-Negotiables #1, #2, #3, #4, and #5.
 */

import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { X, Lock, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { usePaymentGateway } from "../../hooks/queries/Common/usePaymentGateway";
import { useGetDevoteeDetails } from "../../hooks/queries/Profile/useDevoteeProfile";
import { useEnrollMembership } from "../../hooks/queries/Membership/useMembershipSettings";
import { useAuthStore } from "../../store/useAuthStore";
import { decodeBase64 } from "../../utils/base64";
import { APP_COLORS } from "../../constants/appColors";

/**
 * Required CSS rules read by BridgePay's `tokenPay.js` when `useStyles: false` is configured.
 */
const BRIDGEPAY_HOSTED_STYLES = `
  #card {
    background: #ffffff;
    min-height: 140px;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid #94b8c0;
    box-sizing: border-box;
    width: 100%;
  }
  .input-style {
    color: #1f2937;
    font-size: 14px;
  }
  .input-hint {
    color: #6b7280;
    border-color: #9ac0c8;
  }
  .form-wrapper {
    width: 100%;
  }
  .input-wrapper {
    width: 100%;
  }
  .sub-wrapper {
    width: 48%;
  }
  .valid-class {
    color: #15803d;
  }
  .invalid-class {
    color: #b91c1c;
  }
`;

export const MembershipCheckoutModal = ({
  isOpen,
  onClose,
  membershipPlan,
  onSuccess,
}) => {
  // 1. Global Gateway State (CLIENT_SETTINGS -> paymentGatewayoffon & paymentGatewaySettings)
  const {
    isPaymentEnabled,
    activeGateway,
    gatewayMode,
    tokenizationKey,
    isScriptReady,
    downReason,
    gatewayError,
  } = usePaymentGateway();

  // 2. Logged-in User & Devotee Profile Data (getDevoteeDetailsWeb)
  const user = useAuthStore((state) => state.user);
  const memberId = user?._id || user?.id || user?.memberId || "";
  const { data: devoteeProfile, isLoading: isDevoteeLoading } =
    useGetDevoteeDetails(memberId);

  // 3. Sequential Charge + Membership Registration Mutation
  const enrollMembershipMutation = useEnrollMembership();

  // 4. Local Form Override States (User edits take precedence; otherwise pre-filled from API)
  const [nameOverride, setNameOverride] = useState(null);
  const [emailOverride, setEmailOverride] = useState(null);
  const [phoneOverride, setPhoneOverride] = useState(null);
  const [zipOverride, setZipOverride] = useState(null);

  const [isTokenizing, setIsTokenizing] = useState(false);
  const [modalError, setModalError] = useState("");
  const [isCardMounted, setIsCardMounted] = useState(false);

  const tokenpayInstanceRef = useRef(null);

  // Pre-filled values from `getDevoteeDetailsWeb` (with safe Base64 decode & empty fallback)
  const resolvedProfileName =
    devoteeProfile?.refDataName?.trim() ||
    `${devoteeProfile?.firstName || ""} ${devoteeProfile?.lastName || ""}`.trim() ||
    user?.name ||
    "";

  const resolvedProfileEmail = devoteeProfile?.email
    ? decodeBase64(devoteeProfile.email)
    : user?.email || "";

  const resolvedProfilePhone = devoteeProfile?.phone
    ? decodeBase64(devoteeProfile.phone)
    : user?.phone || "";

  const resolvedProfileZip =
    devoteeProfile?.zipCode || devoteeProfile?.zip || user?.zip || "";

  const resolvedBillingAddress = [
    devoteeProfile?.addressLine1,
    devoteeProfile?.addressLine2,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const nameOnCard = nameOverride ?? resolvedProfileName;
  const email = emailOverride ?? resolvedProfileEmail;
  const phone = phoneOverride ?? resolvedProfilePhone;
  const zipCode = zipOverride ?? resolvedProfileZip;

  const isBusy = isTokenizing || enrollMembershipMutation.isPending;

  // Close modal cleanly on Escape key press
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isBusy) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isBusy, onClose]);

  // Mount BridgePay TokenPay Hosted Fields inside `#card` once script & DOM are ready
  useEffect(() => {
    if (
      !isOpen ||
      !isPaymentEnabled ||
      activeGateway !== "MPI" ||
      !isScriptReady
    ) {
      return undefined;
    }

    let isCancelled = false;

    const timer = setTimeout(() => {
      const cardContainer = document.getElementById("card");
      if (!cardContainer || isCancelled) return;

      cardContainer.innerHTML = "";

      if (typeof window.TokenPay === "function") {
        try {
          const tp = window.TokenPay(tokenizationKey);

          tp.initialize({
            dataElement: "#card",
            errorElement: "#errorMessage",
            amountElement: "#amount",
            useStyles: false,
            useACH: false,
            disableZip: true,
            disableCvv: false,
          });

          tokenpayInstanceRef.current = tp;
          if (!isCancelled) {
            setIsCardMounted(true);
            setModalError("");
          }
        } catch (err) {
          console.error("[HTKY_OBSERVABILITY][TOKENPAY_INIT_ERROR]", err);
          if (!isCancelled) {
            setModalError(
              "Failed to initialize secure card fields. Please reopen the modal.",
            );
          }
        }
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      tokenpayInstanceRef.current = null;
      setIsCardMounted(false);
    };
  }, [isOpen, isPaymentEnabled, activeGateway, isScriptReady, tokenizationKey]);

  if (!isOpen) return null;

  const handleSubmitPayment = (e) => {
    e.preventDefault();
    setModalError("");

    if (!isPaymentEnabled) {
      setModalError(
        downReason ||
          "Payment service is currently down for maintenance. Sorry for the inconvenience.",
      );
      return;
    }

    if (!nameOnCard.trim() || !zipCode.trim()) {
      setModalError("Please fill in Name on Card and ZIP Code.");
      return;
    }

    // BridgePay requires strictly 5-digit US ZIP code (prevents responseCode: 10025)
    if (!/^\d{5}$/.test(zipCode.trim())) {
      setModalError("Please enter a valid 5-digit US ZIP Code (e.g., 40241).");
      return;
    }

    if (activeGateway !== "MPI") {
      setModalError(
        `Gateway ${activeGateway} is not supported for this checkout flow.`,
      );
      return;
    }

    if (
      !tokenpayInstanceRef.current ||
      typeof tokenpayInstanceRef.current.createToken !== "function"
    ) {
      setModalError(
        "Secure payment fields are still loading. Please wait a moment.",
      );
      return;
    }

    setIsTokenizing(true);

    tokenpayInstanceRef.current.createToken(
      async (result) => {
        setIsTokenizing(false);

        if (result?.status !== "auth_success" || !result?.token) {
          setModalError(
            "Card authorization failed. Please verify your card details.",
          );
          return;
        }

        try {
          const enrollmentResult = await enrollMembershipMutation.mutateAsync({
            token: result.token,
            membershipPlan,
            devoteeInfo: {
              memberId: devoteeProfile?._id || memberId,
              name: nameOnCard.trim(),
              email: email.trim(),
              mobile: phone.trim(),
            },
            billingAddress: resolvedBillingAddress,
            zipcode: zipCode.trim(),
            isTestMode: gatewayMode === "TEST",
          });

          if (typeof onSuccess === "function") {
            onSuccess({
              ...enrollmentResult,
              name: nameOnCard.trim(),
              email: email.trim(),
              phone: phone.trim(),
              zipcode: zipCode.trim(),
              membershipPlan,
            });
          }
        } catch (err) {
          setModalError(
            err?.errorMessage ||
              err?.message ||
              "Membership payment or registration failed. Please try again.",
          );
        }
      },
      (errorResult) => {
        setIsTokenizing(false);
        setModalError(
          errorResult?.message ||
            "Card validation declined by payment gateway.",
        );
      },
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="membership-checkout-title"
      onClick={() => !isBusy && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Inject BridgePay required hosted-field CSS classes */}
      <style>{BRIDGEPAY_HOSTED_STYLES}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-[#faf8f5]">
          <h2
            id="membership-checkout-title"
            className="text-lg font-serif font-bold text-[#900000] uppercase tracking-wider border-b-2 border-amber-500 pb-0.5"
          >
            CHECKOUT
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close Checkout Modal"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Temple Emblem */}
          <div className="text-center space-y-1">
            <div
              className="w-14 h-14 rounded-full bg-amber-50 border border-amber-300 text-[#900000] flex items-center justify-center mx-auto text-2xl font-serif font-bold shadow-2xs"
              aria-hidden="true"
            >
              ॐ
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Hindu Temple of Kentucky
            </p>
          </div>

          {/* Error / Gateway Down Alert */}
          {(modalError || gatewayError || !isPaymentEnabled) && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>
                {modalError ||
                  gatewayError ||
                  downReason ||
                  "Payment service is currently unavailable. Sorry for the inconvenience."}
              </span>
            </div>
          )}

          {/* Upper Details Table: Membership Plan & Amount to Pay (from CLIENT_SETTINGS) */}
          <div className="border border-stone-300 rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-stone-300 bg-stone-50 text-center py-2.5 px-3 border-b border-stone-300">
              <span
                className="text-xs sm:text-sm font-bold"
                style={{ color: APP_COLORS.primary }}
              >
                Membership Plan
              </span>
              <span
                className="text-xs sm:text-sm font-bold"
                style={{ color: APP_COLORS.primary }}
              >
                Amount to Pay
              </span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-stone-300 text-center py-3.5 px-3 items-center bg-white">
              <span className="text-sm sm:text-base font-semibold text-stone-800 uppercase">
                {membershipPlan?.membershipType ||
                  membershipPlan?.displayName ||
                  "LIFETIME"}
              </span>
              <span
                className="text-lg sm:text-xl font-bold"
                style={{ color: APP_COLORS.primary }}
              >
                {membershipPlan?.formattedPrice || "$0.00"}
              </span>
            </div>
          </div>

          {/* Hidden amount element required by TokenPay.initialize({ amountElement: '#amount' }) */}
          <input
            type="hidden"
            id="amount"
            value={Number(membershipPlan?.price || 0).toFixed(2)}
            readOnly
          />

          {/* Card & Pre-filled Devotee Form (No reCAPTCHA) */}
          <form
            onSubmit={handleSubmitPayment}
            id="membership-payment-form"
            className="space-y-4"
            noValidate
          >
            {/* Card Details Section */}
            <div className="space-y-1.5">
              <p className="text-center text-sm font-semibold text-stone-800">
                Card Details
              </p>

              <div className="relative">
                {/* BridgePay TokenPay mounts Card Number, Expiry Date (/), and CVC iframes inside #card */}
                <div id="card" />

                {(!isScriptReady || !isCardMounted) && isPaymentEnabled && (
                  <div className="absolute inset-0 bg-white/90 rounded-[10px] flex items-center justify-center gap-2 text-xs text-stone-500">
                    <Loader2 className="w-4 h-4 animate-spin text-[#900000]" />
                    <span>Initializing Secure Card Fields...</span>
                  </div>
                )}
              </div>

              <div
                id="errorMessage"
                className="text-xs text-red-600 font-medium min-h-[16px]"
              />

              <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  PCI-DSS Encrypted
                </span>
                <span className="font-mono font-bold text-amber-700 uppercase">
                  {activeGateway || "MPI"} GATEWAY
                </span>
              </div>
            </div>

            {/* Devotee / Billing Details (Pre-filled from getDevoteeDetailsWeb if available, else empty) */}
            <div className="space-y-3 pt-1">
              <div>
                <label
                  htmlFor="modal-name-on-card"
                  className="block text-sm font-bold text-stone-900 mb-1"
                >
                  Name on Card <span className="text-red-600">*</span>
                </label>
                <input
                  id="modal-name-on-card"
                  type="text"
                  required
                  value={nameOnCard}
                  onChange={(e) => setNameOverride(e.target.value)}
                  placeholder={
                    isDevoteeLoading ? "Loading..." : "Enter Name on Card"
                  }
                  disabled={isBusy}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-md focus:border-[#900000] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="modal-email"
                    className="block text-xs font-bold text-stone-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="modal-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmailOverride(e.target.value)}
                    placeholder="Enter Email"
                    disabled={isBusy}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-stone-300 rounded-md focus:border-[#900000] outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="modal-phone"
                    className="block text-xs font-bold text-stone-700 mb-1"
                  >
                    Phone
                  </label>
                  <input
                    id="modal-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhoneOverride(e.target.value)}
                    placeholder="Enter Phone"
                    disabled={isBusy}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-stone-300 rounded-md focus:border-[#900000] outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="modal-zipcode"
                  className="block text-sm font-bold text-stone-900 mb-1"
                >
                  ZIP Code <span className="text-red-600">*</span>
                </label>
                <input
                  id="modal-zipcode"
                  type="text"
                  required
                  maxLength={5}
                  value={zipCode}
                  onChange={(e) =>
                    setZipOverride(
                      e.target.value.replace(/\D/g, "").slice(0, 5),
                    )
                  }
                  placeholder="Enter ZIP Code"
                  disabled={isBusy}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-md focus:border-[#900000] outline-none"
                />
              </div>
            </div>

            {/* PAY NOW CTA Button */}
            <div className="pt-2 flex justify-center">
              <button
                type="submit"
                disabled={isBusy || !isPaymentEnabled || !isCardMounted}
                className="px-8 py-2.5 bg-[#e78b00] hover:bg-[#d07d00] text-white font-extrabold text-sm uppercase tracking-wider rounded-md shadow-sm transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {isTokenizing
                        ? "Authorizing Card..."
                        : "Completing Registration..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>PAY NOW</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

MembershipCheckoutModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  membershipPlan: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
};

export default MembershipCheckoutModal;
