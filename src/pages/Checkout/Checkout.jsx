import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/useCartStore";

export const Checkout = () => {
  const navigate = useNavigate();

  // Cart Store Selectors
  const items = useCartStore((state) => state.items);
  const totalCount = useCartStore((state) => state.totalCount);
  const totalAmount = useCartStore((state) => state.totalAmount);
  const currencySymbol = useCartStore((state) => state.currencySymbol || "$");
  const clearCart = useCartStore((state) => state.clearCart);
  const showToast = useCartStore((state) => state.showToast);

  // Devotee Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gotra: "",
    nakshatra: "",
    address: "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim())
      errors.firstName = "First name is required.";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = "Valid email address is required.";
    }

    const phoneRegex = /^[0-9+\-\s()]{7,15}$/;
    if (!formData.phone.trim() || !phoneRegex.test(formData.phone.trim())) {
      errors.phone = "Valid phone number is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Payment Submission Handler
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (totalCount === 0) {
      showToast(
        "Your cart is empty. Please add services or offerings first.",
        "warning",
      );
      return;
    }

    if (!validateForm()) {
      showToast("Please correct the highlighted form errors.", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      // In production, formulate payload and call payment mutation (e.g. Stripe / Square session)
      const bookingPayload = {
        devotee: formData,
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          amount: item.amount,
          quantity: item.quantity,
          itemType: item.itemType,
          selectedDate: item.selectedDate || null,
          selectedTime: item.selectedTime || null,
          selectedDiety: item.selectedDiety || null,
        })),
        totalAmount,
        currencySymbol,
        submittedAt: new Date().toISOString(),
      };

      console.log("[HTKY_CHECKOUT_SUBMIT]", bookingPayload);

      // Simulation of gateway response
      await new Promise((resolve) => setTimeout(resolve, 1500));

      clearCart();
      showToast("Booking/Donation submitted successfully!", "success");
      navigate("/services");
    } catch (err) {
      console.error("[HTKY_CHECKOUT_ERROR]", err);
      showToast("Payment processing failed. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty Cart Guard
  if (items.length === 0) {
    return (
      <section className="w-full min-h-screen bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top py-20 px-4">
        <div className="max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-700 font-serif text-2xl font-bold mb-4">
            ॐ
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            No Items to Checkout
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Your sacred offerings cart is currently empty.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/services"
              className="px-5 py-2.5 rounded-xl bg-[#900000] text-amber-300 font-bold text-xs uppercase tracking-wider hover:bg-[#7a0000] transition-all shadow-xs"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full min-h-screen bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top pb-24">
      {/* Header Banner */}
      <header className="relative text-white py-6 px-4 sm:px-6 lg:px-8 border-b border-gray-200/60 bg-white/40 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#900000] tracking-tight">
              Checkout & Confirmation
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Provide devotee contact details to complete your temple offerings
            </p>
          </div>
          <Link
            to="/cart"
            className="text-xs font-semibold text-[#900000] hover:underline flex items-center gap-1"
          >
            ← Back to Cart
          </Link>
        </div>
      </header>

      {/* Main Grid: Form Left, Order Review Right */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <form
          onSubmit={handlePaymentSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left 2 Columns: Devotee & Contact Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
              <h2 className="text-base sm:text-lg font-serif font-bold text-gray-900 border-b border-gray-100 pb-2">
                1. Devotee Contact Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#900000] ${
                      formErrors.firstName
                        ? "border-red-400 bg-red-50/30"
                        : "border-gray-200"
                    }`}
                    placeholder="Enter first name"
                  />
                  {formErrors.firstName && (
                    <p className="text-xs text-red-500 mt-1">
                      {formErrors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#900000] ${
                      formErrors.lastName
                        ? "border-red-400 bg-red-50/30"
                        : "border-gray-200"
                    }`}
                    placeholder="Enter last name"
                  />
                  {formErrors.lastName && (
                    <p className="text-xs text-red-500 mt-1">
                      {formErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#900000] ${
                      formErrors.email
                        ? "border-red-400 bg-red-50/30"
                        : "border-gray-200"
                    }`}
                    placeholder="devotee@example.com"
                  />
                  {formErrors.email && (
                    <p className="text-xs text-red-500 mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#900000] ${
                      formErrors.phone
                        ? "border-red-400 bg-red-50/30"
                        : "border-gray-200"
                    }`}
                    placeholder="+1 (555) 000-0000"
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">
                      {formErrors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Sankalpam Details */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <h2 className="text-base sm:text-lg font-serif font-bold text-gray-900 border-b border-gray-100 pb-2">
                2. Sankalpam / Ritual Information (Optional)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Gotra
                  </label>
                  <input
                    type="text"
                    name="gotra"
                    value={formData.gotra}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#900000]"
                    placeholder="e.g. Kashyapa, Bharadwaja"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nakshatra
                  </label>
                  <input
                    type="text"
                    name="nakshatra"
                    value={formData.nakshatra}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#900000]"
                    placeholder="e.g. Rohini, Ashwini"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Special Pooja Notes / Names of Family Members
                </label>
                <textarea
                  rows="2"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#900000]"
                  placeholder="Enter family names or specific seva instructions..."
                />
              </div>
            </div>
          </div>

          {/* Right Column: Order Review & Payment Gateway Trigger */}
          <aside
            role="complementary"
            aria-label="Order Checkout Review"
            className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-6 shadow-sm h-fit space-y-5"
          >
            <h2 className="text-base sm:text-lg font-serif font-bold text-gray-900 border-b border-gray-100 pb-2">
              Order Review ({totalCount})
            </h2>

            {/* Compact Item Breakdown */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start text-xs border-b border-gray-50 pb-2"
                >
                  <div className="pr-2">
                    <p className="font-semibold text-gray-800 leading-tight">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Qty: {item.quantity || 1}{" "}
                      {item.selectedTime ? `• ${item.selectedTime}` : ""}
                    </p>
                  </div>
                  <span className="font-bold text-gray-900 shrink-0">
                    {currencySymbol}
                    {(
                      (Number(item.amount) || 0) * (Number(item.quantity) || 1)
                    ).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-2 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-gray-900">Total Payable</span>
                <span className="font-serif font-bold text-2xl text-[#900000]">
                  {currencySymbol}
                  {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting || totalCount === 0}
              className="w-full py-3.5 rounded-xl bg-[#900000] text-amber-300 hover:bg-[#7a0000] font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <span>Processing Payment...</span>
              ) : (
                <>
                  <span>Pay & Complete Booking</span>
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-gray-400 text-center leading-normal">
              🔒 Encrypted 256-bit SSL transaction. Official tax deduction
              receipts will be dispatched to the provided email.
            </p>
          </aside>
        </form>
      </main>
    </section>
  );
};
