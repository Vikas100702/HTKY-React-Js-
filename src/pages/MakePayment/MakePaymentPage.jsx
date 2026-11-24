/**
 * @file src/pages/MakePayment/MakePaymentPage.jsx
 * @description Clean, balanced Make a Payment page (`/make-a-payment/:serviceId`).
 * Features a single adaptive CTA button (Add to Cart -> Proceed to Checkout),
 * image lightbox preview, date range, rich description, and temple trust badges
 * with zero redundant buttons or empty whitespace.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  Maximize2,
  X,
  Loader2,
  AlertCircle,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import patternBg from "../../assets/pattern-bg.jpg";
import bgCard from "../../assets/bg-card.png";
import { APP_COLORS } from "../../constants/appColors";
import { useGetServiceDetailById } from "../../hooks/queries/MakePayment/useGetServiceDetailById";
import { useGetClientSettings } from "../../hooks/queries/Donations/useGetDonations";
import { useCartStore } from "../../store/useCartStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useModalStore } from "../../store/useModalStore";
import { useServicesStore } from "../../store/useServicesStore";

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatDateLabel = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return "";
  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return dateStr.trim();
  const m = parseInt(parts[0], 10) - 1;
  const d = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  if (
    Number.isNaN(m) ||
    m < 0 ||
    m > 11 ||
    Number.isNaN(d) ||
    Number.isNaN(y)
  ) {
    return dateStr.trim();
  }
  return `${MONTHS_SHORT[m]} ${String(d).padStart(2, "0")}, ${y}`;
};

const cleanedHTML = (rawHtml) => {
  if (!rawHtml || typeof rawHtml !== "string") return "";
  return rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
};

export const MakePaymentPage = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imgErrorServiceId, setImgErrorServiceId] = useState(null);

  const {
    data: serviceDetail,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetServiceDetailById(serviceId);

  const { data: clientSettings } = useGetClientSettings();
  const currencySymbol = clientSettings?.currencySymbol || "$";

  const cartItems = useCartStore((state) => state.items || []);
  const insertItem = useCartStore(
    (state) => state.insertItem || state.addItem || state.upsertItem,
  );
  const removeItem = useCartStore((state) => state.removeItem);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const openModal = useModalStore((state) => state.openModal);

  const toastMessage = useServicesStore((state) => state.toastMessage);
  const toastType = useServicesStore((state) => state.toastType);
  const clearToast = useServicesStore((state) => state.clearToast);

  useEffect(() => {
    if (!isLightboxOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  const cardService = serviceDetail?.cardService || null;
  const serviceKey = cardService?.id || serviceDetail?.id || "";
  const isAlreadyInCart = Boolean(
    serviceKey &&
    cartItems.some((item) => (item.id || item._id) === serviceKey),
  );

  const handleAddToCart = useCallback(() => {
    const source = cardService || serviceDetail;
    if (!source || !insertItem) return;

    const upperCat = String(
      source.serviceCategoryTypes || "EVENTS",
    ).toUpperCase();
    const isSponsorship = upperCat.includes("SPONSOR");
    const isDonation = upperCat.includes("DONATION");
    const isEvent = upperCat.includes("EVENT");

    insertItem({
      id: source.id,
      title: source.title,
      refDataName: source.title,
      amount: Number(source.amount || 0),
      quantity: isDonation ? 0 : 1,
      qtyCounterEnabled: !isDonation && Boolean(source.qtyCounterEnabled),
      image: source.imageUrl || "",
      category: isSponsorship
        ? "SPONSORSHIP"
        : isDonation
          ? String(source.serviceTypes || "DONATIONS").toUpperCase()
          : isEvent
            ? "EVENT"
            : "SERVICE",
      itemType: isSponsorship
        ? "SPONSORSHIP"
        : isDonation
          ? "DONATION"
          : isEvent
            ? "EVENT"
            : "SERVICE",
      serviceCategoryTypes: source.serviceCategoryTypes || "EVENTS",
      serviceTypes: source.serviceTypes || "",
      dayTypes: source.dayTypes || "",
      selectedDates: source.startDate ? [source.startDate] : [],
      selectedTime: source.startTime || "",
      selectedDiety: "",
      includeSankalpam: source.includeSankalpam || "",
      rawItem: source.rawItem || source,
    });
  }, [cardService, serviceDetail, insertItem]);

  const handleRemoveFromCart = useCallback(() => {
    if (!serviceKey || !removeItem) return;
    removeItem(serviceKey);
  }, [serviceKey, removeItem]);

  const handleProceedToCheckout = useCallback(() => {
    if (cartItems.length === 0) return;

    if (isAuthenticated) {
      navigate("/checkout");
      return;
    }

    openModal("SIGN_IN", {
      requireOtp: false,
      redirectTo: "/checkout",
    });
  }, [cartItems.length, isAuthenticated, navigate, openModal]);

  const startFormatted = formatDateLabel(serviceDetail?.startDate);
  const endFormatted = formatDateLabel(serviceDetail?.endDate);
  const dateRangeLabel =
    startFormatted && endFormatted
      ? `${startFormatted} - ${endFormatted}`
      : startFormatted || endFormatted || "";

  const safeDescriptionHtml = cleanedHTML(serviceDetail?.description);
  const hasBannerImage =
    Boolean(serviceDetail?.imageUrl) && imgErrorServiceId !== serviceId;

  return (
    <div
      className="min-h-[calc(100vh-120px)] flex flex-col justify-center bg-[#fdfbf7] py-10 sm:py-14 relative"
      style={{
        backgroundImage: `url(${patternBg}) `,
        backgroundSize: "cover",
        backgroundRepeat: "repeat",
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-sm animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-medium ${
              toastType === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-amber-50 border-amber-300 text-amber-900"
            }`}
          >
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={clearToast}
              className="text-current opacity-70 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white/95 rounded-2xl border border-amber-200/70 shadow-md p-14 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-10 h-10 text-[#900000] animate-spin mb-3" />
            <p className="text-stone-700 font-semibold text-sm sm:text-base">
              Loading payment details...
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && isError && (
          <div className="bg-white/95 rounded-2xl border border-red-200 shadow-md p-12 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-10 h-10 text-red-600 mb-3" />
            <h2 className="text-lg font-bold text-stone-900 mb-1">
              Unable to Load Payment Details
            </h2>
            <p className="text-sm text-stone-600 max-w-md mb-5">
              {error?.message ||
                "Something went wrong while fetching this service. Please try again."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-6 py-2.5 rounded-lg bg-[#900000] hover:bg-[#750000] text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Not Found State */}
        {!isLoading && !isError && !serviceDetail && (
          <div className="bg-white/95 rounded-2xl border border-amber-200/70 shadow-md p-12 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-10 h-10 text-amber-600 mb-3" />
            <h2 className="text-lg font-bold text-stone-900 mb-1">
              Service Not Found
            </h2>
            <p className="text-sm text-stone-600 max-w-md">
              This payment link may be invalid or the service is no longer
              active.
            </p>
          </div>
        )}

        {/* Main Single-Service Card */}
        {!isLoading && !isError && serviceDetail && (
          <section
            className="bg-white/95 rounded-2xl border border-amber-200/80 shadow-xl overflow-hidden"
            style={{
              backgroundImage: `url(${bgCard})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Top Crimson & Gold Accent Bar */}
            <div
              className="h-2"
              style={{
                background: `linear-gradient(90deg, ${APP_COLORS.primary}, #d97706, ${APP_COLORS.primary})`,
              }}
            />

            <div className="p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Column: Title + Ornamental Divider + Image + View in Large */}
              <div className="lg:col-span-5 flex flex-col items-center text-center">
                <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#900000] tracking-tight leading-snug">
                  {serviceDetail.title}
                </h1>

                <div className="flex items-center justify-center gap-2 my-3 w-48">
                  <span className="h-[1px] flex-1 bg-amber-400" />
                  <span className="w-2 h-2 rotate-45 bg-[#900000]" />
                  <span className="h-[1px] flex-1 bg-amber-400" />
                </div>

                <div className="w-full max-w-[330px] mt-1">
                  {hasBannerImage ? (
                    <>
                      <div
                        onClick={() => setIsLightboxOpen(true)}
                        className="group relative rounded-xl overflow-hidden border-2 border-amber-200/90 shadow-md bg-stone-50 cursor-pointer"
                      >
                        <img
                          src={serviceDetail.imageUrl}
                          alt={serviceDetail.title}
                          onError={() => setImgErrorServiceId(serviceId)}
                          className="w-full h-60 sm:h-64 object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-[#900000] p-2 rounded-full shadow">
                            <Maximize2 className="w-4 h-4" />
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsLightboxOpen(true)}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-[#900000] hover:underline transition-colors cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>View image in large</span>
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-56 rounded-xl border-2 border-amber-200/80 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex flex-col items-center justify-center p-6 shadow-inner">
                      <span className="text-5xl font-serif text-[#900000] mb-2">
                        ॐ
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-amber-800">
                        Hindu Temple of Kentucky
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Date Range + Description + Amount + Single Adaptive CTA */}
              <div className="lg:col-span-7 flex flex-col items-center text-center">
                {dateRangeLabel && (
                  <div className="w-full flex flex-col items-center mb-4">
                    <div className="inline-flex items-center gap-2 text-[#900000] font-serif font-bold text-base sm:text-lg">
                      <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{dateRangeLabel}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-1.5 w-40">
                      <span className="h-[1px] flex-1 bg-amber-300" />
                      <span className="w-1.5 h-1.5 rotate-45 bg-amber-500" />
                      <span className="h-[1px] flex-1 bg-amber-300" />
                    </div>
                  </div>
                )}

                {safeDescriptionHtml ? (
                  <div
                    className="prose prose-sm sm:prose-base max-w-none text-stone-700 leading-relaxed mb-6 w-full text-center"
                    dangerouslySetInnerHTML={{ __html: safeDescriptionHtml }}
                  />
                ) : (
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl mb-6">
                    Complete your sacred contribution for{" "}
                    <span className="font-semibold text-stone-800">
                      {serviceDetail.title}
                    </span>{" "}
                    with devotion. Add to cart below to proceed seamlessly to
                    checkout.
                  </p>
                )}

                {/* Amount & Single Adaptive Button */}
                <div className="w-full max-w-md flex flex-col items-center pt-5 pb-2 px-6 rounded-xl bg-amber-50/50 border border-amber-200/70">
                  <p className="text-xs sm:text-sm font-serif font-bold uppercase tracking-wider text-[#900000]">
                    {serviceDetail.title} Amount
                  </p>
                  <div className="flex items-center justify-center gap-2 my-1.5 w-32">
                    <span className="h-[1px] flex-1 bg-amber-300" />
                    <span className="w-1.5 h-1.5 rotate-45 bg-amber-500" />
                    <span className="h-[1px] flex-1 bg-amber-300" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-stone-900 mb-5">
                    {currencySymbol}
                    {Number(serviceDetail.amount || 0).toFixed(2)}
                  </p>

                  {/* Single Adaptive CTA Button: Add to Cart -> Proceed to Checkout */}
                  {!isAlreadyInCart ? (
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="w-full sm:w-auto min-w-[230px] inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>ADD TO CART</span>
                    </button>
                  ) : (
                    <div className="w-full flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={handleProceedToCheckout}
                        className="w-full sm:w-auto min-w-[250px] inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#900000] hover:bg-[#750000] text-amber-300 font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
                      >
                        <span>PROCEED TO CHECKOUT</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFromCart}
                        className="text-[11px] font-medium text-stone-500 hover:text-red-700 underline transition-colors cursor-pointer"
                      >
                        Remove from cart
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Full-Resolution Image Lightbox Modal */}
      {isLightboxOpen && hasBannerImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={serviceDetail?.title || "Service Flyer Preview"}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl border border-amber-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white text-stone-800 hover:text-[#900000] p-2 rounded-full shadow-md transition-colors cursor-pointer"
              aria-label="Close image preview"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={serviceDetail.imageUrl}
              alt={serviceDetail.title}
              className="max-h-[85vh] w-auto object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MakePaymentPage;
