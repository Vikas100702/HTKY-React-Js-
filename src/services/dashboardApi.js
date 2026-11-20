import { apiClient } from "../api/client";
import { ENDPOINTS } from "../constants/apiConstants";
import { ENV_CONFIG } from "../config/envConfig";

const DEFAULT_CUSTOMER_CODE = "4213";

export const getCurrentMonthDateRange = (referenceDate = new Date()) => {
    const year = referenceDate.getFullYear();
    const monthIndex = referenceDate.getMonth();
    const mm = String(monthIndex + 1).padStart(2, "0");
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();

    return {
        startDate: `${mm}/01/${year}`,
        endDate: `${mm}/${String(lastDay).padStart(2, "0")}/${year}`,
    };
};

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

export const fetchServiceScheduleSummary = async (
    {
        memberId,
        serviceCategoryFilter,
        startDate,
        endDate,
        skip = 0,
        next = 1020,
    },
    { signal } = {}
) => {
    const defaultRange = getCurrentMonthDateRange();
    const resolvedStart = startDate || defaultRange.startDate;
    const resolvedEnd = endDate || defaultRange.endDate;

    if (!memberId) {
        return {
            count: 0,
            records: [],
            bookings: [],
            dateRange: { startDate: resolvedStart, endDate: resolvedEnd },
        };
    }

    const payload = {
        componentConfig: {
            moduleName: "Calendar",
            productID: ENV_CONFIG.PRODUCT_ID,
            clientID: ENV_CONFIG.CLIENT_ID,
            aspectType: "Service Schedules",
            query: {
                aspectType: "serviceBooking",
                serviceCategoryTypes: serviceCategoryFilter,
                $or: [
                    {
                        paymentStatus: {
                            $in: ["COMPLETED", "PENDING"],
                        },
                    },
                    {
                        paymentStatus: "INITIATED",
                        serviceStatus: "SCHEDULED",
                    },
                ],
                memberId: String(memberId).trim(),
                cartCreDate: {
                    $lte: resolvedEnd,
                    $gte: resolvedStart,
                },
            },
            userName: "",
            skip,
            next,
        },
    };

    const rawResponse = await apiClient.post(ENDPOINTS.FILTER_API, payload, {
        signal,
        pre: true,
    });

    const root = unwrapApiEnvelope(rawResponse);
    const records = Array.isArray(root?.data) ? root.data : [];
    const count = resolveRecordCount(root, records);

    return {
        count,
        records,
        bookings: records,
        dateRange: { startDate: resolvedStart, endDate: resolvedEnd },
    };}

    /**
 * Safely unwraps nested `{ data: { ... } }` or `{ result: { ... } }` envelopes
 * without mistaking a `data: [...]` records array for the envelope wrapper.
 *
 * @param {any} rawResponse
 * @returns {Object}
 */
    const unwrapApiEnvelope = (rawResponse) => {
        const step1 =
            rawResponse &&
                typeof rawResponse === "object" &&
                !Array.isArray(rawResponse) &&
                rawResponse.data &&
                typeof rawResponse.data === "object" &&
                !Array.isArray(rawResponse.data)
                ? rawResponse.data
                : rawResponse ?? {};

        return step1?.result &&
            typeof step1.result === "object" &&
            !Array.isArray(step1.result)
            ? step1.result
            : step1;
    };

    /**
     * Resolves total record count using explicit `Count` / `count` when valid,
     * falling back to `records.length` if the count key is omitted or mismatched.
     *
     * @param {Object} root
     * @param {Array<Object>} records
     * @returns {number}
     */
    const resolveRecordCount = (root, records) => {
        const rawCount = root?.Count ?? root?.count;
        const parsedCount = Number(rawCount);
        if (
            rawCount !== undefined &&
            rawCount !== null &&
            String(rawCount).trim() !== "" &&
            Number.isFinite(parsedCount)
        ) {
            return parsedCount === 0 && records.length > 0
                ? records.length
                : Math.max(0, Math.floor(parsedCount));
        }
        return records.length;
    };



