import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

export const adaptDietiesData = (rawData) => {
    try {
        const list = Array.isArray(rawData?.data?.data)
            ? rawData.data.data
            : Array.isArray(rawData?.data)
                ? rawData.data
                : Array.isArray(rawData)
                    ? rawData
                    : [];
        
        if (!list || list.length === 0) {
            return [];
        }

        return list
            .filter((item) => {
                const status = String(item?.status || 'ACTIVE').toUpperCase();
                const hasName = Boolean(item?.refDataName || item?.name);
                return status === 'ACTIVE' && hasName;
            })
            .map((item) => {
                const rawName = item?.refDataName || item?.name || '';
                return {
                    id: item?._id || item?.id || rawName,
                    name: String(rawName).trim(),
                    image: item?.Image || item?.image || '',
                    sequenceId: item?.sequenceIdAsNumber ?? (parseInt(item?.sequenceId, 10) || 999999),
                };
            })
            .sort((a, b) => a.sequenceId - b.sequenceId);
    } catch (err) {
        console.error('[Adapter Error - Dieties]:', err);
        return [];
    }
};

const fetchDieties = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: 'Diety',
        aspectType: 'Diety Directory',
        query: {
            aspectType: 'Diety Directory',
        },
    });

    // Backend host aspgen (pre: false)
    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal, pre: false });
    return adaptDietiesData(response?.data || response);
};

export const useGetDieties = () => {
    return useQuery({
        queryKey: ['masterData', 'dieties'],
        queryFn: fetchDieties,
        staleTime: 1000 * 60 * 60 * 12, // 12 hours cache
        refetchOnWindowFocus: false,
    });
};

