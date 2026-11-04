import { useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/useCartStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useModalStore } from "../../store/useModalStore";

export const CommonCartFooter = ({
  checkoutPath = "/checkout",
  buttonLabel = "Proceed to Checkout",
  onCheckoutClick = null,
}) => {
  const navigate = useNavigate();

  // Global Stores
  const totalCount = useCartStore((state) => state.totalCount);
  const totalAmount = useCartStore((state) => state.totalAmount);
  const currencySymbol = useCartStore((state) => state.currencySymbol || "$");
  const showToast = useCartStore((state) => state.showToast);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const openModal = useModalStore((state) => state.openModal);

  const handleProceedToCheckout = () => {
    // Cart Empty Check
    if (totalCount === 0) {
      if (typeof showToast === "function") {
        showToast(
          "Please select at least one service or offering to proceed.",
          "warning",
        );
      } else {
        alert("Please select at least one service or offering to proceed.");
      }
      return;
    }

    // Signin Mandatory
    if (!isAuthenticated) {
      openModal("SIGN_IN");
      return;
    }

    // Navigate to Checkout
    if (typeof onCheckoutClick === "function") {
      onCheckoutClick();
      return;
    }

    navigate(checkoutPath);
  };

  return (
    <aside
      role="region"
      aria-label="Shopping Cart Summary"
      className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl py-3.5 px-4 sm:px-8 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Cart Item Count & Total */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 font-extrabold text-sm shrink-0 shadow-xs"
            aria-label={`${totalCount} items in cart`}
          >
            {totalCount}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Total Amount
            </span>
            <span className="text-lg sm:text-2xl font-serif font-bold text-gray-900 leading-tight">
              {currencySymbol}
              {Number(totalAmount || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          type="button"
          onClick={handleProceedToCheckout}
          disabled={totalCount === 0}
          className={`px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
            totalCount > 0
              ? "bg-[#900000] text-amber-300 hover:bg-[#7a0000] active:scale-95 shadow-amber-900/10"
              : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
          }`}
        >
          <span>{buttonLabel}</span>
          <span
            aria-hidden="true"
            className="text-base sm:text-lg leading-none"
          >
            →
          </span>
        </button>
      </div>
    </aside>
  );
};
