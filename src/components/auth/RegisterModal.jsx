import { useEffect, useCallback } from "react";
import { X, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { PhoneInputField } from "../ui/PhoneInputField";
import { useRegisterController } from "../../hooks/queries/Auth/useRegisterController";
import { useModalStore } from "../../store/useModalStore";

const RegisterModalContent = ({ onClose, logoUrl }) => {
  const {
    registrationType,
    handleRegistrationTypeChange,
    addCompany,
    handleAddCompanyToggle,
    email,
    setEmail,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    setCountryCode,
    companyEmail,
    setCompanyEmail,
    companyFirstName,
    setCompanyFirstName,
    companyLastName,
    setCompanyLastName,
    companyPhone,
    setCompanyPhone,
    setCompanyCountryCode,
    handleRegisterSubmit,
    isLoading,
    error,
    successMessage,
    companyEmailError,
    companyPhoneError,
  } = useRegisterController();

  const openModal = useModalStore((state) => state.openModal);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose?.();
  }, [isLoading, onClose]);

  const handleSwitchToSignIn = (e) => {
    e.preventDefault();
    if (isLoading) return;
    handleClose();
    openModal("SIGN_IN", { logoUrl });
  };

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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-modal-title"
    >
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[480px] my-8 bg-white bg-[url('/src/assets/bg-card.png')] bg-cover bg-center shadow-2xl animate-in zoom-in-95 duration-200 rounded-md border border-gray-200">
        <button
          onClick={handleClose}
          type="button"
          disabled={isLoading}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 bg-white/60 hover:bg-gray-100 p-1.5 rounded-full transition-all focus:outline-none disabled:opacity-50"
          aria-label="Close register dialog"
        >
          <X className="w-5 h-5 stroke-[2]" />
        </button>

        <div className="p-6 sm:p-8 flex flex-col items-center max-h-[85vh] overflow-y-auto">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="HTKY Logo"
              className="w-20 h-20 object-contain mb-2 drop-shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#900000] font-serif font-bold text-3xl mb-2 shadow-sm">
              ॐ
            </div>
          )}

          <h2
            id="register-modal-title"
            className="text-[#900000] text-lg font-black font-sans uppercase tracking-widest mt-1 mb-1"
          >
            SIGN UP
          </h2>
          <div className="w-24 h-[1px] bg-amber-400 mb-4" />

          {error && (
            <div className="w-full flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-md border border-red-100 mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-medium leading-tight">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="w-full flex items-start gap-2 bg-emerald-50 text-emerald-800 p-3 rounded-md border border-emerald-100 mb-4">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-medium leading-tight">
                {successMessage}
              </p>
            </div>
          )}

          <form
            className="w-full flex flex-col"
            onSubmit={handleRegisterSubmit}
          >
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
                Registration Type*
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-800">
                  <input
                    type="radio"
                    name="registrationType"
                    checked={registrationType === "INDIVIDUAL"}
                    onChange={() => handleRegistrationTypeChange("INDIVIDUAL")}
                    className="w-4 h-4 text-[#900000] focus:ring-[#900000]"
                  />
                  INDIVIDUAL
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-800">
                  <input
                    type="radio"
                    name="registrationType"
                    checked={registrationType === "COMPANY"}
                    onChange={() => handleRegistrationTypeChange("COMPANY")}
                    className="w-4 h-4 text-[#900000] focus:ring-[#900000]"
                  />
                  COMPANY
                </label>
              </div>
            </div>

            {registrationType === "INDIVIDUAL" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Email*
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Email"
                    className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#900000] bg-white/95"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                      First Name*
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter First Name"
                      className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#900000] bg-white/95"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                      Last Name*
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter Last Name"
                      className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#900000] bg-white/95"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Phone Number*
                  </label>
                  <PhoneInputField
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onCountryChange={(code) => setCountryCode(code)}
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={addCompany}
                      onChange={(e) => handleAddCompanyToggle(e.target.checked)}
                      className="w-4 h-4 text-[#900000] rounded focus:ring-[#900000]"
                    />
                    Add Company
                  </label>
                </div>
              </div>
            )}

            {(registrationType === "COMPANY" ||
              (registrationType === "INDIVIDUAL" && addCompany)) && (
              <div className="space-y-4 mt-4 pt-4 border-t border-gray-200 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Company Email
                  </label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="Enter Company Email"
                    className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#900000] bg-white/95"
                  />
                  {companyEmailError && (
                    <p className="text-xs text-amber-600 mt-1 font-medium">
                      {companyEmailError}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                      Company First Name
                    </label>
                    <input
                      type="text"
                      value={companyFirstName}
                      onChange={(e) => setCompanyFirstName(e.target.value)}
                      placeholder="Company First Name"
                      className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#900000] bg-white/95"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                      Company Last Name
                    </label>
                    <input
                      type="text"
                      value={companyLastName}
                      onChange={(e) => setCompanyLastName(e.target.value)}
                      placeholder="Company Last Name"
                      className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#900000] bg-white/95"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Company Phone Number
                  </label>
                  <PhoneInputField
                    name="companyPhone"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    onCountryChange={(code) => setCompanyCountryCode(code)}
                  />
                  {companyPhoneError && (
                    <p className="text-xs text-amber-600 mt-1 font-medium">
                      {companyPhoneError}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col items-center">
              <button
                type="submit"
                disabled={isLoading}
                className="relative flex items-center justify-center bg-[#900000] hover:bg-[#7a0000] text-white text-[15px] font-semibold py-2.5 px-12 rounded-md shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#900000] disabled:opacity-60 disabled:cursor-not-allowed w-full h-11 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "REGISTER"
                )}
              </button>

              <p className="text-[14px] text-gray-900 font-medium mt-4">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={handleSwitchToSignIn}
                  className="text-[#900000] font-bold hover:underline transition-all ml-1 cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const RegisterModal = ({ isOpen, onClose, logoUrl }) => {
  if (!isOpen) return null;
  return <RegisterModalContent onClose={onClose} logoUrl={logoUrl} />;
};
