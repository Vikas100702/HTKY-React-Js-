/**
 * @file src/hooks/queries/Common/usePaymentGateway.js
 * @description Global Enterprise Hook for Payment Gateway Status & Proactive Script Loading.
 *
 * Step-by-Step Flow:
 * 1. Fetches `CLIENT_SETTINGS` via TanStack Query (cached for 10 mins).
 * 2. Checks `paymentGatewayoffon` where `source === "WEBSITE"` and `isenable === true`.
 *    If disabled/missing, blocks payment flow with `downReason`.
 * 3. Checks `paymentGatewaySettings` where `platform === "WEBSITE"` to detect `MPI` vs `NMI`
 *    (including LIVE vs TEST modes).
 * 4. Proactively loads required gateway SDKs (`jQuery` -> `tokenPay.js` for MPI, or `Collect.js` for NMI)
 *    as soon as the page loads so clicking "Enroll Now" opens the card UI instantaneously.
 *
 * Strict Tech Stack: Pure ES6+ JavaScript, TanStack Query, NO TypeScript.
 * Aligns strictly with Non-Negotiables #2, #3, #4, and #5.
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import {
    ENDPOINTS,
    MPI_GATEWAY_CONFIG,
    NMI_GATEWAY_CONFIG,
} from "../../../constants/apiConstants";
import { ENV_CONFIG } from "../../../config/envConfig";

const JQUERY_CDN_URL =
    "https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js";

/**
 * Helper to inject an external script idempotently and return a Promise.
 * Prevents duplicate script tags and ensures strict load ordering (e.g., jQuery before TokenPay).
 *
 * @param {string} id - Unique DOM element ID for the script
 * @param {string} src - Script URL
 * @param {Object} [attributes={}] - Optional HTML attributes (e.g., data-tokenization-key)
 * @returns {Promise<void>}
 */
const loadExternalScript = (id, src, attributes = {}) => {
    return new Promise((resolve, reject) => {
        const existing = document.getElementById(id);
        if (existing) {
            if (existing.getAttribute("data-loaded") === "true") {
                resolve();
                return;
            }
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener(
                "error",
                () => reject(new Error(`Failed to load script: ${src}`)),
                { once: true }
            );
            return;
        }

        const script = document.createElement("script");
        script.id = id;
        script.type = "text/javascript";
        script.src = src;
        script.async = true;

        Object.entries(attributes).forEach(([key, value]) => {
            if (value) script.setAttribute(key, value);
        });

        script.onload = () => {
            script.setAttribute("data-loaded", "true");
            resolve();
        };

        script.onerror = () => {
            script.remove();
            reject(new Error(`Failed to load script: ${src}`));
        };

        document.body.appendChild(script);
    });
};

/**
 * Parses `CLIENT_SETTINGS` response using the two-tier WEBSITE validation contract.
 *
 * @param {Object} settingsResponse
 * @returns {Object}
 */
const parseGatewaySettings = (settingsResponse) => {
    const defaultState = {
        isPaymentEnabled: false,
        gatewayProvider: null, // 'MPI' | 'NMI' | null
        gatewayMode: "TEST", // 'LIVE' | 'TEST'
        rawGatewayName: "",
        downReason:
            "Payment service is currently unavailable. Sorry for the inconvenience.",
        tokenizationKey: "",
    };

    if (!settingsResponse) return defaultState;

    const rootData =
        settingsResponse?.result?.data?.[0] ||
        settingsResponse?.data?.result?.data?.[0] ||
        settingsResponse?.data?.data?.[0] ||
        settingsResponse?.data?.[0] ||
        settingsResponse?.data ||
        settingsResponse ||
        {};

    const gatewayOnOffList = Array.isArray(rootData?.paymentGatewayoffon)
        ? rootData.paymentGatewayoffon
        : [];

    const gatewaySettingsList = Array.isArray(rootData?.paymentGatewaySettings)
        ? rootData.paymentGatewaySettings
        : [];

    const clientInfoById =
        rootData?.getclientInfoById || rootData?.clientInfo || {};

    // ================= TIER 1: CHECK WEBSITE KILL-SWITCH =================
    const websiteOffOn = gatewayOnOffList.find(
        (item) => String(item?.source || "").trim().toUpperCase() === "WEBSITE"
    );

    const isEnabled =
        Boolean(websiteOffOn) &&
        (websiteOffOn.isenable === true ||
            String(websiteOffOn.isenable).toLowerCase() === "true" ||
            Number(websiteOffOn.isenable) === 1);

    if (!isEnabled) {
        return {
            ...defaultState,
            isPaymentEnabled: false,
            downReason:
                websiteOffOn?.desc?.trim() ||
                "Payment service is currently down for maintenance. Sorry for the inconvenience.",
        };
    }

    // ================= TIER 2: RESOLVE WEBSITE GATEWAY =================
    const websitePlatformSetting = gatewaySettingsList.find(
        (item) => String(item?.platform || "").trim().toUpperCase() === "WEBSITE"
    );

    const rawGatewayName = Array.isArray(websitePlatformSetting?.paymentGateway)
        ? String(websitePlatformSetting.paymentGateway[0] || "")
            .trim()
            .toUpperCase()
        : "";

    if (!rawGatewayName) {
        return {
            ...defaultState,
            isPaymentEnabled: false,
            downReason:
                "No payment gateway is configured for WEBSITE. Sorry for the inconvenience.",
        };
    }

    // Determine Provider (MPI vs NMI) & Mode (LIVE vs TEST)
    const isMPI = rawGatewayName.includes("MPI");
    const isNMI = rawGatewayName.includes("NMI");

    if (!isMPI && !isNMI) {
        return {
            ...defaultState,
            isPaymentEnabled: false,
            downReason: `Unsupported payment gateway (${rawGatewayName}). Sorry for the inconvenience.`,
        };
    }

    const gatewayProvider = isMPI ? "MPI" : "NMI";
    const isTestMode =
        rawGatewayName.includes("TEST") || rawGatewayName === "MPITEST";
    const gatewayMode = isTestMode ? "TEST" : "LIVE";

    // Extract merchant tokenization key (matching legacy PHP logic)
    const tokenizationKey = isMPI
        ? (() => {
        const liveKey = String(clientInfoById?.MPItokenPay || "").trim();
        return !isTestMode && liveKey
            ? liveKey
            : liveKey ||
            MPI_GATEWAY_CONFIG.DEFAULT_TEST_TOKEN ||
            "tokenpay10579api20211508121542285";
    })()
        : isTestMode
            ? clientInfoById?.NmiMerchantKeyTokenizationTest ||
            clientInfoById?.NmiMerchantKeyTokenization ||
            ""
            : clientInfoById?.NmiMerchantKeyTokenization || "";

    return {
        isPaymentEnabled: true,
        gatewayProvider,
        gatewayMode,
        rawGatewayName,
        downReason: "",
        tokenizationKey,
    };
};

