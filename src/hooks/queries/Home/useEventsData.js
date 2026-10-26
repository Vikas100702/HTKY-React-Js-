import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { BASE_URL, ENDPOINTS } from '../../../constants/apiConstants';
import { ENV_CONFIG } from '../../../config/envConfig';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

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

            return {
                id: item?._id || Math.random().toString(36).substring(2, 9),
                title: item?.refDataName || "TEMPLE EVENT",
                thumbnailImage: item?.Image ? `${BASE_URL}${item.Image}` : "",
                date: dateDisplay, // "Aug 22 - Fri, Aug 23" OR just "Thu, Aug 22"
                timing: timeDisplay, // "5:00 PM - 8:30 PM"
                rawStartDate: item?.startDate, // Kept for debugging/future reference
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