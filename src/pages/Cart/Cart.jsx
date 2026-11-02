import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/useCartStore";

export const CartPage = () => {
  const navigate = useNavigate();

  const items = useCartStore((state) => state.items);
  const totalCount = useCartStore((state) => state.totalCount);
  const totalAmount = useCartStore((state) => state.totalAmount);
  const currencySymbol = useCartStore((state) => state.currencySymbol || "$");
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const updateCustomAmount = useCartStore((state) => state.updateCustomAmount);
  const clearCart = useCartStore((state) => state.clearCart);
  const showToast = useCartStore((state) => state.showToast);

  const handleProceedToCheckout = () => {
    if (totalCount === 0) {
      showToast(
        "Your cart is empty. Please add offerings to continue.",
        "warning",
      );
      return;
    }
    navigate("/checkout");
  };

  return (
    <section className="w-full min-h-screen bg-[url('/src/assets/pattern-bg.jpg')] bg-no-repeat bg-fill bg-top pb-32">
      {/* 1. Header Banner */}
      <header className="relative text-white py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-200/60 bg-white/40 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#900000] tracking-tight">
              Sacred Offerings Cart
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Review your selected in-temple services, poojas, and charitable
              contributions
            </p>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-semibold text-gray-500 hover:text-red-700 underline transition-colors cursor-pointer"
            >
              Clear Entire Cart
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="text-center py-20 bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200 p-8 shadow-xs max-w-xl mx-auto">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-700 font-serif text-2xl font-bold mb-4">
              ॐ
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Your Cart is Empty
            </h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              You have not selected any services or donations yet. Explore our
              temple services or support the temple through general funds.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/services"
                className="px-5 py-2.5 rounded-xl bg-[#900000] text-amber-300 font-bold text-xs uppercase tracking-wider hover:bg-[#7a0000] transition-all shadow-xs"
              >
                Book Services
              </Link>
              <Link
                to="/donations/general"
                className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-all shadow-xs"
              >
                Make a Donation
              </Link>
            </div>
          </div>
        ) : (
          /* Cart Item List & Order Summary */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const isDonation = item.itemType === "DONATION";
                const isFlexible = Boolean(item.isAnyAmount);

                return (
                  <article
                    key={item.id}
                    className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                  >
                    {/* Item Information */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md ${
                            isDonation
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-[#900000]"
                          }`}
                        >
                          {item.itemType || "SERVICE"}
                        </span>
                        {item.category && (
                          <span className="text-xs text-gray-400 font-medium">
                            • {item.category}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                        {item.title}
                      </h3>

                      {/* Service Booking Metadata Pills */}
                      {!isDonation &&
                        (item.selectedDate ||
                          item.selectedTime ||
                          item.selectedDiety) && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {item.selectedDate && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md text-gray-700">
                                📅{" "}
                                {new Date(
                                  item.selectedDate,
                                ).toLocaleDateString()}
                              </span>
                            )}
                            {item.selectedTime && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md text-gray-700">
                                🕒 {item.selectedTime}
                              </span>
                            )}
                            {item.selectedDiety && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-amber-900">
                                🪔 {item.selectedDiety}
                              </span>
                            )}
                          </div>
                        )}
                    </div>

                    {/* Quantity or Custom Amount Controls */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      {isFlexible ? (
                        /* Flexible Custom Amount Editor for Donations */
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-gray-500 text-sm">
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={item.amount || ""}
                            onChange={(e) =>
                              updateCustomAmount(item.id, e.target.value)
                            }
                            aria-label={`Custom donation amount for ${item.title}`}
                            className="w-24 px-2 py-1 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#900000]"
                          />
                        </div>
                      ) : (
                        /* Stepper Quantity for Standard Services & Offerings */
                        <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden shadow-xs">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1),
                              )
                            }
                            className="px-2.5 py-1 text-gray-600 hover:bg-gray-200 transition-colors font-bold text-xs"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="px-3 py-1 text-xs font-bold text-gray-800 bg-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="px-2.5 py-1 text-gray-600 hover:bg-gray-200 transition-colors font-bold text-xs"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      )}

                      {/* Subtotal Line */}
                      <div className="flex items-center gap-3">
                        <span className="font-serif font-bold text-base sm:text-lg text-gray-900">
                          {currencySymbol}
                          {(
                            (Number(item.amount) || 0) *
                            (Number(item.quantity) || 1)
                          ).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer rounded-md hover:bg-red-50"
                          title="Remove item"
                          aria-label={`Remove ${item.title}`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Summary Box */}
            <aside
              role="complementary"
              aria-label="Cart Summary"
              className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-6 shadow-sm h-fit space-y-6"
            >
              <h2 className="text-lg font-serif font-bold text-gray-900 border-b border-gray-100 pb-3">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Total Items</span>
                  <span className="font-bold text-gray-900">{totalCount}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax / Administrative Fees</span>
                  <span className="font-semibold text-gray-500">
                    None (Exempt)
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-base text-gray-900">
                    Estimated Total
                  </span>
                  <span className="font-serif font-bold text-2xl text-[#900000]">
                    {currencySymbol}
                    {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={totalCount === 0}
                className="w-full py-3.5 rounded-xl bg-[#900000] text-amber-300 hover:bg-[#7a0000] font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <span aria-hidden="true">→</span>
              </button>

              <p className="text-[11px] text-gray-400 text-center leading-normal">
                By continuing, you will proceed to the secure temple payment
                gateway. All transactions are tax-deductible according to temple
                regulations.
              </p>
            </aside>
          </div>
        )}
      </main>
    </section>
  );
};
