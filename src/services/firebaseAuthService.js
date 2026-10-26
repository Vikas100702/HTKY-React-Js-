import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../config/firebaseConfig";

let activeRecaptchaVerifier = null;

const FIREBASE_AUTH_ERROR_MAP = Object.freeze({
    "auth/invalid-phone-number": "Please enter a valid phone number (with country code).",
    "auth/missing-phone-number": "Phone number cannot be empty.",
    "auth/quota-exceeded": "The SMS quota has been exceeded. Please try again later.",
    "auth/too-many-requests": "Too many attempts have been made. Please wait a moment and try again.",
    "auth/invalid-verification-code": "The OTP you entered is incorrect.",
    "auth/code-expired": "This OTP has expired. Please request a new OTP.",
    "auth/captcha-check-failed": "reCAPTCHA verification failed. Please refresh the page.",
});

export const formatToE164 = (phone = "", countryCode = "+1") => {
    const cleanPhone = String(phone).replace(/[^0-9]/g, "");
    let cleanCode = String(countryCode).replace(/[^0-9]/g, "");

    if (!cleanCode) {
        cleanCode = "1";
    }

    if (cleanPhone.startsWith(cleanCode)) {
        return `+${cleanPhone}`;
    }

    return `+${cleanCode}${cleanPhone}`;
};

export const getOrCreateRecaptchaVerifier = (containerId = "recaptcha-container") => {
    try {
        if (activeRecaptchaVerifier) cleanupRecaptchaVerifier();

        const containerElem = document.getElementById(containerId);

        if (!containerElem) {
            const errorMsg = `reCAPTCHA container '#${containerId}' DOM me mojud nahi hai.`;
            console.error(`[HTKY_APM][RECAPTCHA_DOM_ERROR] ${new Date().toISOString()}`, { containerId });
            throw new Error(errorMsg);
        }

        activeRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
            size: "invisible",
            callback: () => {
                // Invisible reCAPTCHA solved
            },
            "expired-callback": () => {
                console.warn(`[HTKY_APM][RECAPTCHA_EXPIRED] ${new Date().toISOString()}`);
                cleanupRecaptchaVerifier();
            },
        });

        return activeRecaptchaVerifier;
    } catch (error) {
        console.error(`[HTKY_APM][RECAPTCHA_INIT_ERROR] ${new Date().toISOString()}`, {
            message: error?.message || error,
            stack: error?.stack,
        });
        throw error;
    }
};

export const cleanupRecaptchaVerifier = () => {
    try {
        if (activeRecaptchaVerifier) {
            activeRecaptchaVerifier.clear();
            activeRecaptchaVerifier = null;
        }
    } catch (error) {
        console.warn(`[HTKY_APM][RECAPTCHA_CLEANUP_WARN] ${new Date().toISOString()}`, {
            message: error?.message || error,
        });
        activeRecaptchaVerifier = null;
    }
};

export const requestPhoneOtp = async (rawPhone, countryCode = "+1", containerId = "recaptcha-container") => {
    try {
        const formattedPhone = formatToE164(rawPhone, countryCode);

        if (!rawPhone || String(rawPhone).trim().length < 4) {
            throw new Error("Please enter a valid phone number.");
        }

        const appVerifier = getOrCreateRecaptchaVerifier(containerId);
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);

        return confirmationResult;
    } catch (error) {
        const errorCode = error?.code || "";
        const userMessage = FIREBASE_AUTH_ERROR_MAP[errorCode] || error?.message || "An error occurred while sending the OTP. Please try again.";

        console.error(`[HTKY_APM][FIREBASE_SEND_OTP_ERROR] ${new Date().toISOString()}`, {
            code: errorCode,
            rawMessage: error?.message,
            phoneLength: rawPhone?.length
        });

        cleanupRecaptchaVerifier();

        const normalizedError = new Error(userMessage);
        normalizedError.code = errorCode;
        throw normalizedError;
    }
};

export const confirmPhoneOtp = async (confirmationResult, otpCode) => {
    try {
        if (!confirmationResult || typeof confirmationResult.confirm !== "function") {
            throw new Error("The verification session has expired. Please request a new OTP.");
        }

        const cleanCode = String(otpCode).trim().replace(/[^0-9]/g, "");
        if (cleanCode.length !== 6) {
            throw new Error("Kripya pura 6-digit OTP code enter karein.");
        }

        const userCredential = await confirmationResult.confirm(cleanCode);

        cleanupRecaptchaVerifier();

        return userCredential;
    } catch (error) {
        const errorCode = error?.code || "";
        const userMessage = FIREBASE_AUTH_ERROR_MAP[errorCode] || error?.message || "OTP verification fail ho gaya.";

        console.error(`[HTKY_APM][FIREBASE_VERIFY_OTP_ERROR] ${new Date().toISOString()}`, {
            code: errorCode,
            rawMessage: error?.message,
        });

        const normalizedError = new Error(userMessage);
        normalizedError.code = errorCode;
        throw normalizedError;
    }
};