import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { BASE_URL, ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

export const adaptBoardCommittee = (rawData) => {
    try {
        if (!rawData?.data || !Array.isArray(rawData.data)) return [];

        const mappedBC = rawData.data.map((bc) => {
            // Normalize Image URL
            let formattedImage = null;
            if (bc.Image) {
                formattedImage = bc.Image.startsWith('http')
                    ? bc.Image
                    : `${BASE_URL}${bc.Image}`;
            }

            const fullName = `${bc?.refDataName || ""} ${bc?.refDataName3 || ""}`.trim()

            return {
                id: bc?._id,
                name: fullName || "",
                image: formattedImage,
                designation: bc?.designation || "",
                mgmtGroupType: bc?.managementGroupType || "",
                mgmtCategory: bc?.managementCategory || "",
                status: bc?.status
            };
        });

        return mappedBC.filter(bc => bc.status === 'ACTIVE');

    } catch (error) {
        console.error('[Adapter Error] Failed to map Board & CommitteeData:', error);
        return [];
    }
}

const fetchBC = async ({ signal }) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const previousYear = currentYear - 1;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const lteDate = `${month}/${day}/${currentYear}`;
    const gteDate = `${month}/${day}/${previousYear}`;

    const payload = buildComponentConfigPayload({
        moduleName: "Management Directory",
        aspectType: "managementDirectory",
        query: {
            aspectType: "managementDirectory",
            effDate: {
                $gte: gteDate,
                $lte: lteDate
            }
        }
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });
    return adaptBoardCommittee(response);
};

export const useGetBC = () => {
    return useQuery({
        queryKey: ['aboutBC'],
        queryFn: fetchBC,
        staleTime: 1000 * 60 * 30, // Cache for 30 minutes
        refetchOnWindowFocus: false,
    });
};