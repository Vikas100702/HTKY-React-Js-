import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { BASE_URL, ENDPOINTS } from '../../../constants/apiConstants';
import { ENV_CONFIG } from '../../../config/envConfig';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';
import { adaptServiceSetupData } from '../Services/Book_Services/useGetServices';

// UPCOMING EVENTS
export const adaptUpcomingEventsData = (rawData) => {
    try {
        if (!rawData?.data || rawData.data.length === 0) {
            console.warn('[Adapter] Upcoming Events API returned empty data.');
            return [];
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const formatDate = (dateStr) => {
            if (!dateStr) return "";
            const dateObj = new Date(dateStr);
            return dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        };

        const filteredData = rawData.data.filter(item => {
            const isParentServiceEmpty = !item.parentService || item.parentService.trim() === "";

            const isEndDateValid = !item.endDate || item.endDate.trim() === ""
                ? true
                : new Date(item.endDate) >= today; // End date is today or in the future

            return isEndDateValid && isParentServiceEmpty;
        });

        const sortedData = filteredData.sort((a, b) => {
            const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
            const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
            return dateA - dateB;
        });

        return sortedData.map(item => {
            const formattedStartDate = formatDate(item.startDate);
            const formattedEndDate = formatDate(item.endDate);

            let dateDisplay = formattedStartDate;
            if (formattedEndDate && formattedEndDate !== formattedStartDate) {
                dateDisplay = `${formattedStartDate} - ${formattedEndDate}`;
            }

            let timeDisplay = item.startTime || "";
            if (item.endTime) {
                timeDisplay += ` - ${item.endTime}`;
            }

            const parsedAmount = parseFloat(String(item?.serviceAmount ?? "0").replace(/[^0-9.]/g, "")) || 0;

            return {
                id: item?._id || Math.random().toString(36).substring(2, 9),
                title: item?.refDataName || "TEMPLE EVENT",
                thumbnailImage: item?.thumbnailImage
                    ? `${BASE_URL}${item.thumbnailImage}`
                    : item?.Image
                        ? `${BASE_URL}${item.Image}`
                        : "",
                fullImage: item?.Image ? `${BASE_URL}${item.Image}` : "",
                description: item?.description || "",
                serviceAmount: parsedAmount,
                serviceTypes: item?.serviceTypes || "",
                serviceCategoryTypes: item?.serviceCategoryTypes || "EVENTS",
                startDate: item?.startDate || "",
                endDate: item?.endDate || "",
                startTime: item?.startTime || "",
                endTime: item?.endTime || "",
                date: dateDisplay,
                timing: timeDisplay,
                rawStartDate: item?.startDate,
                rawItem: item,
            };
        });
    } catch (error) {
        console.error('[Adapter Error] Failed to map Temple Schedule Data:', error);
        return [];
    }
};

const fetchUpcomingEventsData = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: "Temple Services",
        aspectType: "ServiceSetup",
        query: {
            "aspectType": "ServiceSetup",
            "serviceCategoryTypes": "EVENTS",
            "sourceTypes": "WEBSITE",
            "status": "ACTIVE",

        }
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });
    return adaptUpcomingEventsData(response);
};

export const useUpcomingEventsData = () => {
    return useQuery({
        queryKey: ['upcomingEvents'],
        queryFn: fetchUpcomingEventsData,
        staleTime: 1000 * 60 * 60, // Cache for 1 hour
        retry: 2,
        refetchOnWindowFocus: false,
    });
};


// TEMPLE SCHEDULE
export const adaptTempleScheduleData = (rawData) => {
    try {
        if (!rawData?.data || rawData.data.length === 0) {
            console.warn('[Adapter] Temple Schedule API returned empty data.');
            return [];
        }

        return rawData.data.map(item => ({
            id: item?._id || Math.random().toString(36).substring(2, 9),
            scheduleType: item?.scheduleType?.toUpperCase() || "DAILY",
            title: item?.refDataName || "TEMPLE EVENT",
            timing: item?.timing || "",
        }));
    } catch (error) {
        console.error('[Adapter Error] Failed to map Temple Schedule Data:', error);
        return [];
    }
};

