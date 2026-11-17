/**
 * @file src/pages/Membership/MembershipPage.jsx
 * @description Temple Membership Plans Page.
 * Performs real-time gateway checks via global usePaymentGateway hook, fetches
 * membership plans, and triggers the standalone secure MembershipCheckoutModal.
 *
 * Strict Tech Stack: Pure ES6+ JavaScript (NO TypeScript), Tailwind CSS, TanStack Query.
 * Aligns strictly with Non-Negotiables #1, #2, #3, #4, and #5.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, X, AlertCircle, RefreshCw } from "lucide-react";
import membershipImg from "../../assets/membership.png";
import { useMembershipSettings } from "../../hooks/queries/Membership/useMembershipSettings";
import { usePaymentGateway } from "../../hooks/queries/Common/usePaymentGateway";
import { MembershipCheckoutModal } from "../../components/Membership/MembershipCheckoutModal";

export const MembershipPage = () => {
  const navigate = useNavigate();

  // 1. Fetch Membership Plans from Settings API
  const { plans, isLoading, isError, refetch } = useMembershipSettings();

  // 2. Consume Global Payment Gateway Settings & Status
  const { isPaymentEnabled, downReason, isSettingsLoading } =
    usePaymentGateway();

  // Modal States
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPlanForBenefits, setSelectedPlanForBenefits] = useState(null);
  const [pageError, setPageError] = useState("");

  // Escape key handler for benefit modal
  useEffect(() => {
    if (!selectedPlanForBenefits) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedPlanForBenefits(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPlanForBenefits]);

  const handleOpenEnrollModal = (plan) => {
    // Check backend payment kill-switch (paymentGatewayoffon -> WEBSITE -> isenable)
    if (!isPaymentEnabled) {
      setPageError(
        downReason || "Payment service is currently down for maintenance.",
      );
      return;
    }
    setPageError("");
    setSelectedPlan(plan);
  };

  // Callback after successful MPI payment charge + `addMemberShip` registration
  const handlePaymentSuccess = (paymentResult) => {
    setSelectedPlan(null);
    const reconciledInvoice =
      paymentResult?.invoiceNo ||
      paymentResult?.referenceNumber ||
      String(Date.now());

    navigate("/checkout/success", {
      state: {
        invoiceNo: reconciledInvoice,
        transactionId:
          paymentResult?.transactionId || `MEM-TRX-${reconciledInvoice}`,
        paymentSource: "MPI_CARD_NOT_PRESENT",
        totalAmount: paymentResult?.membershipPlan?.price || 0,
        items: [
          {
            id: paymentResult?.membershipPlan?.id,
            name:
              paymentResult?.membershipPlan?.rawName ||
              paymentResult?.membershipPlan?.displayName,
            amount: paymentResult?.membershipPlan?.price || 0,
            quantity: 1,
          },
        ],
        devoteeName: paymentResult?.name,
        devoteeEmail: paymentResult?.email,
      },
      replace: true,
    });
  };

  if (isLoading || isSettingsLoading) {
    return (
      <main
        className="max-w-4xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse"
        role="main"
        aria-label="Loading Membership Plans"
      >
        {[1, 2].map((skeleton) => (
          <div
            key={skeleton}
            className="h-[460px] bg-stone-200/80 rounded-xl shadow-sm"
          />
        ))}
      </main>
    );
  }

  if (isError) {
    return (
      <main
        className="max-w-xl mx-auto my-12 p-6 bg-white rounded-2xl border border-red-200 text-center space-y-4 shadow-sm"
        role="main"
      >
        <AlertCircle className="w-10 h-10 text-[#900000] mx-auto" />
        <h1 className="text-lg font-serif font-bold text-[#900000]">
          Unable to Load Membership Plans
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          We encountered a temporary issue retrieving temple membership options.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#900000] text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </main>
    );
  }

  return (
    <main
      className="w-full min-h-[75vh] bg-[#faf8f5] py-10 px-4 sm:px-6 lg:px-8"
      role="main"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Global Down Notice if payment is disabled */}
        {!isPaymentEnabled && (
          <div
            className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2.5 shadow-xs"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            <span>
              {downReason ||
                "Online membership payment services are temporarily offline."}
            </span>
          </div>
        )}

        {pageError && (
          <div
            className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start gap-2"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{pageError}</span>
          </div>
        )}

        {plans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-sm text-stone-600 shadow-xs">
            No active membership plans are configured at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {plans.map((plan) => {
              const isLifetime = plan.isLifetime;
              const accentBgClass = isLifetime
                ? "bg-[#900000]"
                : "bg-[#eab308]";
              const priceTextClass = isLifetime
                ? "text-[#900000]"
                : "text-[#0284c7]";
              const buttonClass = isLifetime
                ? "bg-[#900000] hover:bg-[#780000] text-white"
                : "bg-[#eab308] hover:bg-[#ca8a04] text-stone-950";

              return (
                <article
                  key={plan.id}
                  className="bg-white rounded-lg shadow-md border border-stone-200/80 overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1"
                >
                  <div>
                    <div className="relative h-36 w-full overflow-hidden">
                      <div
                        className={`absolute inset-x-0 top-0 h-28 ${accentBgClass}`}
                      />
                      <div className="absolute inset-x-[-15%] top-16 h-28 bg-white rounded-t-[100%]" />
                      <div className="relative z-10 flex justify-center pt-7">
                        <img
                          src={membershipImg}
                          alt={plan.displayName}
                          className="w-24 h-24 object-contain drop-shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="px-6 pt-2 pb-6 text-center space-y-3">
                      <h2 className="text-xl sm:text-2xl font-bold text-[#900000] tracking-tight">
                        {plan.displayName}
                      </h2>

                      <p
                        className={`text-2xl sm:text-3xl font-extrabold ${priceTextClass}`}
                      >
                        {plan.formattedPrice}
                      </p>

                      <div className="pt-1 space-y-1">
                        <p className="text-xs sm:text-sm text-stone-700">
                          {plan.description}
                        </p>
                        {plan.benefits.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedPlanForBenefits(plan)}
                            className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium text-[#900000] underline underline-offset-4 hover:opacity-80 cursor-pointer"
                          >
                            <span>View Membership Benefits</span>
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>

                      {plan.isCumulativeApplied && plan.cumulativeNote && (
                        <div className="pt-2 space-y-1">
                          <p className="text-xs sm:text-sm text-stone-700 max-w-[240px] mx-auto leading-snug">
                            {plan.cumulativeNote}
                          </p>
                          <p className="text-sm font-bold text-[#900000] uppercase">
                            OR
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="px-6 pb-7 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleOpenEnrollModal(plan)}
                        disabled={!isPaymentEnabled}
                        className={`px-8 py-2.5 rounded-md text-xs sm:text-sm font-bold tracking-wide shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${buttonClass}`}
                      >
                        Enroll Now
                      </button>
                    </div>
                    <div className={`h-3 w-full ${accentBgClass}`} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= STANDALONE MEMBERSHIP CHECKOUT MODAL ================= */}
      <MembershipCheckoutModal
        isOpen={Boolean(selectedPlan)}
        onClose={() => setSelectedPlan(null)}
        membershipPlan={selectedPlan}
        onSuccess={handlePaymentSuccess}
      />

      {/* ================= VIEW MEMBERSHIP BENEFITS MODAL ================= */}
      {selectedPlanForBenefits && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="membership-benefits-modal-title"
          onClick={() => setSelectedPlanForBenefits(null)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between gap-4">
              <h3
                id="membership-benefits-modal-title"
                className="text-base sm:text-lg font-medium text-stone-900"
              >
                {selectedPlanForBenefits.description}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedPlanForBenefits(null)}
                aria-label="Close Membership Benefits"
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">
              <ul className="list-disc pl-5 space-y-2.5 text-xs sm:text-sm text-stone-800 leading-relaxed">
                {selectedPlanForBenefits.benefits.map((benefit, idx) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};;

export default MembershipPage;
