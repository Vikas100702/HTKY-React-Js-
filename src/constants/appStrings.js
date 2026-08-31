/**
 * @file src/constants/appStrings.js
 * @description Centralized static text strings for the application.
 * Prevents hardcoding text in UI components, making localization and updates easier.
 * Uses Object.freeze() to prevent runtime mutations and ensure safety.
 */

export const APP_STRINGS = Object.freeze({
    // --- General & Fallbacks ---
    loadingContent: "Loading Page Content...",
    errorLoadingConfig: "Unable to load Temple Configuration. Please refresh the page.",
    fallbackCopyright: "Sree Devi Peetham © {year}. All Rights Reserved.",

    // --- Header Strings ---
    btnRequestPuja: "Request for Puja",
    btnDevoteePortal: "Devotee Portal",
    btnSignIn: "Sign In",
    noLogoText: "No Logo",
    countLabel: "Count -",
    kotiNamaLabel: "Koti Nama Stotra Parayanam :",

    // --- Footer Headings ---
    footerContactUs: "Contact Us",
    footerAboutUs: "About Us",
    footerTimings: "Temple Timings",
    footerConnect: "Connect With Us",

    // --- Footer Details ---
    phoneLabel: "Phone:",
    emailLabel: "Email:",
    weekdayTimingsLabel: "Weekday Timings:",
    weekendTimingsLabel: "Weekend Timings:",

    // --- Footer Legal Links ---
    copyright: "Copyright",
    termsConditions: "Terms of Use",
    privacyPolicy: "Privacy Policy",
    security: "Security",
});