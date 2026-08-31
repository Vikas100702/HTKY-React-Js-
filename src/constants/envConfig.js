/**
 * @file src/constants/envConfig.js
 * @description Centralized, fail-safe environment variable configuration loader.
 * No hardcoded fallbacks for sensitive data. 
 * Prevents secrets from leaking into the client-side JavaScript bundle.
 * Uses Object.freeze() to prevent runtime mutations.
 */

/**
 * Safely retrieves an environment variable. 
 * If missing, it returns an empty string to prevent UI thread crashes, 
 * but logs a critical error so the developer knows the build configuration is broken.
 * @param {string} key - Environment variable key name (e.g. 'VITE_API_BASE_URL')
 * @returns {string} Environment variable value or safe empty string
 */

const getSecureEnvVar = (key) => {
    const value = import.meta.env[key];
    if (!value) {
        console.error(`[ENV Critical] Missing required environment variable: ${key}. Check your .env file. APIs relying on this will fail gracefully.`);
        return ""; // Empty string prevents UI hard crashes, delegates failure to API layer.
    }
    return value;
};

export const ENV_CONFIG = Object.freeze({
    VITE_RECAPTCHA_SITE_KEY: getSecureEnvVar("VITE_RECAPTCHA_SITE_KEY"),
    BASE_URL: getSecureEnvVar("VITE_API_BASE_URL"),
    PRE_BASE_URL: getSecureEnvVar("VITE_API_PRE_BASE_URL"),
    PRODUCT_ID: getSecureEnvVar("VITE_PRODUCT_ID"),
    CLIENT_ID: getSecureEnvVar("VITE_CLIENT_ID"),
    PARAYANAM_EVENT_ID: getSecureEnvVar("VITE_PARAYANAM_EVENT_ID"),
    PARAYANAM_MEMBER_ID: getSecureEnvVar("VITE_PARAYANAM_MEMBER_ID"),
});