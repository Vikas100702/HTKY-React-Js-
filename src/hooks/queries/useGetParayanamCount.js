/**
 * @file src/hooks/queries/useGetParayanamCount.js
 * @description TanStack Query hook to fetch the live Parayanam chanting count.
 * Includes a robust data adapter with try-catch safety nets.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { ENDPOINTS } from '../../constants/apiConstants';
import { ENV_CONFIG} from '../../config/envConfig';

/**
 * Helper Function: Generate Today's Date dynamically
 * Formats date strictly to MM/DD/YYYY for the backend API.
 */

const getTodaysDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
    });
};

/**
 * Helper Function: Format date strings for the UI (e.g., "05/10/2025" -> "May 10, 2025")
 */
const formatUIDate = (dateStr) => {
    if(!dateStr) return "";
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}
/**
 * 1. Data Adapter ("Model" Equivalent)
 * Safely extracts the 0th index data as requested, with zero-tolerance for undefined crashes.
 * @param {Object} rawData - The raw JSON response from the API
 * @returns {Object|null} Cleaned count data
 */



const adaptParayanamData = (rawData) => {
    try {
        // Ensure data exists before accessing the 0th index
        if (!rawData?.data || rawData.data.length === 0) {
            return null;
        }

        const event = rawData.data[0]; // Safely access the 0th index

        const eventName = event?.refDataName || "Laksha Lalitha Sahasranama Parayanam";
        const startDate = formatUIDate(event?.startDate);
        const endDate = formatUIDate(event?.endDate);
        const targetCount = parseInt(event?.maxCount || "100000", 10);

        // Ensure resultd exists before accessing the 0th index
        if (!event?.resultd || event.resultd.length === 0) {
            return {
                eventName,
                startDate,
                endDate,
                targetCount,
                sum: 0,
                kotiCount: 0
            };
        }

        const counts = event.resultd[0]; // Safely access the 0th index

        return {
            eventName,
            startDate,
            endDate,
            targetCount,
            sum: counts?.sum || 0,
            kotiCount: counts?.kotiCount || 0,
            participatingDevotees: counts?.count || 0
        }
    } catch (error) {
        console.error("[Adapter Error] Failed to parse Parayanam Data:", error);
        return null;
    }
};

/**
 * 2. Service Function
 * Handles the actual network request using our centralized apiClient.
 */

const fetchParayanamCount = async ({ signal }) => {
    const today = getTodaysDate(); // Dynamically generate today's date
    const payload = {
        "dataJson": {
            "startDate": today,
            "endDate": today,
            "memberId": ENV_CONFIG.PARAYANAM_MEMBER_ID,
            "eventId": ENV_CONFIG.PARAYANAM_EVENT_ID
        },
        "clientId": ENV_CONFIG.CLIENT_ID
    };

    const response = await apiClient.post(ENDPOINTS.EVENT_PARTICIPATE_LIST_API, payload, { signal });

    return adaptParayanamData(response);
};

/**
 * 3. Custom Hook (Server State Manager)
 */
export const useGetParayanamCount = () => {
    return useQuery({
        queryKey: ['parayanamCount'],
        queryFn: fetchParayanamCount,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        retry: 3,
        refetchOnWindowFocus: false, // Prevents aggressive spamming of the API
    });
};