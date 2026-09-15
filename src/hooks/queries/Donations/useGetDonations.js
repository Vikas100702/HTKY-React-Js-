import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';
import { ENV_CONFIG } from "../../../constants/envConfig";


// Version-locked Master Data Config
// const PRODUCT_ID = '62c807133d9ee4045ab78d4d';
// const CLIENT_ID = '66391d25c742322da009f702';

// ============================================================================
// ENTERPRISE OBSERVABILITY & TELEMETRY
// ============================================================================

/**
 * Dispatches structured logs for APM / Observability tooling (e.g., Sentry, Datadog).
 * @param {'info' | 'warn' | 'error'} level - Log severity level
 * @param {string} message - Human-readable diagnostic description
 * @param {Object} [context={}] - Metadata payload including breadcrumbs and IDs
 */
const logTelemetry = (level, message, context = {}) => {
    const telemetryEvent = {
        timestamp: new Date().toISOString(),
        module: 'HTKY_DONATION_SERVER_STATE',
        level,
        message,
        context: {
            productId: ENV_CONFIG.PRODUCT_ID,
            clientId: ENV_CONFIG.CLIENT_ID,
            ...context
        }
    };

    if (level === 'error') {
        console.error(`[HTKY_APM][ERROR] ${message}`, telemetryEvent);
    } else if (level === 'warn') {
        console.warn(`[HTKY_APM][WARN] ${message}`, telemetryEvent);
    } else {
        console.log(`[HTKY_APM][INFO] ${message}`, telemetryEvent);
    }
};

// ============================================================================
// DEFENSIVE DATA ADAPTERS & PARSERS
// ============================================================================

/**
 * Parses MM/DD/YYYY formatted string into a JavaScript Date object at midnight.
 * @param {string} dateStr - Date string in MM/DD/YYYY format
 * @returns {Date|null} Midnight Date instance or null if invalid
 */
export const parseDateString = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) {
        return null;
    }

    try {
        const parts = dateStr.trim().split('/');
        if (parts.length === 3) {
            const month = parseInt(parts[0], 10) - 1;
            const day = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);

            const parsedDate = new Date(year, month, day, 0, 0, 0, 0);
            return isNaN(parsedDate.getTime()) ? null : parsedDate;
        }
    } catch (error) {
        logTelemetry('warn', 'Date parsing failed in parseDateString', { dateStr, error: error.message });
        return null;
    }

    return null;
};

/**
 * Normalizes raw categories response into an active, sorted array.
 * @param {Object} rawData - Backend response payload
 * @returns {Array<Object>} Sanitized category list
 */
export const adaptCategoriesData = (rawData) => {
    try {
        const rawList = Array.isArray(rawData?.data)
            ? rawData.data
            : Array.isArray(rawData?.data?.data)
                ? rawData.data.data
                : Array.isArray(rawData)
                    ? rawData
                    : [];

        return rawList
            .filter((item) => item?.status === 'ACTIVE' && item?.refDataName && typeof item.refDataName === 'string')
            .map((item) => ({
                id: item?._id || item?.id || '',
                refDataCode: item?.refDataCode || 'DONATIONS',
                refDataName: item?.refDataName.trim(),
                displayName: (item?.displayName || item?.refDataName || '').trim(),
                description: item?.description || '',
                image: item?.image || '',
                sequenceId: item?.sequenceIdAsNumber ?? (parseInt(item?.sequenceId, 10) || 999999),
                isRecurring: (item?.isRecurring || '').toUpperCase() === 'ACTIVE'
            }))
            .sort((a, b) => a.sequenceId - b.sequenceId);
    } catch (error) {
        logTelemetry('error', 'Exception in adaptCategoriesData', { error: error.message });
        return [];
    }
};

/**
 * Filters and sanitizes raw Category Details (ServiceSetup) records.
 * Excludes inactive or expired items and normalizes casing variations.
 * @param {Object} rawData - Backend response payload
 * @returns {Array<Object>} Sanitized active service setup items
 */
