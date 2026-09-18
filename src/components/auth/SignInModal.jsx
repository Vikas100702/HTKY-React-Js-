import { useEffect, useState } from "react";
import { X, AlertCircle, Info, Loader2 } from "lucide-react";
import { PhoneInputField } from "../ui/PhoneInputField";
import { useSignInController } from "../../hooks/queries/Auth/useSignInController";

export const SignInModal = ({ isOpen, onClose, logoUrl }) => {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+1");

  const { handleSignInSequence, isLoading, error, registrationMsg } =
    useSignInController();

  // Handle Viewport Scroll Lock & Escape Key Listeners
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && typeof onClose === "function" && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    await handleSignInSequence({
      email: email.trim(),
      phone: phone, // Already stripped of dial code by PhoneInputField
      countryCode: countryCode, // Stored for future session needs
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-modal-title"
    >
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={() => !isLoading && onClose()}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[400px] bg-white bg-[url('/src/assets/bg-card.png')] bg-cover bg-center shadow-2xl animate-in zoom-in-95 duration-200 rounded-md border border-gray-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          disabled={isLoading}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 bg-white/60 hover:bg-gray-100 p-1.5 rounded-full transition-all focus:outline-none disabled:opacity-50"
          aria-label="Close sign in dialog"
        >
          <X className="w-5 h-5 stroke-[2]" />
        </button>

        <div className="p-8 flex flex-col items-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="HTKY Logo"
              className="w-24 h-24 object-contain mb-2 drop-shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#900000] font-serif font-bold text-3xl mb-2 shadow-sm">
              ॐ
            </div>
          )}

          <h2
            id="signin-modal-title"
            className="text-[#900000] text-lg font-black font-sans uppercase tracking-widest mt-1 mb-1"
          >
            Sign In
          </h2>
          <div className="w-24 h-[1px] bg-amber-400 mb-4" />

          {/* Dynamic Feedback Banners */}
          {error && (
            <div className="w-full flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-md border border-red-100 mb-4 animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-medium leading-tight">{error}</p>
            </div>
          )}

          {registrationMsg && (
            <div className="w-full flex items-start gap-2 bg-blue-50 text-blue-800 p-3 rounded-md border border-blue-100 mb-4 animate-in slide-in-from-top-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="text-xs font-medium leading-tight">
                {registrationMsg}
                <a
                  href="/register"
                  className="block mt-1.5 font-bold underline hover:text-blue-900 transition-colors"
                >
                  Click here to Register
                </a>
              </div>
            </div>
          )}

          <form
            className="w-full flex flex-col items-center"
            onSubmit={handleFormSubmit}
          >
            <button
              type="button"
              className="w-full bg-[#900000] hover:bg-[#7a0000] text-white text-[15px] font-semibold py-2.5 rounded shadow-sm transition-all mb-5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#900000]"
            >
              Devotee
            </button>

            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email Id."
              disabled={isLoading}
              className="w-full border border-gray-300 rounded px-3 py-2.5 text-[15px] text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#900000] focus:ring-1 focus:ring-[#900000] transition-colors mb-4 bg-white/95 disabled:bg-gray-100 disabled:opacity-70"
            />

            <div className="flex items-center justify-center w-full mb-4">
              <span className="text-gray-900 text-[14px] font-medium px-2 bg-white/50 rounded">
                --OR--
              </span>
            </div>

            <div className="w-full mb-8 relative z-50">
              <PhoneInputField
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onCountryChange={(code) => setCountryCode(code)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative flex items-center justify-center bg-[#900000] hover:bg-[#7a0000] text-white text-[15px] font-semibold py-2 px-12 rounded-md shadow-md transition-all mb-6 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#900000] disabled:bg-[#7a0000] disabled:cursor-not-allowed w-40 h-10"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "LOGIN"
              )}
            </button>

            <p className="text-[14px] text-gray-900 font-medium">
              New User?{" "}
              <a
                href="/register"
                className="text-[#900000] font-bold hover:underline transition-all ml-1"
              >
                Register
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
