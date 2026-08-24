import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { BASE_URL, ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

export const adaptDeityData = (rawData) => {
    try {
        if (!rawData?.data || !Array.isArray(rawData.data)) return [];

        const mappedDeities = rawData.data.map((deity) => {
            let formattedImage = null;
            if (deity.image) {
                formattedImage = deity.image.startsWith('http')
                    ? deity.image
                    : `${BASE_URL}${deity.image}`;
            }

            return {
                id: deity?._id,
                name: deity?.refDataName || "",
                image: formattedImage,
                description: deity?.Description || "",
                status: deity?.status
            };
        });
        return mappedDeities.filter(d => d.description && d.status === 'ACTIVE');

    } catch (error) {
        console.error('[Adapter Error] Failed to map Deity Data:', error);
        return [];
    }
};

const fetchDeities = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: "Diety",
        aspectType: "Diety Directory",
        query: {
            aspectType: "Diety Directory",
        },
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });
    return adaptDeityData(response);
};

export const useGetAboutDeity = () => {
    return useQuery({
        queryKey: ['aboutDeity'],
        queryFn: fetchDeities,
        staleTime: 1000 * 60 * 30, // Cache for 30 minutes
        refetchOnWindowFocus: false,
    });
};