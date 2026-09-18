import { useRef } from "react";
import IntlTelInput from "@intl-tel-input/react";
import "intl-tel-input/styles";

export const PhoneInputField = ({
  name = "phone",
  value,
  onChange,
  onCountryChange,
  initialCountry = "us",
}) => {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const itiRef = useRef(null);
  const dialCodeRef = useRef("1");

  const resolveActiveDialCode = () => {
    try {
      // Tier 1: Stored instance
      if (
        itiRef.current &&
        typeof itiRef.current.getSelectedCountryData === "function"
      ) {
        const data = itiRef.current.getSelectedCountryData();
        if (data?.dialCode) {
          dialCodeRef.current = String(data.dialCode);
          return dialCodeRef.current;
        }
      }

      // Tier 2: Window globals hook via input element
      if (
        typeof window !== "undefined" &&
        window.intlTelInputGlobals &&
        inputRef.current
      ) {
        const globalInstance = window.intlTelInputGlobals.getInstance(
          inputRef.current,
        );
        if (
          globalInstance &&
          typeof globalInstance.getSelectedCountryData === "function"
        ) {
          const data = globalInstance.getSelectedCountryData();
          if (data?.dialCode) {
            itiRef.current = globalInstance;
            dialCodeRef.current = String(data.dialCode);
            return dialCodeRef.current;
          }
        }
      }

      // Tier 3: Direct DOM inspection
      if (containerRef.current) {
        const domDialCodeEl = containerRef.current.querySelector(
          ".iti__selected-dial-code",
        );
        if (domDialCodeEl && domDialCodeEl.textContent) {
          const domDigits = domDialCodeEl.textContent.replace(/\D/g, "");
          if (domDigits) {
            dialCodeRef.current = domDigits;
            return dialCodeRef.current;
          }
        }
      }
    } catch (err) {
      console.warn(
        `[HTKY_APM][DIAL_CODE_RESOLVE_WARN] ${new Date().toISOString()}`,
        err,
      );
    }

    return dialCodeRef.current || "1";
  };

  // Broadcasts country metadata to parent components
  const emitCountryData = (instance = itiRef.current) => {
    try {
      const dialCode = resolveActiveDialCode();
      const countryData = instance?.getSelectedCountryData?.() || { dialCode };

      if (typeof onCountryChange === "function" && dialCode) {
        onCountryChange(`+${dialCode}`, countryData);
      }
    } catch (error) {
      console.error(
        `[HTKY_APM][COUNTRY_EMIT_ERROR] ${new Date().toISOString()}`,
        error,
      );
    }
  };

  const handleInstanceInit = (instance) => {
    if (!instance) return;
    itiRef.current = instance;
    emitCountryData(instance);
  };

  const handleChange = (fullNumber) => {
    try {
      const dialCode = resolveActiveDialCode();
      const rawDigits = fullNumber ? String(fullNumber).replace(/\D/g, "") : ""; // Extract only numeric digits
      let nationalDigits = rawDigits; // Strictly strip dial code prefix if present

      if (dialCode && nationalDigits.startsWith(dialCode)) {
        nationalDigits = nationalDigits.slice(dialCode.length);
      }
      if (typeof onChange === "function") {
        onChange({ target: { name, value: nationalDigits } });
      }
      if (typeof onCountryChange === "function" && dialCode) {
        onCountryChange(
          `+${dialCode}`,
          itiRef.current?.getSelectedCountryData?.() || { dialCode },
        );
      }
    } catch (error) {
      console.error(
        `[HTKY_APM][PHONE_INPUT_ERROR] ${new Date().toISOString()}`,
        error,
      );
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full relative z-[150]
        [&_.iti]:w-full 
        [&_.iti__flag-container]:z-10
        [&_.iti__selected-flag]:bg-white/95 [&_.iti__selected-flag]:rounded-l
        [&_.iti__dropdown-content]:!z-[200] [&_.iti__dropdown-content]:animate-in [&_.iti__dropdown-content]:fade-in [&_.iti__dropdown-content]:zoom-in-95 [&_.iti__dropdown-content]:duration-150
        [&_.iti__search-input]:focus:ring-1 [&_.iti__search-input]:focus:ring-[#900000] [&_.iti__search-input]:focus:border-[#900000]
        [&_.iti__country.iti__highlight]:bg-red-50 [&_.iti__country.iti__highlight]:text-[#900000]
      "
    >
      <IntlTelInput
        initialCountry={initialCountry}
        loadUtils={() => import("intl-tel-input/utils")}
        initOptions={{
          countrySearch: true,
          formatOnDisplay: true,
        }}
        initCallback={handleInstanceInit}
        getInstance={handleInstanceInit}
        initInstance={handleInstanceInit}
        value={value}
        onChangeNumber={handleChange}
        onChangeCountry={() => emitCountryData()}
        inputProps={{
          ref: inputRef,
          name: name,
          placeholder: "Phone number",
          className:
            "w-full border border-gray-300 rounded px-3 py-2.5 text-[15px] text-gray-800 focus:outline-none focus:border-[#900000] focus:ring-1 focus:ring-[#900000] transition-colors bg-white/95",
        }}
      />
    </div>
  );
};
