import { useEffect, useState, useRef, useCallback } from "react";
import {
  X,
  AlertCircle,
  Info,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Mail,
  Phone,
} from "lucide-react";
import { PhoneInputField } from "../ui/PhoneInputField";
import { useSignInController } from "../../hooks/queries/Auth/useSignInController";
import { useModalStore } from "../../store/useModalStore";

const SignInModalContent = ({ onClose, logoUrl }) => {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [otpCode, setOtpCode] = useState("");

  const [activeField, setActiveField] = useState(null);

  const emailInputRef = useRef(null);
  const phoneContainerRef = useRef(null);
  const otpInputRef = useRef(null);

  const isEmailDead = activeField === "phone";
  const isPhoneDead = activeField === "email";

  const openModal = useModalStore((state) => state.openModal);

  const {
    handleSignInSequence,
    handleSendEmailOtp,
    handleVerifyEmailOtp,
    handleVerifyPhoneOtp,
    resetOtpFlow,
    otpChannel,
    isOtpSent,
    otpTarget,
    isLoading,
    isSendingOtp,
    isVerifyingOtp,
    error,
    registrationMsg,
  } = useSignInController();

  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose?.();
  }, [isLoading, onClose]);

  const handleSwitchToRegister = (e) => {
    e.preventDefault();
    if (isLoading) return;
    handleClose();
    openModal("REGISTER", { logoUrl });
  };

  useEffect(() => {
    if (isOtpSent) {
      const timer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOtpSent]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isLoading) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoading, handleClose]);

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (val.trim().length > 0) {
      setActiveField("email");
    } else {
      setActiveField(null);
    }
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPhone(val);
    if (val && String(val).trim().length > 0) {
      setActiveField("phone");
    } else {
      setActiveField(null);
    }
  };

  const handleEmailTap = () => {
    if (!isEmailDead) return;
    setPhone("");
    setActiveField("email");
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 0);
  };

  const handlePhoneTap = () => {
    if (!isPhoneDead) return;
    setEmail("");
    setActiveField("phone");
    setTimeout(() => {
      const input = phoneContainerRef.current?.querySelector("input");
      input?.focus();
    }, 0);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (isOtpSent) {
      if (otpChannel === "email") {
        await handleVerifyEmailOtp(otpCode, otpTarget || email);
      } else if (otpChannel === "phone") {
        await handleVerifyPhoneOtp(otpCode);
      }
      return;
    }

    await handleSignInSequence({
      email: isEmailDead ? "" : email.trim(),
      phone: isPhoneDead ? "" : phone,
      countryCode: countryCode,
      code: otpCode,
    });
  };

  const handleResendOtp = async () => {
    if (isLoading || !otpTarget) return;
    setOtpCode("");
    if (otpChannel === "email") {
      await handleSendEmailOtp(otpTarget);
    }
  };

  const handleChangeTarget = () => {
    if (isLoading) return;
    setOtpCode("");
    resetOtpFlow?.();
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
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[400px] bg-white bg-[url('/src/assets/bg-card.png')] bg-cover bg-center shadow-2xl animate-in zoom-in-95 duration-200 rounded-md border border-gray-200">
        <button
          onClick={handleClose}
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
            {isOtpSent ? "VERIFY OTP" : "SIGN IN"}
          </h2>
          <div className="w-24 h-[1px] bg-amber-400 mb-4" />

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
                <button
                  type="button"
                  onClick={handleSwitchToRegister}
                  className="block mt-1.5 font-bold underline hover:text-blue-900 transition-colors cursor-pointer text-left"
                >
                  Click here to Register
                </button>
              </div>
            </div>
          )}

          <form
            className="w-full flex flex-col items-center"
            onSubmit={handleFormSubmit}
          >
            <button
              type="button"
              tabIndex={-1}
              className="w-full bg-[#900000] text-white text-[15px] font-semibold py-2.5 rounded shadow-sm mb-5 cursor-default focus:outline-none"
            >
              Devotee
            </button>

            {isOtpSent ? (
              <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
                <div className="w-full flex items-center justify-between text-xs text-gray-600 mb-2 px-1">
                  <span className="flex items-center gap-1 font-medium truncate max-w-[240px]">
                    {otpChannel === "email" ? (
                      <Mail className="w-3.5 h-3.5 text-[#900000] shrink-0" />
                    ) : (
                      <Phone className="w-3.5 h-3.5 text-[#900000] shrink-0" />
                    )}
                    {otpTarget}
                  </span>
                  <button
                    type="button"
                    onClick={handleChangeTarget}
                    disabled={isLoading}
                    className="text-[#900000] font-bold hover:underline ml-2 shrink-0 disabled:opacity-50"
                  >
                    Change
                  </button>
                </div>

                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Enter 6-digit OTP"
                  disabled={isLoading}
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-center text-lg tracking-[0.3em] font-semibold text-gray-800 placeholder-gray-400 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm focus:outline-none focus:border-[#900000] focus:ring-1 focus:ring-[#900000] transition-colors mb-3 bg-white/95 disabled:bg-gray-100 disabled:opacity-70"
                />

                {otpChannel === "email" && (
                  <div className="w-full flex justify-end mb-6 px-1">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="flex items-center gap-1 text-xs text-[#900000] font-semibold hover:underline disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${isSendingOtp ? "animate-spin" : ""}`}
                      />
                      Resend Code
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otpCode.trim().length < 4}
                  className="relative flex items-center justify-center bg-[#900000] hover:bg-[#7a0000] text-white text-[15px] font-semibold py-2 px-8 rounded-md shadow-md transition-all mb-4 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#900000] disabled:bg-[#7a0000] disabled:opacity-60 disabled:cursor-not-allowed w-44 h-10 cursor-pointer"
                >
                  {isVerifyingOtp ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "VERIFY & LOGIN"
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleChangeTarget}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors mb-2 disabled:opacity-50 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In options
                </button>
              </div>
            ) : (
              <>
                <div
                  onClick={handleEmailTap}
                  className={`w-full mb-4 transition-opacity duration-200 ${
                    isEmailDead ? "opacity-40 cursor-pointer" : "opacity-100"
                  }`}
                >
                  <div className={isEmailDead ? "pointer-events-none" : ""}>
                    <input
                      ref={emailInputRef}
                      type="email"
                      name="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="Enter your email Id."
                      disabled={isLoading}
                      className="w-full border border-gray-300 rounded px-3 py-2.5 text-[15px] text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#900000] focus:ring-1 focus:ring-[#900000] transition-colors bg-white/95 disabled:bg-gray-100 disabled:opacity-70"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center w-full mb-4">
                  <span className="text-gray-900 text-[14px] font-medium px-2 bg-white/50 rounded">
                    --OR--
                  </span>
                </div>

                <div
                  ref={phoneContainerRef}
                  onClick={handlePhoneTap}
                  className={`w-full mb-8 relative z-50 transition-opacity duration-200 ${
                    isPhoneDead ? "opacity-40 cursor-pointer" : "opacity-100"
                  }`}
                >
                  <div className={isPhoneDead ? "pointer-events-none" : ""}>
                    <PhoneInputField
                      name="phone"
                      value={phone}
                      onChange={handlePhoneChange}
                      onCountryChange={(code) => setCountryCode(code)}
                    />
                  </div>
                </div>

                <div id="recaptcha-container"></div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative flex items-center justify-center bg-[#900000] hover:bg-[#7a0000] text-white text-[15px] font-semibold py-2 px-12 rounded-md shadow-md transition-all mb-6 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#900000] disabled:bg-[#7a0000] disabled:cursor-not-allowed w-40 h-10 cursor-pointer"
                >
                  {isSendingOtp || isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "LOGIN"
                  )}
                </button>

                <p className="text-[14px] text-gray-900 font-medium">
                  New User?{" "}
                  <button
                    type="button"
                    onClick={handleSwitchToRegister}
                    className="text-[#900000] font-bold hover:underline transition-all ml-1 cursor-pointer"
                  >
                    Register
                  </button>
                </p>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export const SignInModal = ({ isOpen, onClose, logoUrl }) => {
  if (!isOpen) return null;
  return <SignInModalContent onClose={onClose} logoUrl={logoUrl} />;
};


