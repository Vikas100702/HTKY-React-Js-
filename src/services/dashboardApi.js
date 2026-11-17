/**
 * @file src/services/dashboardApi.js
 * @description Isolated Network Service Layer for Devotee Dashboard endpoints.
 * Consumes centralized `apiClient`, `ENDPOINTS`, and `ENV_CONFIG` with strict
 * AbortController support and zero UI/store coupling.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Non-Negotiables #2, #3, #4, and #5.
 */

import { apiClient } from "../api/client";
import { ENDPOINTS } from "../constants/apiConstants";
import { ENV_CONFIG } from "../config/envConfig";

/**
 * Default temple customer code required by `getCumulativeAmount` microservice.
 */
const DEFAULT_CUSTOMER_CODE = "4213";

/**
 * Fetches the devotee's accumulated transaction amount toward Lifetime Membership.
 * Mirrors legacy PHP `getCumulativeAmount($updateStatus = false)` contract.
 *
 * @param {Object} params
 * @param {string} params.memberId - Logged-in devotee MongoDB `_id`
 * @param {string} [params.customerCode="4213"] - Temple customer code
 * @param {boolean} [params.checkAndUpdate=false] - Whether backend should recalculate/update
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal] - TanStack Query AbortSignal for request cancellation
 * @returns {Promise<{ totalAmount: number, devoteeData: Object|null }>}
 */
export const fetchCumulativeAmount = async (
    {
        memberId,
        customerCode = DEFAULT_CUSTOMER_CODE,
        checkAndUpdate = false,
    },
    { signal } = {}
) => {
    if (!memberId) {
        return { totalAmount: 0, devoteeData: null };
    }

    const payload = {
        clientId: ENV_CONFIG.CLIENT_ID,
        productId: ENV_CONFIG.PRODUCT_ID,
        memberId: String(memberId).trim(),
        customerCode: String(customerCode || DEFAULT_CUSTOMER_CODE).trim(),
        checkAndUpdate: Boolean(checkAndUpdate),
    };

    const rawResponse = await apiClient.post(
        ENDPOINTS.GET_CUMULATIVE_AMOUNT,
        payload,
        {
            signal,
            pre: true,
        }
    );

    const root = rawResponse?.data ?? rawResponse ?? {};
    const result = root?.result ?? root ?? {};
    const dataArray = Array.isArray(result?.data) ? result.data : [];
    const rawTotal = Number(dataArray[0]?.totalAmount ?? 0);

    return {
        totalAmount: Number.isFinite(rawTotal) ? rawTotal : 0,
        devoteeData: result?.devoteeData || null,
    };
};

export default {
    fetchCumulativeAmount,
};