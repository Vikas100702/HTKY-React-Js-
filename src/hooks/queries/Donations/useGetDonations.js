import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';
import { ENV_CONFIG } from "../../../constants/envConfig";

export const HINDU_TITHIS = Object.freeze([
    'PRATIPADA',
    'DWITIYA',
    'TRITIYA',
    'CHATURTHI',
    'PANCHAMI',
    'SHASHTHI',
    'SAPTAMI',
    'ASHTAMI',
    'NAVAMI',
    'DASHAMI',
    'EKADASHI',
    'DWADASHI',
    'TRAYODASHI',
    'CHATURDASHI',
    'PURNIMA',
    'AMAVASYA',
    'SANKASHTI'
]);

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

export const parseIsoDateAgnostic = (isoString) => {
    if (!isoString || typeof isoString !== 'string') return null;

    try {
        const cleanDate = isoString.split('T')[0]; // "2026-10-14"
        const [year, month, day] = cleanDate.split('-').map((val) => parseInt(val, 10));

        if (!year || !month || !day) return null;
        return new Date(year, month - 1, day, 0, 0, 0, 0);
    } catch (error) {
        logTelemetry('warn', 'ISO Date parsing failed', { isoString, error: error.message });
        return null;
    }
};

export const extractTithiKeyword = (dayTypes) => {
    if (!dayTypes || typeof dayTypes !== 'string') return null;
    const upper = dayTypes.toUpperCase();

    for (const tithi of HINDU_TITHIS) {
        if (upper.includes(tithi)) {
            return tithi;
        }
    }
    return null;
};

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

export const adaptTithiDatesData = (rawData) => {
    try {
        const rawList = Array.isArray(rawData?.data)
            ? rawData.data
            : Array.isArray(rawData?.data?.data)
                ? rawData.data.data
                : [];

        const now = new Date();
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        return rawList
            .map((item) => {
                const parsedDate = parseIsoDateAgnostic(item?.startDate);
                return {
                    id: item?._id || '',
                    date: parsedDate,
                    paksha: item?.Paksha || '',
                    tithiDesc: item?.Tithi || '',
                    tithiName: item?.TithiName || ''
                };
            })
            .filter((item) => item.date !== null && item.date >= todayMidnight)
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
        logTelemetry('error', 'Exception in adaptTithiDatesData', { error: error.message });
        return [];
    }
};

export const formatDateToMMDDYYYY = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
};

export const adaptClientSettings = (rawData) => {
    const generalSetting =
        rawData?.result?.data?.[0]?.generalSetting ||
        rawData?.data?.[0]?.generalSetting ||
        {};

    return {
        currencySymbol: (generalSetting?.currencySymbol || '$').trim(),
        currencyCode: generalSetting?.currencyCode || 'USD',
        showSankalpam: Boolean(generalSetting?.showSanaklpam),
        generalDonationAmount: Boolean(generalSetting?.GeneralDonationAmount)
    };
};

export const adaptServiceAvailability = (rawData) => {
    // Agar statusCode "-1" ("Data Not Found") ho, iska matlab ZERO bookings hain
    if (rawData?.statusCode === '-1' || rawData?.statusCode === -1 || !Array.isArray(rawData?.data)) {
        return {};
    }

    const availabilityMap = {};
    rawData.data.forEach((item) => {
        const dateKey = (item?._id || item?.id || '').trim(); // MM/dd/yyyy
        if (dateKey) {
            availabilityMap[dateKey] = parseInt(item?.count ?? 0, 10);
        }
    });

    return availabilityMap;
};

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

export const fetchTithiDates = async ({ tithi, signal }) => {
    if (!tithi || typeof tithi !== 'string' || !tithi.trim()) {
        return [];
    }

    const payload = {
        componentConfig: {
            moduleName: 'Temple Services',
            aspectType: 'ServiceSetup',
            productID: ENV_CONFIG.PRODUCT_ID,
            clientID: ENV_CONFIG.CLIENT_ID,
            tithi: tithi.trim().toUpperCase()
        }
    };

    try {
        // Tithi API is hosted on aspgenpre.vaaptech.com:9000 as per contract
        const response = await apiClient.post(
            ENDPOINTS.GET_THITHI_NEXT_90_DAYS,
            payload,
            {
                signal,
            }
        );

        return adaptTithiDatesData(response);
    } catch (error) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
            return [];
        }
        logTelemetry('error', `Failed fetching Tithi dates for [${tithi}]`, { error: error.message });
        return [];
    }
};

export const useGetTithiDates = (tithi) => {
    const canonicalTithi = extractTithiKeyword(tithi);

    return useQuery({
        queryKey: ['tithi', 'next90days', canonicalTithi],
        queryFn: ({ signal }) => fetchTithiDates({ tithi: canonicalTithi, signal }),
        enabled: Boolean(canonicalTithi),
        staleTime: 1000 * 60 * 60 * 12, // Cache for 12 hours (Panchangam dates are stable)
        gcTime: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: false,
        retry: 1
    });
};

const fetchClientSettings = async ({ signal }) => {
    const payload = {
        action: 'getClientSetting',
        productId: ENV_CONFIG.PRODUCT_ID,
        clientId: ENV_CONFIG.CLIENT_ID
    };

    try {
        const response = await apiClient.post(
            ENDPOINTS.CLIENT_SETTINGS,
            payload,
            { signal, pre: false } // Settings API aspgen par hai
        );
        return adaptClientSettings(response);
    } catch (error) {
        if (error?.name === 'CanceledError') return adaptClientSettings({});
        return adaptClientSettings({});
    }
};

export const useGetClientSettings = () => {
    return useQuery({
        queryKey: ['temple', 'clientSettings', ENV_CONFIG.CLIENT_ID],
        queryFn: fetchClientSettings,
        staleTime: 1000 * 60 * 60, // 1 hour cache
        refetchOnWindowFocus: false,
        retry: 1
    });
};

const fetchServiceAvailability = async ({ queryKey, signal }) => {
    const [, , serviceSetup, serviceTypes] = queryKey;

    const payload = {
        clientId: ENV_CONFIG.CLIENT_ID,
        aspectType: 'serviceBooking',
        ServiceSetup: serviceSetup,
        startDate: '',
        endDate: '',
        serviceTypes: serviceTypes
    };

    try {
        const response = await apiClient.post(
            ENDPOINTS.GET_SERVICE_AVAILABILITY,
            payload,
            { signal, pre: true } 
        );
        return adaptServiceAvailability(response);
    } catch (error) {
        if (error?.name === 'CanceledError') return {};
        return {};
    }
};

export const useGetServiceAvailability = (serviceSetup, serviceTypes, enabled = false) => {
    return useQuery({
        queryKey: ['booking', 'availability', serviceSetup, serviceTypes],
        queryFn: fetchServiceAvailability,
        enabled: Boolean(enabled && serviceSetup && serviceTypes),
        staleTime: 1000 * 60 * 2, // 2 minutes cache
        refetchOnWindowFocus: false,
        retry: 1
    });
};

