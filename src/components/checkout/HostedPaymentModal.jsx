/**
 * @file src/components/checkout/HostedPaymentModal.jsx
 * @description Universal, memory-safe Hosted Payment Gateway Modal for Checkout.
 * Reuses `usePaymentGateway` (proactive jQuery + TokenPay.js / Collect.js loader),
 * mounts BridgePay hosted card fields inside `#card`, pre-fills devotee billing info,
 * enforces 5-digit US ZIP validation, and executes sequential charge + order reconciliation.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript), Tailwind CSS.
 * Aligns strictly with Non-Negotiables #1, #2, #3, #4, and #5.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import {
  X,
  CreditCard,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useCartStore } from "../../store/useCartStore";
import { useAuthStore } from "../../store/useAuthStore";
import { usePaymentGateway } from "../../hooks/queries/Common/usePaymentGateway";
import { useCheckout } from "../../hooks/queries/Checkout/checkoutApi";
import { decodeBase64 } from "../../utils/base64";

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

export const HostedPaymentModal = ({
  isOpen,
  onClose,
  payableAmount,
  invoiceNumber,
  cartItems = [],
  devoteeProfile = null,
  acharyaSambhavana = 0,
  generalDonation = 0,
  onSuccess,
}) => {
  // Global Stores
  const storeItems = useCartStore((state) => state.items || []);
  const currencySymbol = useCartStore((state) => state.currencySymbol || "$");
  const showToast = useCartStore((state) => state.showToast);
  const acquireModalLock = useCartStore((state) => state.acquireModalLock);
  const releaseModalLock = useCartStore((state) => state.releaseModalLock);
  const user = useAuthStore((state) => state.user);

  const activeCartItems = cartItems.length > 0 ? cartItems : storeItems;

  // Centralized Payment Gateway Status & Proactive SDK Loader
  const {
    isSettingsLoading,
    isScriptReady,
    isPaymentEnabled,
    activeGateway,
    gatewayMode,
    downReason,
    tokenizationKey,
    gatewayError,
  } = usePaymentGateway();

  // Checkout Charge & Reconciliation Mutations
  const {
    processMpiPayment,
    processNmiPayment,
    finalizeOrder,
    isProcessing: isPipelineProcessing,
  } = useCheckout();

  // Pre-filled values from devoteeProfile / authStore (user edits take precedence)
  const resolvedProfileName =
    devoteeProfile?.refDataName?.trim() ||
    `${devoteeProfile?.firstName || ""} ${devoteeProfile?.lastName || ""}`.trim() ||
    user?.name ||
    "";

  const resolvedProfileEmail = devoteeProfile?.email
    ? decodeBase64(devoteeProfile.email)
    : user?.email || "";

  const resolvedProfileZip =
    devoteeProfile?.zipCode || devoteeProfile?.zip || user?.zip || "";

  const resolvedBillingAddress = [
    devoteeProfile?.addressLine1,
    devoteeProfile?.addressLine2,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  // Local Form & SDK Mount State
  const [nameOverride, setNameOverride] = useState(null);
  const [emailOverride, setEmailOverride] = useState(null);
  const [zipOverride, setZipOverride] = useState(null);
  const [addressOverride, setAddressOverride] = useState(null);

  const [isCardMounted, setIsCardMounted] = useState(false);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [modalError, setModalError] = useState("");
  const [formValidationErrors, setFormValidationErrors] = useState({});

  const tokenpayInstanceRef = useRef(null);

  const cardholderName = nameOverride ?? resolvedProfileName;
  const customerEmail = emailOverride ?? resolvedProfileEmail;
  const zipcode = zipOverride ?? resolvedProfileZip;
  const streetAddress = addressOverride ?? resolvedBillingAddress;

  const isBusy = isTokenizing || isPipelineProcessing;

  // Modal Stacking Lock Management
  useEffect(() => {
    if (isOpen) {
      const lockAcquired = acquireModalLock("PAYMENT_MODAL");
      if (!lockAcquired) {
        showToast("Another modal dialog is currently active.", "warning");
      }
    } else {
      releaseModalLock();
    }

    return () => {
      releaseModalLock();
    };
  }, [isOpen, acquireModalLock, releaseModalLock, showToast]);

  // Escape Key Dismissal
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

  // Mount BridgePay (MPI) or NMI (Collect.js) Hosted Fields
  useEffect(() => {
    if (!isOpen || !isPaymentEnabled || !activeGateway || !isScriptReady) {
      return undefined;
    }

    let isCancelled = false;

    const mountTimer = setTimeout(() => {
      if (isCancelled) return;

      if (activeGateway === "MPI") {
        const cardContainer = document.getElementById("card");
        if (!cardContainer) return;

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
          } catch (tpErr) {
            console.error("[HTKY_OBSERVABILITY][MPI_INIT_ERROR]", tpErr);
            if (!isCancelled) {
              setModalError(
                "Failed to initialize BridgePay secure card fields. Please reopen.",
              );
            }
          }
        }
      } else if (activeGateway === "NMI") {
        if (
          window.CollectJS &&
          typeof window.CollectJS.configure === "function"
        ) {
          try {
            window.CollectJS.configure({
              variant: "inline",
              fields: {
                ccnumber: {
                  selector: "#nmi-ccnumber",
                  placeholder: "Card Number (0000 0000 0000 0000)",
                },
                ccexp: {
                  selector: "#nmi-ccexp",
                  placeholder: "MM / YY",
                },
                cvv: {
                  display: "show",
                  selector: "#nmi-cvv",
                  placeholder: "CVV",
                },
              },
              currency: "USD",
              country: "US",
              validationCallback: (field, status) => {
                if (!status) {
                  setFormValidationErrors((prev) => ({
                    ...prev,
                    [field]: `Invalid ${field}`,
                  }));
                } else {
                  setFormValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next[field];
                    return next;
                  });
                }
              },
            });
            if (!isCancelled) {
              setIsCardMounted(true);
              setModalError("");
            }
          } catch (nmiErr) {
            console.error("[HTKY_OBSERVABILITY][NMI_INIT_ERROR]", nmiErr);
            if (!isCancelled) {
              setModalError("Failed to configure NMI secure card fields.");
            }
          }
        }
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(mountTimer);
      tokenpayInstanceRef.current = null;
      setIsCardMounted(false);
    };
  }, [isOpen, isPaymentEnabled, activeGateway, isScriptReady, tokenizationKey]);

  // Sequential Order Reconciliation Helper (`AddToCart` -> `updateTransactionStatus`)
  const handleOrderReconciliation = useCallback(
    async ({ paymentSource, trnxId, mpiInvNumber, paymentResponse }) => {
      const result = await finalizeOrder({
        status: "COMPLETED",
        paymentSource,
        acharyaSambhavana,
        generalDonation,
        totalPrice: payableAmount,
        mpiInvNumber: mpiInvNumber || invoiceNumber || String(Date.now()),
        transactionId: trnxId,
        paymentDescription: paymentResponse,
        cartItems: activeCartItems,
      });

      showToast("Payment processed successfully!", "success");

      if (typeof onSuccess === "function") {
        onSuccess(result);
      }
      onClose();
    },
    [
      finalizeOrder,
      acharyaSambhavana,
      generalDonation,
      payableAmount,
      invoiceNumber,
      activeCartItems,
      showToast,
      onSuccess,
      onClose,
    ],
  );

  // Common Form Validation (Enforces strict 5-digit US ZIP code for BridgePay)
  const validateCommonFields = () => {
    const errs = {};
    if (!cardholderName.trim()) {
      errs.name = "Cardholder name is required.";
    }
    if (!zipcode.trim()) {
      errs.zipcode = "ZIP Code is required.";
    } else if (!/^\d{5}$/.test(zipcode.trim())) {
      errs.zipcode = "Enter a valid 5-digit US ZIP code (e.g., 40241).";
    }
    if (activeGateway === "NMI" && !customerEmail.trim()) {
      errs.email = "Email address is required for receipt delivery.";
    }
    setFormValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // MPI (BridgePay) Tokenization & Charge Handler
  const handleMpiPaymentSubmit = (e) => {
    e.preventDefault();
    setModalError("");
    if (!validateCommonFields()) return;

    if (
      !tokenpayInstanceRef.current ||
      typeof tokenpayInstanceRef.current.createToken !== "function"
    ) {
      setModalError("BridgePay payment form is still loading. Please wait.");
      return;
    }

    setIsTokenizing(true);

    tokenpayInstanceRef.current.createToken(
      async (result) => {
        setIsTokenizing(false);

        if (result?.status !== "auth_success" || !result?.token) {
          setModalError(
            "Invalid card credentials. Please verify your card details.",
          );
          return;
        }

        try {
          const chargeResponse = await processMpiPayment({
            token: result.token,
            totalAmount: payableAmount,
            name: cardholderName.trim(),
            address: streetAddress.trim(),
            zipcode: zipcode.trim(),
            invoiceNum: invoiceNumber || Date.now(),
            isTest: gatewayMode === "TEST",
          });

          const gatewayData = chargeResponse?.data?.responseCode
            ? chargeResponse.data
            : chargeResponse || {};
          const responseCode = String(gatewayData?.responseCode || "").trim();

          if (responseCode === "00000") {
            const refNum =
              gatewayData?.ReferenceNumber ||
              gatewayData?.TransactionID ||
              String(invoiceNumber || Date.now());
            const cardType = gatewayData?.cardType || "CARD";
            const maskedNum = gatewayData?.maskedAccountNumber || "";
            const trnxId = ["Payment completed", refNum, cardType, maskedNum]
              .filter(Boolean)
              .join("~");

            await handleOrderReconciliation({
              paymentSource: "MPI_CARD_NOT_PRESENT",
              trnxId,
              mpiInvNumber: chargeResponse?.mpiInvNumber || invoiceNumber,
              paymentResponse: chargeResponse,
            });
          } else {
            const failReason =
              gatewayData?.responseMessage ||
              chargeResponse?.message ||
              "Payment card authorization failed.";
            setModalError(failReason);
          }
        } catch (apiErr) {
          setModalError(
            apiErr?.errorMessage ||
              apiErr?.message ||
              "BridgePay server communication failure.",
          );
        }
      },
      (errorResult) => {
        setIsTokenizing(false);
        setModalError(
          errorResult?.message || "BridgePay tokenization declined.",
        );
      },
    );
  };

  // NMI (Collect.js) Tokenization & Charge Handler
  const handleNmiPaymentSubmit = (e) => {
    e.preventDefault();
    setModalError("");
    if (!validateCommonFields()) return;

    if (
      !window.CollectJS ||
      typeof window.CollectJS.startPaymentRequest !== "function"
    ) {
      setModalError("NMI payment system is not ready.");
      return;
    }

    setIsTokenizing(true);

    window.CollectJS.configure({
      callback: async (response) => {
        setIsTokenizing(false);

        if (!response?.token) {
          setModalError(
            "Card tokenization failed. Please verify your details.",
          );
          return;
        }

        try {
          const chargeResponse = await processNmiPayment({
            token: response.token,
            totalAmount: payableAmount,
            name: cardholderName.trim(),
            email: customerEmail.trim(),
            zipcode: zipcode.trim(),
            cartItems: activeCartItems,
          });

          const isSuccess =
            chargeResponse?.response === "1" &&
            (chargeResponse?.response_text === "SUCCESS" ||
              chargeResponse?.response_text === "Approved");

          if (isSuccess) {
            const trnxId = [
              "Payment completed",
              chargeResponse.id || "",
              chargeResponse.payment_details?.card_type || "",
              chargeResponse.payment_details?.card_number || "",
            ]
              .filter(Boolean)
              .join("~");

            await handleOrderReconciliation({
              paymentSource: "NMI",
              trnxId,
              mpiInvNumber: chargeResponse.mpiInvNumber || invoiceNumber,
              paymentResponse: chargeResponse,
            });
          } else {
            const failReason =
              chargeResponse?.response_text ||
              chargeResponse?.message ||
              "NMI Card transaction declined.";
            setModalError(failReason);
          }
        } catch (apiErr) {
          setModalError(
            apiErr?.errorMessage ||
              apiErr?.message ||
              "NMI server communication failure.",
          );
        }
      },
    });

    window.CollectJS.startPaymentRequest();
  };

  if (!isOpen) return null;

  const isFormBusy =
    isSettingsLoading || !isScriptReady || !isCardMounted || isBusy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      onClick={() => !isBusy && onClose()}
    >
      {/* Inject BridgePay required hosted-field CSS classes */}
      <style>{BRIDGEPAY_HOSTED_STYLES}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-[#faf8f5]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 text-[#900000]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="payment-modal-title"
                className="text-base font-serif font-bold text-gray-900"
              >
                Secure Card Checkout
              </h2>
              <p className="text-[11px] text-gray-500">
                Provider: {activeGateway || "Resolving..."}{" "}
                {gatewayMode === "TEST" && "(Sandbox Test)"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close payment modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Amount Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                Total Payable Amount
              </span>
              <p className="text-xl font-serif font-extrabold text-[#900000]">
                {currencySymbol}
                {Number(payableAmount || 0).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              256-Bit Encrypted
            </div>
          </div>

          {/* Kill-Switch Notice (If Gateway is disabled or unavailable) */}
          {!isSettingsLoading && !isPaymentEnabled && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Notice on Temple Payment Services</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-800">
                {downReason ||
                  "Payment service is currently unavailable. Sorry for the inconvenience."}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  Return to Checkout
                </button>
              </div>
            </div>
          )}

          {/* Gateway / Form Error Banner */}
          {(modalError || gatewayError) && isPaymentEnabled && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium"
            >
              {modalError || gatewayError}
            </div>
          )}

          {/* Hidden amount element required by TokenPay */}
          <input
            type="hidden"
            id="amount"
            value={Number(payableAmount || 0).toFixed(2)}
            readOnly
          />

          {/* Active Payment Form */}
          {isPaymentEnabled && (
            <form
              onSubmit={
                activeGateway === "NMI"
                  ? handleNmiPaymentSubmit
                  : handleMpiPaymentSubmit
              }
              className="space-y-4"
              noValidate
            >
              {/* Cardholder Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Cardholder Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setNameOverride(e.target.value)}
                  placeholder="e.g., Vikas Verma"
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-gray-200 focus:border-[#900000] focus:outline-none"
                  disabled={isBusy}
                />
                {formValidationErrors.name && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 block">
                    {formValidationErrors.name}
                  </span>
                )}
              </div>

              {/* NMI Specific Email Requirement */}
              {activeGateway === "NMI" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Receipt Email Address{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setEmailOverride(e.target.value)}
                    placeholder="devotee@example.com"
                    className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-gray-200 focus:border-[#900000] focus:outline-none"
                    disabled={isBusy}
                  />
                  {formValidationErrors.email && (
                    <span className="text-[10px] text-red-500 font-semibold mt-1 block">
                      {formValidationErrors.email}
                    </span>
                  )}
                </div>
              )}

              {/* HOSTED SECURE CARD FIELDS */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block">
                  Hosted Card Credentials
                </span>

                {/* Gateway Provider = NMI (Collect.js inline containers) */}
                {activeGateway === "NMI" && (
                  <div className="space-y-2.5 relative">
                    <div
                      id="nmi-ccnumber"
                      className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        id="nmi-ccexp"
                        className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                      <div
                        id="nmi-cvv"
                        className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Gateway Provider = MPI (BridgePay TokenPay `#card` container) */}
                {activeGateway === "MPI" && (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <div id="card" />
                      {(!isScriptReady || !isCardMounted) && (
                        <div className="absolute inset-0 bg-white/95 rounded-[10px] flex items-center justify-center gap-2 text-xs text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin text-[#900000]" />
                          <span>Initializing Secure Card Fields...</span>
                        </div>
                      )}
                    </div>
                    <div
                      id="errorMessage"
                      className="text-[11px] text-red-600 font-semibold min-h-[16px]"
                    />
                  </div>
                )}
              </div>

              {/* Billing Address & 5-Digit US ZIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Billing ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={zipcode}
                    onChange={(e) =>
                      setZipOverride(
                        e.target.value.replace(/\D/g, "").slice(0, 5),
                      )
                    }
                    placeholder="e.g., 40241"
                    className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-gray-200 focus:border-[#900000] focus:outline-none"
                    disabled={isBusy}
                  />
                  {formValidationErrors.zipcode && (
                    <span className="text-[10px] text-red-500 font-semibold mt-1 block">
                      {formValidationErrors.zipcode}
                    </span>
                  )}
                </div>

                {activeGateway === "MPI" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Billing Street Address
                    </label>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setAddressOverride(e.target.value)}
                      placeholder="e.g., 100 Temple Rd"
                      className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-gray-200 focus:border-[#900000] focus:outline-none"
                      disabled={isBusy}
                    />
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isFormBusy}
                className="w-full py-3.5 bg-[#900000] text-amber-300 hover:bg-[#7a0000] rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {isTokenizing
                        ? "Authorizing Card..."
                        : "Finalizing Booking..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      Authorize & Pay {currencySymbol}
                      {Number(payableAmount || 0).toFixed(2)}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-[#faf8f5] flex items-center justify-between text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            PCI-DSS Validated Vault
          </span>
          <span>Temple Secure Transaction</span>
        </div>
      </div>
    </div>
  );
};

HostedPaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  payableAmount: PropTypes.number.isRequired,
  invoiceNumber: PropTypes.string,
  cartItems: PropTypes.array,
  devoteeProfile: PropTypes.object,
  acharyaSambhavana: PropTypes.number,
  generalDonation: PropTypes.number,
  onSuccess: PropTypes.func,
};

export default HostedPaymentModal;
