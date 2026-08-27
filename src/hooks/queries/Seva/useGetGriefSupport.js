/**
 * @file src/hooks/queries/Services/useGetGriefSupport.js
 * @description TanStack Query hook and Data Adapter for the Grief Support page.
 * Safely encapsulates all static content extracted from the UI designs.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

/**
 * Fallback static data in a structured format perfectly matching the UI design.
 */
const DEFAULT_GRIEF_SUPPORT_DATA = {
    headerInfo: {
        title: "Grief Support - Hindu Temple of Kentucky",
    },
    welcomeSection: {
        title: "Welcome",
        content: "At the Hindu Temple of Kentucky, we understand that grief is a profound and challenging experience. Our grief support services are here to help you navigate through this difficult time with compassion, understanding and spiritual guidance."
    },
    servicesSection: {
        title: "Our Services",
        services: [
            {
                id: "counseling",
                title: "Counseling and Guidance",
                content: "Our volunteers can offer individual and group sessions to provide emotional support and practical advice. These sessions can help you process your grief and find ways to cope with your loss."
            },
            {
                id: "spiritual",
                title: "Spiritual Support",
                content: "We offer spiritual support through prayers, rituals, and meditation sessions led by our temple priests. These spiritual practices can provide comfort and solace during your time of grief."
            },
            {
                id: "community",
                title: "Community Support",
                content: "Being part of a community can be incredibly healing. Our temple can try and connect you to various events and support groups where you can connect and find mutual support."
            }
        ]
    },
    accessSection: {
        title: "How to Access Our Services",
        content: "To access our grief support services, please visit our temple or contact us at:",
        contactInfo: {
            email: "out-reach@htky.org",
            phone: "(502)-429-8888",
            address: "4213 Accomack drive, Louisville, KY 40241"
        }
    }
};

/**
 * 1. Data Adapter / Normalizer
 */
const adaptGriefSupportData = (response) => {
    try {
        const rawData = response?.data?.items || response?.data;
        if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
            return DEFAULT_GRIEF_SUPPORT_DATA;
        }

        // Future mapping for dynamic CMS data
        return DEFAULT_GRIEF_SUPPORT_DATA;
    } catch (error) {
        console.error('[Adapter Error] Failed to map Grief Support Data:', error);
        return DEFAULT_GRIEF_SUPPORT_DATA;
    }
};

/**
 * 2. Service Fetcher
 */
const fetchGriefSupport = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: 'Grief Support',
        aspectType: 'griefSupportDetails',
        query: { aspectType: 'griefSupportDetails' }
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });
    return adaptGriefSupportData(response);
};

/**
 * 3. Custom Hook 
 */
export const useGetGriefSupport = () => {
    return useQuery({
        queryKey: ['griefSupport'],
        queryFn: fetchGriefSupport,
        staleTime: 1000 * 60 * 30, // 30 mins
        gcTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
        retry: 1,
    });
};