const fetchTempleScheduleData = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: "Daily Schedule",
        aspectType: "dailySchedule",
        query: {
            aspectType: "dailySchedule",
        }
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });
    return adaptTempleScheduleData(response);
};

export const useTempleScheduleData = () => {
    return useQuery({
        queryKey: ['templeSchedules'],
        queryFn: fetchTempleScheduleData,
        staleTime: 1000 * 60 * 60, // Cache for 1 hour
        retry: 2,
        refetchOnWindowFocus: false,
    });
};


// TODAY'S PANCHANGAM
export const adaptTodaysPanchangamData = (rawData) => {
    try {
        if (!rawData?.data || rawData.data.length === 0) {
            console.warn('[Adapter] Today\'s Panchangam API returned empty data.');
            return [];
        }

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Month 0 se start hota hai, isliye +1
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`; // Result: "2026-08-20"

        const formattedDate = today.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        }).toUpperCase().replace(/ /g, '-');

        const formattedDay = today.toLocaleDateString('en-US', {
            weekday: 'long'
        }).toUpperCase();

        // 2. Find Today's specific data from the API Array
        const todaysRecord = rawData.data.find(item => item.startDate === todayString);

        if (!todaysRecord) {
            return null;
        }

        return {
            id: todaysRecord?._id || Math.random().toString(36).substring(2, 9),
            date: formattedDate,
            day: formattedDay,
            tithi: todaysRecord?.Tithi || "",
            nakshatra: todaysRecord?.Nakshatra || "",
            yoga: todaysRecord?.Yoga || "",
            karana: todaysRecord?.Karana || "",
            sunRise: todaysRecord?.SunRise || "",
            sunSet: todaysRecord?.SunSet || "",
            rahuKalam: todaysRecord?.RahuKalam || ""
        };
    } catch (error) {
        console.error('[Adapter Error] Failed to map Today\'s Panchangam Data:', error);
        return [];
    }
};

const fetchTodaysPanchangamData = async ({ signal }) => {
    const currentYear = new Date().getFullYear();
    const payload = {
        "clientId": ENV_CONFIG.CLIENT_ID,
        "year": {
            "$gte": currentYear.toString,
            "$lte": (currentYear + 1).toString()
        }
    };

    const response = await apiClient.post(ENDPOINTS.GET_CALENDAR_API, payload, { signal });
    return adaptTodaysPanchangamData(response);
};

export const useTodaysPanchangamData = () => {
    return useQuery({
        queryKey: ['todaysPanchangam'],
        queryFn: fetchTodaysPanchangamData,
        staleTime: 1000 * 60 * 60, // Cache for 1 hour
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

/**
 * Formats `MM/DD/YYYY` date strings into hero display format e.g. `"Nov 01, 2024 - Nov 28, 2026"`.
 *
 * @param {string} startStr
 * @param {string} endStr
 * @returns {string}
 */
export const formatEventHeroDateRange = (startStr, endStr) => {
    const parseToDisplay = (raw) => {
        if (!raw || typeof raw !== "string") return "";
        const trimmed = raw.trim();
        const parts = trimmed.split("/");
        const dateObj =
            parts.length === 3
                ? new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]))
                : new Date(trimmed);
        if (Number.isNaN(dateObj.getTime())) return trimmed;
        return dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
        });
    };

    const startFormatted = parseToDisplay(startStr);
    const endFormatted = parseToDisplay(endStr);

    if (startFormatted && endFormatted && startFormatted !== endFormatted) {
        return `${startFormatted} - ${endFormatted}`;
    }
    return startFormatted || endFormatted || "";
};

/**
 * Normalizes a child event item (`parentService` response) for grouped or single-row display.
 *
 * @param {Object} item
 * @param {number} index
 * @returns {Object}
 */
// export const normalizeEventChildItem = (item, index) => {
//     const rawAmount = String(item?.serviceAmount ?? "0").replace(/[^0-9.]/g, "");
//     const amount = parseFloat(rawAmount) || 0;
//     const rawImage = item?.Image || item?.thumbnailImage || "";
//     const resolvedImage =
//         rawImage && /^https?:\/\//i.test(rawImage.trim())
//             ? rawImage.trim()
//             : rawImage
//                 ? `${BASE_URL}${rawImage.startsWith("/") ? rawImage : `/${rawImage}`}`
//                 : "";

//     return {
//         id: item?._id || item?.insertedId || `event-child-${index}`,
//         title: item?.refDataName || "Event Offering",
//         refDataName: item?.refDataName || "Event Offering",
//         amount,
//         parsedAmount: amount,
//         imageUrl: resolvedImage,
//         image: resolvedImage,
//         eventDisplayGroup: String(item?.EventDispay || item?.EventDisplay || "").trim(),
//         isDTVisible: String(item?.isDTVisible || "").trim().toUpperCase(),
//         isTimeVisible: String(item?.isTimeVisible || "").trim().toUpperCase(),
//         dayTypes: String(item?.dayTypes || "").trim(),
//         holdingDates: String(item?.holdingDates || "").trim(),
//         serviceOccurrencesNo: parseInt(item?.serviceOccurrencesNo, 10) || 1,
//         bookingLimitPerDay: parseInt(item?.bookingLimitPerDay ?? item?.BookingLimitPerDay, 10) || 0,
//         isAvailable: parseInt(item?.isAvailable, 10) || 0,
//         availableCount: parseInt(item?.availableCount, 10) || 0,
//         qtyCounter: String(item?.qtyCounter || "").trim().toUpperCase(),
//         qtyCounterEnabled: String(item?.qtyCounter || "").trim().toUpperCase() === "YES",
//         startDate: String(item?.startDate || "").trim(),
//         endDate: String(item?.endDate || "").trim(),
//         startTime: String(item?.startTime || "").trim(),
//         endTime: String(item?.endTime || "").trim(),
//         serviceTypes: item?.serviceTypes || "",
//         serviceCategoryTypes: item?.serviceCategoryTypes || "EVENTS",
//         includeSankalpam: item?.includeSankalpam || "",
//         description: item?.description || "",
//         rawItem: item,
//     };
// };

/**
 * Fetches a single parent event (by `_id` or `refDataName`) and, ONLY when its `serviceAmount`
 * is empty/0, fetches child offerings (`parentService`) and partitions them into grouped
 * (`EventDispay` non-empty) vs. ungrouped single-row (`EventDispay` empty) collections.
 *
 * @param {{ eventId?: string, eventName?: string }} params
 */
export const useEventDetailData = ({ eventId = "", eventName = "" }) => {
    const cleanId = String(eventId || "").trim();
    const cleanName = String(eventName || "").trim();

    return useQuery({
        queryKey: ["eventDetail", cleanId, cleanName],
        enabled: Boolean(cleanId || cleanName),
        queryFn: async ({ signal }) => {
            // 1. Fetch parent events list from Temple Services -> EVENTS
            const parentPayload = buildComponentConfigPayload({
                moduleName: "Temple Services",
                aspectType: "ServiceSetup",
                query: {
                    aspectType: "ServiceSetup",
                    serviceCategoryTypes: "EVENTS",
                    sourceTypes: "WEBSITE",
                    status: "ACTIVE",
                },
            });

            const parentRes = await apiClient.post(ENDPOINTS.FILTER_API, parentPayload, { signal });
            const parentList = Array.isArray(parentRes?.data)
                ? parentRes.data
                : Array.isArray(parentRes?.data?.data)
                    ? parentRes.data.data
                    : [];

            const matchedParent =
                parentList.find((ev) => cleanId && String(ev?._id) === cleanId) ||
                parentList.find(
                    (ev) =>
                        cleanName &&
                        String(ev?.refDataName || "").trim().toLowerCase() === cleanName.toLowerCase()
                ) ||
                null;

            if (!matchedParent) {
                return {
                    event: null,
                    hasDirectAmount: false,
                    groupedSections: [],
                    ungroupedItems: [],
                };
            }

            const parsedAmount =
                parseFloat(String(matchedParent?.serviceAmount ?? "0").replace(/[^0-9.]/g, "")) || 0;
            const rawImg = matchedParent?.Image || matchedParent?.thumbnailImage || "";
            const resolvedImage =
                rawImg && /^https?:\/\//i.test(rawImg.trim())
                    ? rawImg.trim()
                    : rawImg
                        ? `${BASE_URL}${rawImg.startsWith("/") ? rawImg : `/${rawImg}`}`
                        : "";

            const normalizedParent = {
                id: matchedParent._id,
                title: matchedParent.refDataName || "Temple Event",
                refDataName: matchedParent.refDataName || "Temple Event",
                imageUrl: resolvedImage,
                description: matchedParent.description || "",
                amount: parsedAmount,
                dateRangeLabel: formatEventHeroDateRange(
                    matchedParent.startDate,
                    matchedParent.endDate
                ),
                startDate: matchedParent.startDate || "",
                endDate: matchedParent.endDate || "",
                startTime: matchedParent.startTime || "",
                endTime: matchedParent.endTime || "",
                serviceTypes: matchedParent.serviceTypes || "",
                serviceCategoryTypes: matchedParent.serviceCategoryTypes || "EVENTS",
                includeSankalpam: matchedParent.includeSankalpam || "",
                rawItem: matchedParent,
            };

            // 2. If parent event already has a direct serviceAmount > 0, skip child offerings API
            if (parsedAmount > 0) {
                return {
                    event: normalizedParent,
                    hasDirectAmount: true,
                    groupedSections: [],
                    ungroupedItems: [],
                };
            }

            // 3. Otherwise fetch child offerings via `parentService: refDataName`
            const childPayload = {
                componentConfig: {
                    moduleName: "Temple Events",
                    productID: ENV_CONFIG.PRODUCT_ID,
                    clientID: ENV_CONFIG.CLIENT_ID,
                    aspectType: "ServiceSetup",
                    query: {
                        sourceTypes: "WEBSITE",
                        aspectType: "ServiceSetup",
                        parentService: normalizedParent.refDataName,
                        serviceCategoryTypes: "EVENTS",
                    },
                    userName: "",
                    skip: 0,
                    next: 1024,
                },
            };

            const childRes = await apiClient.post(ENDPOINTS.FILTER_API, childPayload, { signal });
            const rawChildren = Array.isArray(childRes?.data)
                ? childRes.data
                : Array.isArray(childRes?.data?.data)
                    ? childRes.data.data
                    : [];

            const todayMidnight = new Date();
            todayMidnight.setHours(0, 0, 0, 0);

            const activeChildren = adaptServiceSetupData(rawChildren, "EVENTS").map(
                (normalized) => ({
                    ...normalized,
                    eventDisplayGroup: String(
                        normalized.rawItem?.EventDispay ||
                        normalized.rawItem?.EventDisplay ||
                        ""
                    ).trim(),
                })
            );

            // Partition into Grouped (`EventDispay` non-empty) vs Single Rows (`EventDispay` empty)
            const groupMap = new Map();
            const ungroupedItems = [];

            activeChildren.forEach((child) => {
                if (child.eventDisplayGroup) {
                    if (!groupMap.has(child.eventDisplayGroup)) {
                        groupMap.set(child.eventDisplayGroup, []);
                    }
                    groupMap.get(child.eventDisplayGroup).push(child);
                } else {
                    ungroupedItems.push(child);
                }
            });

            const groupedSections = Array.from(groupMap.entries()).map(([groupTitle, items]) => ({
                groupTitle,
                items,
            }));

            return {
                event: normalizedParent,
                hasDirectAmount: false,
                groupedSections,
                ungroupedItems,
            };
        },
        staleTime: 1000 * 60 * 15,
        refetchOnWindowFocus: false,
        retry: 1,
    });
};