export const usePaymentGateway = () => {
    const [isScriptReady, setIsScriptReady] = useState(false);
    const [gatewayError, setGatewayError] = useState(null);

    const clientSettingsPayload = {
        action: "getClientSetting",
        productId: ENV_CONFIG.PRODUCT_ID,
        clientId: ENV_CONFIG.CLIENT_ID,
    };

    // Shared queryKey so Membership, Dashboard, and Checkout reuse the same cache
    const {
        data: settingsResponse,
        isLoading: isSettingsLoading,
        isError,
    } = useQuery({
        queryKey: ["clientSettings", "paymentGateway"],
        queryFn: async ({ signal }) => {
            const response = await apiClient.post(
                ENDPOINTS.CLIENT_SETTINGS,
                clientSettingsPayload,
                { signal }
            );
            return response;
        },
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        retry: 2,
    });

    const gatewayInfo = useMemo(
        () => parseGatewaySettings(settingsResponse),
        [settingsResponse]
    );

    // Proactive Sequential Script Loader (jQuery -> TokenPay.js for MPI, or Collect.js for NMI)
    useEffect(() => {
        let isCancelled = false;

        if (!gatewayInfo.isPaymentEnabled || !gatewayInfo.gatewayProvider) {
            return undefined;
        }

        const initScripts = async () => {
            try {
                if (gatewayInfo.gatewayProvider === "MPI") {
                    // 1. BridgePay TokenPay.js internally requires window.jQuery ($) to mount the #card iframe
                    if (!window.jQuery) {
                        await loadExternalScript("htky-jquery-sdk", JQUERY_CDN_URL);
                    }

                    // 2. Load Test or Live BridgePay TokenPay.js based on mode & key availability
                    const useLiveScript =
                        gatewayInfo.gatewayMode === "LIVE" &&
                        gatewayInfo.tokenizationKey !==
                        MPI_GATEWAY_CONFIG.DEFAULT_TEST_TOKEN;

                    const tokenPayUrl = useLiveScript
                        ? MPI_GATEWAY_CONFIG.LIVE_SCRIPT ||
                        "https://www.bridgepaynetsecuretx.com/Bridgepay.WebSecurity/TokenPay/js/tokenPay.js"
                        : MPI_GATEWAY_CONFIG.TEST_SCRIPT ||
                        "https://www.bridgepaynetsecuretest.com/WebSecurity/TokenPay/js/tokenPay.js";

                    await loadExternalScript("bridgepay-tokenpay-script", tokenPayUrl);
                } else if (gatewayInfo.gatewayProvider === "NMI") {
                    const nmiUrl =
                        gatewayInfo.gatewayMode === "LIVE"
                            ? NMI_GATEWAY_CONFIG.LIVE_SCRIPT ||
                            "https://secure.nmi.com/token/Collect.js"
                            : NMI_GATEWAY_CONFIG.TEST_SCRIPT ||
                            "https://sandbox.nmi.com/token/Collect.js";

                    await loadExternalScript("nmi-collect-script", nmiUrl, {
                        "data-tokenization-key": gatewayInfo.tokenizationKey,
                    });
                }

                if (!isCancelled) {
                    setIsScriptReady(true);
                    setGatewayError(null);
                }
            } catch (err) {
                if (!isCancelled) {
                    console.error("[HTKY_GATEWAY_SCRIPT_ERROR]", err);
                    setGatewayError(
                        err?.message || "Failed to load payment gateway security script."
                    );
                }
            }
        };

        initScripts();

        return () => {
            isCancelled = true;
        };
    }, [
        gatewayInfo.isPaymentEnabled,
        gatewayInfo.gatewayProvider,
        gatewayInfo.gatewayMode,
        gatewayInfo.tokenizationKey,
    ]);

    return {
        isSettingsLoading,
        isScriptReady,
        isPaymentEnabled: gatewayInfo.isPaymentEnabled,
        activeGateway: gatewayInfo.gatewayProvider, // 'MPI' | 'NMI' | null
        gatewayMode: gatewayInfo.gatewayMode, // 'LIVE' | 'TEST'
        rawGatewayName: gatewayInfo.rawGatewayName,
        downReason: gatewayInfo.downReason,
        tokenizationKey: gatewayInfo.tokenizationKey,
        gatewayError:
            gatewayError || (isError ? "Failed to fetch gateway configuration." : null),
    };
};

export default usePaymentGateway;

