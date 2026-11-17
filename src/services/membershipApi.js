/**
 * @file src/services/membershipApi.js
 * @description Isolated Network Service Layer for Membership Payment Charge (MPI)
 * and Membership Registration (`api/home/addMemberShip`).
 * Reuses centralized `encodeBase64` / `decodeBase64` utilities from `src/utils/base64.js`.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Non-Negotiables #2, #3, #4, and #5.
 */

import { apiClient } from "../api/client";
import { ENV_CONFIG } from "../config/envConfig";
import { ENDPOINTS } from "../constants/apiConstants";
import { decodeBase64, encodeBase64 } from "../utils/base64";



/**
 * Normalizes a contact value (email or stripped phone number) and ensures
 * single-pass Base64 encoding using the project's shared `base64.js` utility.
 *
 * @param {string} value - Plain-text or already Base64-encoded string
 * @param {boolean} [isPhone=false] - Strips phone formatting characters before encoding
 * @returns {string} Base64-encoded string
 */

const normalizeContactBase64 = (value, isPhone = false) => {
    if (!value || typeof value !== "string") return "";

    // Decode first so pre-encoded values from `getDevoteeDetailsWeb` aren't double-encoded;
    // `decodeBase64` falls back gracefully to plain text if the input isn't Base64.
    const plainValue = decodeBase64(value.trim());
    const cleaned = isPhone ? String(plainValue).replace(/[\s()-]/g, "").trim() : String(plainValue).trim();

    return cleaned ? encodeBase64(cleaned) : "";
};

/**
 * Formats current date as MM/DD/YYYY and time as hh:mm AM/PM matching backend contract.
 *
 * @returns {{ recCreDate: string, recCreTime: string }}
 */
const getFormattedCreationTimestamp = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const year = now.getFullYear();

    const hours24 = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours24 >= 12 ? "PM" : "AM";
    const hours12 = String(hours24 % 12 || 12).padStart(2, "0");

    return {
        recCreDate: `${month}/${day}/${year}`,
        recCreTime: `${hours12}:${minutes} ${ampm}`,
    };
};

/**
 * Charges the tokenized card via MPI / BridgePay backend microservice.
 *
 * @param {Object} params
 * @param {string} params.token - BridgePay single-use payment token
 * @param {number} params.amount - Membership amount in USD dollars (e.g., 365.00)
 * @param {string} params.name - Cardholder full name
 * @param {string} [params.address=''] - Billing street address
 * @param {string} params.zipcode - Billing ZIP code
 * @param {number|string} params.invoiceNum - Millisecond timestamp invoice number
 * @param {boolean} [isTestMode=true] - Toggle between Test and Live MPI endpoints
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Object>} Gateway charge response
 */
export const chargeMpiMembershipCard = async (
    {
        token,
        amount,
        name,
        address = "",
        zipcode,
        invoiceNum,
        isTestMode = true,
    },
    { signal } = {}
) => {
    const roundedAmount = Math.round((Number(amount) || 0) * 100) / 100;
    const amountInCents = Math.round(roundedAmount * 100);

    const endpoints = isTestMode ? ENDPOINTS.MPI_CARD_PAYMENT_TEST : ENDPOINTS.MPI_CARD_PAYMENT_LIVE;

    const payload = {
        token,
        amount: isTestMode ? 500 : amountInCents,
        name: String(name || "").trim(),
        address: String(address || "").trim(),
        zipcode: String(zipcode || "").trim(),
        clientId: ENV_CONFIG.CLIENT_ID,
        InvoiceNum: invoiceNum
    };

    const response = await apiClient.post(endpoints, payload, { signal });
    return response?.data || response;
};

/**
 * Registers the purchased/renewed membership in MongoDB (`api/home/addMemberShip`)
 * after MPI payment approval (`responseCode === "00000"`).
 *
 * @param {Object} params
 * @param {Object} params.membershipPlan - Selected plan from `useMembershipSettings`
 * @param {Object} params.devoteeInfo - Devotee ID, Name, Email, Mobile
 * @param {string} params.transactionId - Reconciled gateway transaction reference string
 * @param {string} [params.paymentStatus='COMPLETED']
 * @param {string} [params.status='ACTIVE']
 * @param {string} [params.paymentSource='MPI_CARD_NOT_PRESENT']
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Object>} Backend registration response
 */
export const registerMembershipPlan = async (
    {
        membershipPlan,
        devoteeInfo,
        transactionId,
        paymentStatus = "COMPLETED",
        status = "ACTIVE",
        paymentSource = "MPI_CARD_NOT_PRESENT",
    },
    { signal } = {}
) => {
    const { recCreDate, recCreTime } = getFormattedCreationTimestamp();

    // Serialize benefits array/grid via JSON.stringify per backend contract
    const serializedBenefits = JSON.stringify(
        Array.isArray(membershipPlan?.rawChildGrid) && membershipPlan.rawChildGrid.length > 0 ? membershipPlan.rawChildGrid : membershipPlan?.benefits || []
    );


    const payload = {
        clientId: ENV_CONFIG.CLIENT_ID,
        dataJson: {
            membershipAmount: Number(membershipPlan?.price || 0),
            membershipDetail:
                membershipPlan?.description ||
                `As a ${membershipPlan?.membershipType || "MEMBER"}, you'll enjoy:`,
            benefit: serializedBenefits,
            planName: membershipPlan?.rawName || membershipPlan?.displayName || "",
            inDays: String(membershipPlan?.inDays || ""),
            planType: membershipPlan?.membershipType || "",
            paymentStatus,
            memberId: String(devoteeInfo?.memberId || "").trim(),
            Name: String(devoteeInfo?.name || "").trim(),
            Mobile: normalizeContactBase64(devoteeInfo?.mobile, true),
            Email: normalizeContactBase64(devoteeInfo?.email, false),
            planId: String(membershipPlan?.id || "").trim(),
            transactionId: String(transactionId || "").trim(),
            status,
            paymentSource,
            moduleName: "Membership Directory",
            memberTypes: "MEMBERSHIP",
            aspectType: "membership",
            recCreDate,
            recCreTime,
        }
    };

    const response = await apiClient.post(ENDPOINTS.ADD_MEMBERSHIP, payload, { signal });
    return response?.data || response;
};

export default {
    chargeMpiMembershipCard,
    registerMembershipPlan,
};

