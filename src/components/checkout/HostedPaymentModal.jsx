/**
 * Dynamically mounts and cleans up NMI (Collect.js) or BridgePay (TokenPay.js)
 * based on active backend Client Settings. Handles card tokenization and triggers
 * the centralized checkout pipeline mutations without synchronous setState in effect bodies.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { useCartStore } from "../../store/useCartStore";
import { usePaymentGatewaySettings } from "../../hooks/queries/Checkout/usePaymentGatewaySettings";
import { useCheckout } from "../../hooks/queries/Checkout/checkoutApi";
import {
  NMI_GATEWAY_CONFIG,
  MPI_GATEWAY_CONFIG,
} from "../../constants/apiConstants";
import {
  X,
  CreditCard,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export const HostedPaymentModal = ({
  isOpen,
  onClose,
  payableAmount,
  invoiceNumber,
  onSuccess,
}) => {
  // Global Stores & Hooks
  const items = useCartStore((state) => state.items || []);
  const currencySymbol = useCartStore((state) => state.currencySymbol || "$");
  const showToast = useCartStore((state) => state.showToast);
  const acquireModalLock = useCartStore((state) => state.acquireModalLock);
  const releaseModalLock = useCartStore((state) => state.releaseModalLock);

  // Gateway Settings & Dynamic Resolution
  const {
    isPaymentEnabled,
    gatewayProvider,
    gatewayMode,
    tokenizationKey,
    downReason,
    isLoading: isSettingsLoading,
  } = usePaymentGatewaySettings();

  // Network Mutation Pipeline
  const {
    processMpiPayment,
    processNmiPayment,
    finalizeOrder,
    isProcessing: isPipelineProcessing,
  } = useCheckout();

  // Local Form & Processing State
  const [loadedScriptId, setLoadedScriptId] = useState("");
  const [scriptError, setScriptError] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValidationErrors, setFormValidationErrors] = useState({});

  // Container refs for secure unmounting
  const scriptElementRef = useRef(null);
  const modalContainerRef = useRef(null);
  const tokenpayInstanceRef = useRef(null);

  const scriptUrl =
    gatewayProvider === "NMI"
      ? gatewayMode === "TEST"
        ? NMI_GATEWAY_CONFIG.TEST_SCRIPT
        : NMI_GATEWAY_CONFIG.LIVE_SCRIPT
      : gatewayProvider === "MPI"
        ? gatewayMode === "TEST"
          ? MPI_GATEWAY_CONFIG.TEST_SCRIPT
          : MPI_GATEWAY_CONFIG.LIVE_SCRIPT
        : "";

  const currentScriptId = gatewayProvider
    ? `payment-gateway-script-${gatewayProvider.toLowerCase()}`
    : "";

  // Script load status derived cleanly without synchronous setState inside effect
  const isScriptReady =
    loadedScriptId === currentScriptId && Boolean(currentScriptId);

  const displayedScriptError =
    scriptError ||
    (isOpen && isPaymentEnabled && gatewayProvider && !scriptUrl
      ? "Payment script configuration is missing."
      : "");

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

  // Script Injection & Lifecycle Cleanup
  useEffect(() => {
    if (!isOpen || !isPaymentEnabled || !gatewayProvider || !scriptUrl) {
      return;
    }

    const scriptId = `payment-gateway-script-${gatewayProvider.toLowerCase()}`;

    // Clean up any previously attached script with the same ID
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = scriptUrl;
    script.async = true;

    // NMI requires data-tokenization-key on the script tag itself
    if (gatewayProvider === "NMI" && tokenizationKey) {
      script.setAttribute("data-tokenization-key", tokenizationKey);
    }

    script.onload = () => {
      setLoadedScriptId(scriptId);
      setScriptError("");

      // Initialize BridgePay TokenPay SDK if provider is MPI
      if (gatewayProvider === "MPI" && window.TokenPay) {
        try {
          const activeKey =
            tokenizationKey || MPI_GATEWAY_CONFIG.DEFAULT_TEST_TOKEN;
          const tp = window.TokenPay(activeKey);
          tp.initialize({
            dataElement: "#mpi-card-element",
            errorElement: "#mpi-error-element",
            amountElement: "#mpi-amount-element",
            useStyles: false,
            useACH: false,
            disableZip: false,
            disableCvv: false,
          });
          tokenpayInstanceRef.current = tp;
        } catch (tpErr) {
          setScriptError(
            `Failed to initialize BridgePay secure input fields: ${tpErr.message}`,
          );
        }
      }

      // Initialize NMI Collect.js if provider is NMI
      if (gatewayProvider === "NMI" && window.CollectJS) {
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
        } catch (nmiErr) {
          setScriptError(
            `Failed to configure NMI hosted fields: ${nmiErr.message}`,
          );
        }
      }
    };

    script.onerror = () => {
      setScriptError(
        `Unable to load payment gateway security script from ${gatewayProvider}.`,
      );
    };

    document.head.appendChild(script);
    scriptElementRef.current = script;

    // Unmount Cleanup: Prevent dangling listeners and memory leaks
    return () => {
      if (scriptElementRef.current) {
        scriptElementRef.current.remove();
        scriptElementRef.current = null;
      }
      tokenpayInstanceRef.current = null;
      setLoadedScriptId("");
    };
  }, [
    isOpen,
    isPaymentEnabled,
    gatewayProvider,
    gatewayMode,
    tokenizationKey,
    scriptUrl,
  ]);

  // Order Finalization Helper
  const handleOrderReconciliation = useCallback(
    async ({ paymentSource, trnxId, mpiInvNumber, paymentResponse }) => {
      const result = await finalizeOrder({
        status: "COMPLETED",
        paymentSource,
        totalPrice: payableAmount,
        mpiInvNumber: mpiInvNumber || invoiceNumber || String(Date.now()),
        transactionId: trnxId,
        paymentDescription: paymentResponse,
        cartItems: items,
      });

      showToast("Payment processed successfully!", "success");

      if (typeof onSuccess === "function") {
        onSuccess(result);
      }
      onClose();
    },
    [
      finalizeOrder,
      payableAmount,
      invoiceNumber,
      items,
      showToast,
      onSuccess,
      onClose,
    ],
  );

  // Form Validation
  const validateCommonFields = () => {
    const errs = {};
    if (!cardholderName.trim()) errs.name = "Cardholder name is required.";
    if (!zipcode.trim()) {
      errs.zipcode = "ZIP Code is required.";
    } else if (!/^[0-9]{5,6}$/.test(zipcode.trim())) {
      errs.zipcode = "Enter a valid 5 or 6 digit ZIP code.";
    }
    if (gatewayProvider === "NMI" && !customerEmail.trim()) {
      errs.email = "Email address is required for receipt delivery.";
    }
    setFormValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // MPI (BridgePay) Tokenization & Submission Handler
  const handleMpiPaymentSubmit = (e) => {
    e.preventDefault();
    if (!validateCommonFields()) return;

    if (!tokenpayInstanceRef.current) {
      showToast("BridgePay payment form is not yet ready.", "error");
      return;
    }

    setIsSubmitting(true);

    tokenpayInstanceRef.current.createToken(
      async (result) => {
        if (result?.status === "auth_success" && result.token) {
          try {
            const chargeResponse = await processMpiPayment({
              token: result.token,
              totalAmount: payableAmount,
              name: cardholderName,
              address: streetAddress,
              zipcode,
              cartItems: items,
              isTest: gatewayMode === "TEST",
            });

            if (
              chargeResponse?.data?.responseCode === "00000" ||
              chargeResponse?.data?.responseCode === 0
            ) {
              const trnxId = `Payment completed~${chargeResponse.data.ReferenceNumber || ""}~${chargeResponse.data.cardType || ""}~${chargeResponse.data.maskedAccountNumber || ""}`;
              await handleOrderReconciliation({
                paymentSource: "MPI",
                trnxId,
                mpiInvNumber: chargeResponse.mpiInvNumber,
                paymentResponse: chargeResponse,
              });
            } else {
              const failReason =
                chargeResponse?.data?.responseMessage ||
                chargeResponse?.message ||
                "Payment card authorization failed.";
              showToast(failReason, "error");
            }
          } catch (apiErr) {
            showToast(
              apiErr?.errorMessage || "BridgePay server communication failure.",
              "error",
            );
          } finally {
            setIsSubmitting(false);
          }
        } else {
          setIsSubmitting(false);
          showToast(
            "Invalid card credentials. Please verify your entries.",
            "error",
          );
        }
      },
      (errorResult) => {
        setIsSubmitting(false);
        showToast(
          errorResult?.message || "BridgePay tokenization declined.",
          "error",
        );
      },
    );
  };

  // NMI (Collect.js) Tokenization & Submission Handler
  const handleNmiPaymentSubmit = (e) => {
    e.preventDefault();
    if (!validateCommonFields()) return;

    if (
      !window.CollectJS ||
      typeof window.CollectJS.startPaymentRequest !== "function"
    ) {
      showToast("NMI payment system is not ready.", "error");
      return;
    }

    setIsSubmitting(true);

    window.CollectJS.configure({
      callback: async (response) => {
        if (response?.token) {
          try {
            const chargeResponse = await processNmiPayment({
              token: response.token,
              totalAmount: payableAmount,
              name: cardholderName,
              email: customerEmail,
              zipcode,
              cartItems: items,
            });

            const isSuccess =
              chargeResponse?.response === "1" &&
              (chargeResponse?.response_text === "SUCCESS" ||
                chargeResponse?.response_text === "Approved");

            if (isSuccess) {
              const trnxId = `Payment completed~${chargeResponse.id || ""}~${chargeResponse.payment_details?.card_type || ""}~${chargeResponse.payment_details?.card_number || ""}`;
              await handleOrderReconciliation({
                paymentSource: "NMI",
                trnxId,
                mpiInvNumber: chargeResponse.mpiInvNumber,
                paymentResponse: chargeResponse,
              });
            } else {
              const failReason =
                chargeResponse?.response_text ||
                chargeResponse?.message ||
                "NMI Card transaction declined.";
              showToast(failReason, "error");
            }
          } catch (apiErr) {
            showToast(
              apiErr?.errorMessage || "NMI server communication failure.",
              "error",
            );
          } finally {
            setIsSubmitting(false);
          }
        } else {
          setIsSubmitting(false);
          showToast(
            "Card tokenization failed. Please verify your details.",
            "error",
          );
        }
      },
    });

    window.CollectJS.startPaymentRequest();
  };

  if (!isOpen) return null;

  const isFormBusy =
    isSettingsLoading || !isScriptReady || isSubmitting || isPipelineProcessing;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      ref={modalContainerRef}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
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
                Provider: {gatewayProvider || "Resolving..."}{" "}
                {gatewayMode === "TEST" && "(Sandbox Test)"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isPipelineProcessing}
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
                  className="w-full py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
                >
                  Return to Cart
                </button>
              </div>
            </div>
          )}

          {/* Script Loading / Initialization Notice */}
          {isSettingsLoading ||
          (isPaymentEnabled && !isScriptReady && !displayedScriptError) ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#900000]" />
              <p className="text-xs text-gray-500 font-medium">
                Initializing secure payment gateway...
              </p>
            </div>
          ) : null}

          {/* Script Error Notice */}
          {displayedScriptError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {displayedScriptError}
            </div>
          )}

          {/* Active Payment Form */}
          {isPaymentEnabled && isScriptReady && !displayedScriptError && (
            <form
              onSubmit={
                gatewayProvider === "NMI"
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
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="e.g., Rajesh Sharma"
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-gray-200 focus:border-[#900000] focus:outline-none"
                  disabled={isFormBusy}
                />
                {formValidationErrors.name && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 block">
                    {formValidationErrors.name}
                  </span>
                )}
              </div>

              {/* NMI Specific Email Requirement */}
              {gatewayProvider === "NMI" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Receipt Email Address{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="devotee@example.com"
                    className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-gray-200 focus:border-[#900000] focus:outline-none"
                    disabled={isFormBusy}
                  />
                  {formValidationErrors.email && (
                    <span className="text-[10px] text-red-500 font-semibold mt-1 block">
                      {formValidationErrors.email}
                    </span>
                  )}
                </div>
              )}

              {/* HOSTED SECURE CARD FIELDS */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block">
                  Hosted Card Credentials
                </span>

                {/* Gateway Provider = NMI (Collect.js inline containers) */}
                {gatewayProvider === "NMI" && (
                  <div className="space-y-2.5">
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

                {/* Gateway Provider = MPI (BridgePay TokenPay container) */}
                {gatewayProvider === "MPI" && (
                  <div className="space-y-2">
                    <div
                      id="mpi-card-element"
                      className="w-full min-h-[44px] p-2 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                    <div
                      id="mpi-error-element"
                      className="text-[10px] text-red-500 font-semibold"
                    />
                    <input
                      type="hidden"
                      id="mpi-amount-element"
                      value={payableAmount}
                    />
                  </div>
                )}
              </div>

              {/* Billing Address & ZIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Billing ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={zipcode}
                    onChange={(e) => setZipcode(e.target.value)}
                    placeholder="e.g., 40223"
                    className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-gray-200 focus:border-[#900000] focus:outline-none"
                    disabled={isFormBusy}
                  />
                  {formValidationErrors.zipcode && (
                    <span className="text-[10px] text-red-500 font-semibold mt-1 block">
                      {formValidationErrors.zipcode}
                    </span>
                  )}
                </div>

                {gatewayProvider === "MPI" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Billing Street Address
                    </label>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g., 100 Temple Rd"
                      className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-gray-200 focus:border-[#900000] focus:outline-none"
                      disabled={isFormBusy}
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
                {isSubmitting || isPipelineProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authorizing Payment...</span>
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
  onSuccess: PropTypes.func,
};

export default HostedPaymentModal;
