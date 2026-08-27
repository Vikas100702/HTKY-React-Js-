import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

const DEFAULT_LOST_FOUND_DATA = {
    headerInfo: {
        title: "Lost and Found - Hindu Temple of KY",
        description: "Welcome to the Lost and Found page of the Hindu Temple of Kentucky. We are committed to assisting community members in retrieving their lost items and ensuring their return to the rightful owners. Please follow the instructions below to report a lost or found item."
    },
    contactEmail: "contactus@htky.org",
    sections: [
        {
            id: "report-lost",
            title: "Report a Lost Item",
            instruction: "If you have lost an item at the temple, kindly email us at contactus@htky.org with the following details:",
            requirements: [
                "Your name",
                "Contact information (email and phone number)",
                "Description of the lost item",
                "Date and location where the item was lost"
            ]
        },
        {
            id: "report-found",
            title: "Report a Found Item",
            instruction: "If you have found an item at the temple, please email us at contactus@htky.org with the following details:",
            requirements: [
                "Your name",
                "Contact information (email and phone number)",
                "Description of the found item",
                "Date and location where the item was found"
            ]
        }
    ]
};

const adaptLostFoundData = (response) => {
    try {
        const rawData = response?.data?.items || response?.data;
        if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
            return DEFAULT_LOST_FOUND_DATA;
        }
        return DEFAULT_LOST_FOUND_DATA;
    } catch (error) {
        console.error('[Adapter Error] Failed to map Lost and Found Data:', error);
        return DEFAULT_LOST_FOUND_DATA;
    }
};

const fetchLostFound = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: 'Lost and Found',
        aspectType: 'lostAndFoundDetails',
        query: { aspectType: 'lostAndFoundDetails' }
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });
    return adaptLostFoundData(response);
};

export const useGetLostFound = () => {
    return useQuery({
        queryKey: ['lostAndFound'],
        queryFn: fetchLostFound,
        staleTime: 1000 * 60 * 30, // 30 mins
        gcTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
        retry: 1,
    });
};