const PUJA_CATEGORY_FILTER_MAP = Object.freeze({
    ALL: { $nin: ["SPONSORSHIP", "DONATIONS"] },
    "IN-TEMPLE": { $in: ["IN-TEMPLE"] },
    "AWAY-TEMPLE": { $in: ["AWAY-TEMPLE"] },
    EVENTS: { $in: ["EVENTS"] },
});

export const fetchMyPujaBookings = (
    { categoryFilter = "ALL", ...restParams } = {},
    options
) => {
    const resolvedFilter =
        PUJA_CATEGORY_FILTER_MAP[categoryFilter] ||
        PUJA_CATEGORY_FILTER_MAP.ALL;

    return fetchServiceScheduleSummary(
        {
            ...restParams,
            serviceCategoryFilter: resolvedFilter,
        },
        options
    );
};

export const fetchMyDonations = (params, options) =>
    fetchServiceScheduleSummary(
        {
            ...params,
            serviceCategoryFilter: { $in: ["DONATIONS"] },
        },
        options
    );

export const fetchMySponsors = (params, options) =>
    fetchServiceScheduleSummary(
        {
            ...params,
            serviceCategoryFilter: { $in: ["SPONSORSHIP"] },
        },
        options
    );

/**
* Fetches the devotee's payment transactions from `api/appgen/filterAPI`
* (`moduleName: "Payments"`, `aspectType: "Payments"`).
*
* @param {Object} params
* @param {string} params.memberId - Logged-in devotee MongoDB `_id`
* @param {string} [params.userName=""] - Optional devotee full name
* @param {number} [params.skip=0]
* @param {number} [params.next=1220]
* @param {Object} [options]
* @param {AbortSignal} [options.signal]
* @returns {Promise<{ count: number, records: Array<Object> }>}
*/
export const fetchMyPayments = async (
    { memberId, userName = "", skip = 0, next = 1220 },
    { signal } = {}
) => {
    if (!memberId) {
        return { count: 0, records: [] };
    }

    const payload = {
        componentConfig: {
            moduleName: "Payments",
            aspectType: "Payments",
            query: {
                aspectType: "Payments",
                memberId: String(memberId).trim(),
            },
            userName: String(userName || "").trim(),
            productID: ENV_CONFIG.PRODUCT_ID,
            clientID: ENV_CONFIG.CLIENT_ID,
            skip,
            next,
        },
    };

    const rawResponse = await apiClient.post(ENDPOINTS.FILTER_API, payload, {
        signal,
        pre: true,
    });

    const root = unwrapApiEnvelope(rawResponse);
    const records = Array.isArray(root?.data) ? root.data : [];
    const count = resolveRecordCount(root, records);

    return {
        count,
        records,
    };
};

/**
 * Fetches the devotee's recurring donation schedules from `api/analytics/getrecurringData`.
 *
 * @param {Object} params
 * @param {string} params.memberId - Logged-in devotee MongoDB `_id`
 * @param {string} [params.startDate=""]
 * @param {string} [params.endDate=""]
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ count: number, records: Array<Object> }>}
 */
export const fetchRecurringDonations = async (
    { memberId, startDate = "", endDate = "" },
    { signal } = {}
) => {
    if (!memberId) {
        return { count: 0, records: [] };
    }

    const payload = {
        startDate: String(startDate || ""),
        endDate: String(endDate || ""),
        memberId: String(memberId).trim(),
        clientId: ENV_CONFIG.CLIENT_ID,
    };

    const endpoint =
        ENDPOINTS.GET_RECURRING_DATA || "api/analytics/getrecurringData";

    const rawResponse = await apiClient.post(endpoint, payload, {
        signal,
        pre: true,
    });

    const root = unwrapApiEnvelope(rawResponse);
    const records = Array.isArray(root?.data) ? root.data : [];
    const count = resolveRecordCount(root, records);

    return {
        count,
        records,
    };
};

export default {
    getCurrentMonthDateRange,
    fetchCumulativeAmount,
    fetchServiceScheduleSummary,
    fetchMyPujaBookings,
    fetchMyDonations,
    fetchMySponsors,
    fetchMyPayments,
    fetchRecurringDonations,
};
