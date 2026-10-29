import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';
import { ENV_CONFIG } from '../../../config/envConfig';

const PRODUCT_ID = ENV_CONFIG.PRODUCT_ID;
const CLIENT_ID = ENV_CONFIG.CLIENT_ID;
export const IN_TEMPLE_CATEGORY = 'IN-TEMPLE';

/**
 * Safely parses date string (MM/dd/yyyy) to a normalized midnight Date object.
*/
export const parseServiceDate = (dateStr) => {
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
    } catch {
        return null;
    }
    return null;
};

export const adaptInTempleServicesData = (rawData) => {
    try {
        const items = Array.isArray(rawData?.data)
            ? rawData.data
            : Array.isArray(rawData?.data?.data)
                ? rawData.data.data
                : Array.isArray(rawData)
                    ? rawData
                    : [];

        if (items.length === 0) {
            return [];
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Active Expiry Date Check (today <= parsedEndDate)
        const activeItems = items.filter((item) => {
            try {
                if (item?.status && String(item.status).trim().toUpperCase() !== 'ACTIVE') {
                    return false;
                }
                if (!item?.endDate || typeof item.endDate !== 'string' || !item.endDate.trim()) {
                    return true;
                }
                const parsedEnd = parseServiceDate(item.endDate);
                return parsedEnd instanceof Date && !isNaN(parsedEnd.getTime())
                    ? today <= parsedEnd
                    : true;
            } catch {
                return true;
            }
        });

        // Display Sorting Check (sequenceId ascending)
        activeItems.sort((a, b) => {
            const seqA = parseInt(a?.sequenceIdAsNumber ?? a?.sequenceId ?? '999999', 10);
            const seqB = parseInt(b?.sequenceIdAsNumber ?? b?.sequenceId ?? '999999', 10);
            return (isNaN(seqA) ? 999999 : seqA) - (isNaN(seqB) ? 999999 : seqB);
        });

        return activeItems.map((item) => {
            const rawAmount = String(item?.serviceAmount || '0').replace(/[^0-9.]/g, '');
            const parsedAmount = parseFloat(rawAmount) || 0;

            const rawImage = item?.Image || item?.image || '';
            let resolvedImage = '';
            if (typeof rawImage === 'string' && rawImage.trim().length > 0) {
                resolvedImage = rawImage.startsWith('http')
                    ? rawImage
                    : `${ENV_CONFIG.BASE_URL}${rawImage}`;
            }

            const rawDietySelected = String(item?.isDietySelected || item?.isDietySelectedId || '').trim().toUpperCase();
            const rawDT = String(item?.isDTVisible || item?.isDtVisible || '').trim().toUpperCase();
            const rawTime = String(item?.isTimeVisible || item?.isTimeVisibleId || '').trim().toUpperCase();
            const rawQty = String(item?.qtyCounter || item?.qtyCounterId || '').trim().toUpperCase();

            return {
                id: item?._id || item?.refDataName || Math.random().toString(36).substring(2, 9),
                title: item?.refDataName || 'Temple Service',
                description: item?.description || '',
                imageUrl: resolvedImage,
                amount: parsedAmount,
                serviceAmount: item?.serviceAmount || '0',

                // Diety Dropdown Visibility Check
                isDietySelected: rawDietySelected === 'YES',
                dietyName: item?.dietyName || item?.DietyName || '',

                // Date Selector Button Visibility
                isDTVisible: rawDT === 'YES',

                // Time Selector Button Visibility
                isTimeVisible: rawTime === 'YES',

                // Quantity Stepper Counter Visibility
                qtyCounterEnabled: rawQty === 'YES',

                // Daily Booking Limit Check
                bookingLimitPerDay: parseInt(item?.BookingLimitPerDay ?? item?.bookingLimitPerDay ?? '0', 10) || 0,

                // Calendar & Tithi recurrence controls
                dayTypes: item?.dayTypes || '',
                startDate: item?.startDate || '',
                endDate: item?.endDate || '',

                // Holding Dates exclusion
                holdingDates: item?.holdingDates || '',

                // Service Occurrences Cluster
                serviceOccurrencesNo: parseInt(item?.serviceOccurrencesNo || '1', 10) || 1,

                // Greyscale Availability Check Attributes
                isAvailable: parseInt(item?.isAvailable ?? item?.availabilityInd ?? 0, 10) || 0,
                availableCount: parseInt(item?.availableCount ?? item?.AvailableCount ?? 0, 10) || 0,
                startTime: item?.startTime || '',
                endTime: item?.endTime || '',

                serviceTypes: item?.serviceTypes || '',
                serviceCategoryTypes: item?.serviceCategoryTypes || IN_TEMPLE_CATEGORY,
                status: item?.status || 'ACTIVE',
                sequenceId: item?.sequenceIdAsNumber ?? (parseInt(item?.sequenceId, 10) || 999999),
            };
        });
    } catch (error) {
        console.error('[useGetServices][Adapter Error]:', error);
        return [];
    }
};

const fetchInTempleServices = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: 'Temple Services',
        aspectType: 'ServiceSetup',
        collectionType: 'Business',
        query: {
            aspectType: 'ServiceSetup',
            serviceCategoryTypes: IN_TEMPLE_CATEGORY,
            sourceTypes: 'WEBSITE',
            status: 'ACTIVE',
        },
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });
    return adaptInTempleServicesData(response?.data || response);
};

