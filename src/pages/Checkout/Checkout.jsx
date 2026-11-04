import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/useCartStore";
import { useDevoteeProfile } from "../../hooks/queries/Profile/useDevoteeProfile";
import { FamilySankalpamForm } from "../../components/profile/FamilySankalpamForm";
import { decodeBase64 } from "../../utils/base64";
import {
  Trash2,
  User,
  CreditCard,
  ShieldCheck,
  Plus,
  Minus,
  Sparkles,
  Calendar,
  Clock,
  HeartHandshake,
  Lock,
  ArrowRight,
} from "lucide-react";

const QUICK_DONATIONS = [11, 21, 51, 101];

export const Checkout = () => {
  const navigate = useNavigate();

  // Cart Global State
  const items = useCartStore((state) => state.items || []);
  const totalCount = useCartStore((state) => state.totalCount || 0);
  const totalAmount = useCartStore((state) => state.totalAmount || 0);
  const currencySymbol = useCartStore((state) => state.currencySymbol || "$");
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  // Reusable Devotee Profile Controller Hook (Shared with Profile Flow)
  const {
    devoteeProfile,
    gotras,
    nakshatras,
    formData: sankalpamData,
    errors,
    isLoading: isProfileLoading,
    isSaving: isSankalpamSaving,
    updateField,
    addFamilyMember,
    removeFamilyMember,
    updateFamilyMember,
    validate,
    saveSankalpam,
  } = useDevoteeProfile();

  // Sankalpam Check (Only required if any item has includeSankalpam === "YES")
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

  // Local States
  const [additionalDonation, setAdditionalDonation] = useState("");
  const [notes, setNotes] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Quantity Steppers
  const handleIncreaseQty = (item) => {
    const currentQty = Number(item.quantity) || 1;
    updateQuantity(item.id, currentQty + 1);
  };

  const handleDecreaseQty = (item) => {
    const currentQty = Number(item.quantity) || 1;
    if (currentQty <= 1) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, currentQty - 1);
    }
  };

  // Payable Amount Calculations
  const parsedDonation = Math.max(0, parseFloat(additionalDonation) || 0);
  const finalPayable = (Number(totalAmount) || 0) + parsedDonation;

  // Proceed to Pay: Saves Sankalpam First, then triggers Payment Gateway
  const handleProceedPayment = async (e) => {
    e.preventDefault();

    // If Sankalpam is mandatory, validate the form first.
    if (isSankalpamRequired) {
      const isValid = validate();
      if (!isValid) {
        return;
      }
    }

    try {
      setIsProcessingPayment(true);

      // First, send the Sankalpam form data to the save/update API.
      if (isSankalpamRequired) {
        const saveResponse = await saveSankalpam();
        if (
          saveResponse?.statusCode !== "1" &&
          saveResponse?.statusCode !== 1
        ) {
          alert(
            saveResponse?.message ||
              "Failed to save Sankalpam details. Please verify your entries.",
          );
          setIsProcessingPayment(false);
          return;
        }
      }

      // Trigger the payment gateway after saving Sankalpam.
      // (Next step: execute the payment script, open the modal, or redirect.)
      console.log("[HTKY_CHECKOUT_SUCCESS_PAYLOAD]", {
        items,
        sankalpam: isSankalpamRequired ? sankalpamData : null,
        additionalDonation: parsedDonation,
        totalPayable: finalPayable,
        notes,
      });

      alert(
        `Sankalpam saved successfully! Ready to initialize Payment Gateway for ${currencySymbol}${finalPayable.toFixed(2)}.`,
      );
    } catch (error) {
      console.error("[HTKY_APM][CHECKOUT_SAVE_ERROR]", error);
      alert(
        "An error occurred while saving Sankalpam information. Please try again.",
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <div className="bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-sm border border-amber-200/50 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-[#900000] rounded-2xl flex items-center justify-center mx-auto text-2xl font-serif font-bold mb-4">
            ॐ
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
            Cart is Empty
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Explore our auspicious pooja services and temple seva offerings.
          </p>
          <Link
            to="/services"
            className="inline-flex items-center justify-center gap-2 w-full bg-[#900000] text-amber-300 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#7a0000] transition-colors shadow-sm"
          >
            Explore Services <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const isActionLoading = isSankalpamSaving || isProcessingPayment;

  return (
    <div className="min-h-screen bg-[#faf8f5] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#900000]" />
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
            className="self-start sm:self-auto px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
          >
            Continue Browsing ✕
          </button>
        </div>

        <form
          onSubmit={handleProceedPayment}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          
          {/* SANKALPAM FORM + ORDER SUMMARY */}        
          <div className="lg:col-span-7 space-y-6">
            {/* SHARED FAMILY SANKALPAM COMPONENT */}
            {isSankalpamRequired && (
              <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-amber-300/80 relative">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-amber-100 text-amber-900 font-bold">
                      ॐ
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
                  errors={errors}
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
                  <span className="p-2 rounded-xl bg-red-50 text-[#900000]">
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
                  className="text-xs text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Clear Cart
                </button>
              </div>

              {/* Items List with Stepper */}
              <div className="divide-y divide-gray-100">
                {items.map((item) => {
                  const qty = Number(item.quantity) || 1;
                  const unitPrice = Number(item.amount) || 0;
                  const itemTotal = unitPrice * qty;

                  return (
                    <div
                      key={item.id}
                      className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1 space-y-1.5">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/60 uppercase tracking-wide">
                          {item.category || item.itemType || "SEVA"}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                          {item.title}
                        </h3>

                        {(item.selectedDate || item.selectedTime) && (
                          <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-gray-600">
                            {item.selectedDate && (
                              <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {new Date(
                                  item.selectedDate,
                                ).toLocaleDateString()}
                              </span>
                            )}
                            {item.selectedTime && (
                              <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3 text-gray-400" />
                                {item.selectedTime}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5">
                        <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleDecreaseQty(item)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors shadow-2xs cursor-pointer"
                            title={
                              qty === 1 ? "Remove Item" : "Decrease Quantity"
                            }
                          >
                            {qty === 1 ? (
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-gray-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncreaseQty(item)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-gray-700 hover:bg-gray-100 hover:text-emerald-700 transition-colors shadow-2xs cursor-pointer"
                            title="Increase Quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right min-w-[75px]">
                          <span className="text-sm sm:text-base font-serif font-bold text-gray-900">
                            {currencySymbol}
                            {itemTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">
                  Items Subtotal
                </span>
                <span className="font-bold text-gray-900">
                  {currencySymbol}
                  {Number(totalAmount).toFixed(2)}
                </span>
              </div>
            </div>

            {/* SPECIAL SANKALPAM NOTES */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/80">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Special Sankalpam Instructions / Gotra Names
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention any additional family names, specific sankalpam intent, or pooja instructions..."
                className="w-full text-xs p-3.5 bg-gray-50/50 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#900000] transition-all"
              />
            </div>
          </div>

          
          {/* PROFILE + DONATION + DUMMY CARD */}
          
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-200/80 space-y-5">
              {/* Devotee Info Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-900">
                      {devoteeProfile?.refDataName ||
                        `${sankalpamData.firstName || ""} ${sankalpamData.lastName || ""}`.trim() ||
                        "DEVOTEE"}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {devoteeProfile?.email
                        ? decodeBase64(devoteeProfile.email)
                        : "devotee@example.com"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-gray-700 block">
                    {devoteeProfile?.phone || ""}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    Signed In
                  </span>
                </div>
              </div>

              {/* Additional Donation */}
              <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-[#900000]" />
                    Support Temple Fund
                  </span>
                  <span className="text-[11px] text-gray-400">Optional</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {QUICK_DONATIONS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAdditionalDonation(String(amt))}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        parsedDonation === amt
                          ? "bg-[#900000] text-amber-300 border-[#900000] shadow-2xs"
                          : "bg-white text-gray-700 border-gray-200 hover:border-amber-300"
                      }`}
                    >
                      +${amt}
                    </button>
                  ))}
                </div>

                <div className="relative pt-1">
                  <span className="absolute left-3 top-3 text-xs font-bold text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={additionalDonation}
                    onChange={(e) => setAdditionalDonation(e.target.value)}
                    placeholder="Custom donation amount"
                    className="w-full pl-7 pr-3 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#900000]"
                  />
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Pooja Offerings Subtotal</span>
                  <span>
                    {currencySymbol}
                    {Number(totalAmount).toFixed(2)}
                  </span>
                </div>
                {parsedDonation > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                    <span>Additional Temple Donation</span>
                    <span>
                      +{currencySymbol}
                      {parsedDonation.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-900">
                    Final Amount to Pay:
                  </span>
                  <span className="text-2xl sm:text-3xl font-serif font-extrabold text-[#900000]">
                    {currencySymbol}
                    {finalPayable.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* DUMMY CARD DETAILS PLACEHOLDER */}
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#900000]" />
                    Card Details
                  </span>
                  <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                    Gateway Ready
                  </span>
                </div>

                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/60 space-y-2 opacity-85">
                  <div className="text-xs text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2.5 font-mono">
                    •••• •••• •••• ••••
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-xs text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2">
                      MM / YY
                    </div>
                    <div className="text-xs text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2">
                      CVV
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/60 flex items-center justify-between text-xs text-gray-600">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked
                      readOnly
                      className="rounded text-[#900000]"
                    />
                    I am offering with devotion
                  </label>
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isActionLoading}
                className="w-full py-3.5 bg-[#900000] text-amber-300 hover:bg-[#7a0000] rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                {isActionLoading
                  ? "Saving Sankalpam Details..."
                  : `Proceed to Pay ${currencySymbol}${finalPayable.toFixed(2)}`}
              </button>

              <p className="text-[10px] text-gray-400 text-center">
                All donations are tax-exempt according to temple regulations.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