export const adaptCategoryDetailsData = (rawData) => {
    try {
        const rawList = Array.isArray(rawData?.data)
            ? rawData.data
            : Array.isArray(rawData?.data?.data)
                ? rawData.data.data
                : Array.isArray(rawData)
                    ? rawData
                    : [];

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        return rawList
            .filter((item) => {
                // Status check
                if (item?.status && item.status.toUpperCase() !== 'ACTIVE') {
                    return false;
                }

                // Active Expiry Check: End date must be >= today. Null/empty end date is permanently active.
                if (!item?.endDate || !item.endDate.trim()) {
                    return true;
                }

                const parsedEndDate = parseDateString(item.endDate);
                if (!parsedEndDate) {
                    return true;
                }

                return today <= parsedEndDate;
            })
            .map((item) => {
                const rawAmount = (item?.serviceAmount || '').toString().replace(/[^0-9.]/g, '');
                const parsedAmount = parseFloat(rawAmount) || 0;

                return {
                    id: item?._id || item?.id || item?.refDataName || '',
                    refDataName: (item?.refDataName || 'Donation Service').trim(),
                    serviceTypes: item?.serviceTypes || '',
                    serviceCategoryTypes: item?.serviceCategoryTypes || 'DONATIONS',
                    description: item?.description || '',
                    image: item?.Image || item?.image || '',
                    serviceAmount: item?.serviceAmount || '',
                    parsedAmount,
                    isAnyAmount: parsedAmount <= 0,
                    isDTVisible: (item?.isDTVisible || item?.isDtVisible || 'NO').toUpperCase(),
                    isTimeVisible: (item?.isTimeVisible || 'NO').toUpperCase(),
                    qtyCounter: (item?.qtyCounter || 'NO').toUpperCase(),
                    startDate: item?.startDate || '',
                    endDate: item?.endDate || '',
                    startTime: item?.startTime || '',
                    endTime: item?.endTime || '',
                    dayTypes: item?.dayTypes || '',
                    holdingDates: item?.holdingDates || '',
                    bookingLimitPerDay: parseInt(item?.BookingLimitPerDay ?? item?.bookingLimitPerDay ?? 0, 10),
                    serviceOccurrencesNo: item?.serviceOccurrencesNo || '0',
                    sequenceId: item?.sequenceIdAsNumber ?? (parseInt(item?.sequenceId, 10) || 999999)
                };
            })
            .sort((a, b) => a.sequenceId - b.sequenceId);
    } catch (error) {
        logTelemetry('error', 'Exception in adaptCategoryDetailsData', { error: error.message });
        return [];
    }
};

// ============================================================================
// 1. QUERY: DONATION CATEGORIES
// ============================================================================

/**
 * Fetches active donation categories under refDataCode "DONATIONS".
 * @param {Object} context - TanStack Query execution context
 * @param {AbortSignal} context.signal - Native query cancellation signal
 * @returns {Promise<Array<Object>>} Resolved category list
 */
const fetchDonationCategories = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        query: {
            aspectType: 'serviceTypes',
            refDataCode: 'DONATIONS',
            status: 'ACTIVE'
        },
        moduleName: 'Master Data Management',
        aspectType: 'serviceTypes',
    });

    try {
        const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, {
            signal,
        });

        return adaptCategoriesData(response);
    } catch (error) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
            logTelemetry('info', 'Donation categories request aborted by caller.');
            return [];
        }

        logTelemetry('error', 'Failed fetching donation categories', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

/**
 * Hook to retrieve and cache active donation category tabs.
 * @returns {import('@tanstack/react-query').UseQueryResult<Array<Object>>}
 */
export const useGetDonationCategories = () => {
    return useQuery({
        queryKey: ['donations', 'categories'],
        queryFn: fetchDonationCategories,
        staleTime: 1000 * 60 * 30, // 30 minutes cache duration
        gcTime: 1000 * 60 * 60, // Keep in memory for 1 hour
        refetchOnWindowFocus: false,
        retry: 2
    });
};

// ============================================================================
// 2. QUERY: DONATION CATEGORY DETAILS
// ============================================================================

/**
 * Fetches active services setup under a specific category tab.
 * @param {Object} context - TanStack Query execution context
 * @param {Array} context.queryKey - Array containing query identifiers and categoryName
 * @param {AbortSignal} context.signal - Native query cancellation signal
 * @returns {Promise<Array<Object>>} Resolved service details list
 */
const fetchDonationDetails = async ({ queryKey, signal }) => {
    const [, , categoryName] = queryKey;

    if (!categoryName || typeof categoryName !== 'string' || !categoryName.trim()) {
        return [];
    }

    const payload = buildComponentConfigPayload({
        query: {
            aspectType: 'ServiceSetup',
            serviceTypes: categoryName.trim(),
            sourceTypes: 'WEBSITE',
            status: 'ACTIVE'
        },
        moduleName: 'Temple Services',
        aspectType: 'ServiceSetup',
    });

    try {
        const response = await apiClient.post(
            ENDPOINTS.FILTER_API,
            payload,
            {
                signal
            }
        );

        return adaptCategoryDetailsData(response);
    } catch (error) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
            logTelemetry('info', `Details fetch for category [${categoryName}] aborted.`);
            return [];
        }

        logTelemetry('error', `Failed fetching details for category [${categoryName}]`, {
            categoryName,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

/**
 * Hook to retrieve and cache donation service items for a selected category tab.
 * @param {string} categoryName - refDataName of the active tab
 * @returns {import('@tanstack/react-query').UseQueryResult<Array<Object>>}
 */
export const useGetDonationCategoryDetails = (categoryName) => {
    return useQuery({
        queryKey: ['donations', 'details', categoryName],
        queryFn: fetchDonationDetails,
        enabled: Boolean(categoryName && typeof categoryName === 'string' && categoryName.trim().length > 0),
        staleTime: 1000 * 60 * 5, // 5 minutes cache duration
        gcTime: 1000 * 60 * 15,
        refetchOnWindowFocus: false,
        retry: 2
    });
};