export const useGetServices = () => {
    return useQuery({
        queryKey: ['templeServices', IN_TEMPLE_CATEGORY],
        queryFn: fetchInTempleServices,
        staleTime: 1000 * 60 * 15,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        retry: 1,
    });
};

export const adaptServiceAvailability = (rawData) => {
    try {
        const list = Array.isArray(rawData?.data)
            ? rawData.data
            : Array.isArray(rawData?.data?.data)
                ? rawData.data.data
                : [];

        const countMap = {};
        list.forEach((entry) => {
            const dateKey = entry?._id || entry?.id;
            if (dateKey && typeof dateKey === 'string') {
                countMap[dateKey.trim()] = parseInt(entry?.count ?? 0, 10) || 0;
            }
        });
        return countMap;
    } catch {
        return {};
    }
};

/**
 * Fetches slot capacity map for items with bookingLimitPerDay > 0
 */
export const fetchServiceAvailability = async (
    { serviceSetup, startDate = '', endDate = '', serviceTypes = '' },
    signal
) => {
    try {
        const payload = {
            clientId: CLIENT_ID,
            aspectType: 'serviceBooking',
            ServiceSetup: serviceSetup,
            startDate,
            endDate,
            serviceTypes,
        };

        const response = await apiClient.post(
            ENDPOINTS.GET_SERVICE_AVAILABILITY || '/api/bookingService/getServiceAvailability',
            payload,
            { signal }
        );

        return adaptServiceAvailability(response?.data || response);
    } catch (err) {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') return {};
        console.error('[useGetServices][fetchServiceAvailability Error]:', err);
        return {};
    }
};

/**
 * Lunar Tithi Next 90 Days Fetcher
 */
export const fetchTithiDates = async (tithiName, signal) => {
    if (!tithiName || typeof tithiName !== 'string' || !tithiName.trim()) {
        return [];
    }
    try {
        const payload = {
            componentConfig: {
                moduleName: 'Temple Services',
                aspectType: 'ServiceSetup',
                productID: PRODUCT_ID,
                clientID: CLIENT_ID,
                tithi: tithiName.trim().toUpperCase(),
            },
        };

        const response = await apiClient.post(
            ENDPOINTS.GET_THITHI_NEXT_90_DAYS || '/api/event/getThithiNext90Days',
            payload,
            { signal }
        );

        const rawList = Array.isArray(response?.data?.data)
            ? response.data.data
            : Array.isArray(response?.data)
                ? response.data
                : [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return rawList
            .filter((d) => d?.startDate && new Date(d.startDate) >= today)
            .map((d) => new Date(d.startDate))
            .sort((a, b) => a.getTime() - b.getTime());
    } catch (err) {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') return [];
        console.error('[useGetServices][fetchTithiDates Error]:', err);
        return [];
    }
};


