import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

// Restructured to support a Tabbed UI (Category-wise data)
const DEFAULT_LAND_DONORS_DATA = [
    {
        category: 'Land Donors',
        items: [
            { id: 'donor-rajan-jayashree', name: 'Rajan & Jayashree' },
            { id: 'donor-subash-aruna', name: 'Subash & Aruna' },
            { id: 'donor-mahendra-smitha', name: 'Mahendra & Smitha' },
            { id: 'donor-chandrakant-tarangini', name: 'Chandrakant & Tarangini' },
            { id: 'donor-uday-chitra', name: 'Uday & Chitra' }
        ]
    }
];

const adaptLandDonorsData = (response) => {
    try {
        const rawData = response?.data?.items || response?.items || response?.data;

        // If the API returns empty or fails, use the static category-wise fallback
        if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
            return DEFAULT_LAND_DONORS_DATA;
        }

        // If the backend already sends data grouped by categories
        if (Array.isArray(rawData) && rawData[0]?.category) {
            return rawData.map(group => ({
                category: group?.category || 'General',
                items: (group?.items || []).map((item, index) => ({
                    id: item?._id || item?.id || `donor-${index}`,
                    name: item?.name || item?.title || DEFAULT_LAND_DONORS_DATA[0].items[0].name,
                }))
            }));
        }

        // Fallback: If backend sends a flat list, wrap it in a default category for the Tabs
        return [
            {
                category: 'Land Donors',
                items: rawData.map((item, index) => ({
                    id: item?._id || item?.id || `donor-${index}`,
                    name: item?.name || item?.title || '',
                }))
            }
        ];

    } catch (error) {
        console.error('[Adapter Error] Failed to map Land Donors Data:', error);
        return DEFAULT_LAND_DONORS_DATA;
    }
};

const fetchLandDonors = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: 'Land Donors',
        aspectType: 'landDonors',
        query: {
            aspectType: 'landDonors',
        },
        skip: 0,
        next: 20,
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });
    return adaptLandDonorsData(response);
};

export const useGetLandDonors = () => {
    return useQuery({
        queryKey: ['landDonors'],
        queryFn: fetchLandDonors,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
    });
};