import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

const DEFAULT_ETIQUETTE_VISIT_DATA = [
    {
        category: 'TEMPLE TOURS',
        items: [
            { id: 'tour-1', text: 'Everyone is welcome to visit our Temple.' },
            { id: 'tour-2', text: 'Please call 502-429-8888 or Email to Contactus@htky.org to book group tours.' },
            { id: 'tour-3', text: 'Please see the Temple hours below, before you plan your visit.' },
            { id: 'tour-4', text: 'Temple Hours:\n\nMonday-Friday:\n9:00 AM to 11:00 AM\n5:30 PM to 8:30 PM\n\nWeekends:\n9:00 AM to 2:00 PM\n3:00 PM to 8:30 PM' }
        ]
    },
    {
        category: 'TEMPLE ETIQUETTE',
        items: [
            { id: 'etiquette-1', text: 'The temple is a sacred, holy space, so practice polite, constrained behavior when visiting. Avoid loud conversation or laughter.' },
            { id: 'etiquette-2', text: 'Before you enter remove your shoes at the designated shoe rack and turn off or silence your phone and throw out any gum or other trash you might carry.' },
            { id: 'etiquette-3', text: 'Put away any cameras, as photography is not permitted within the temple.' },
            { id: 'etiquette-4', text: 'Avoid touching the shrines or statues. If you want, you can bring fruits and flowers to offer to the deities.Please hand them to the priests.' },
            { id: 'etiquette-5', text: 'If you like, listen along as the priest offers pujas and prayers. This prayer can take many forms, but you often won\'t need to be an active participant, so have a seat and appreciate the mantras and chanting.' },
            { id: 'etiquette-6', text: 'Offer a donation, if desired. If you feel like donating, place them in the donation box.' },
            { id: 'etiquette-7', text: 'Please keep your children away from running around and playing. This is very distracting to worshipers who is trying to concentrate on prayer.' }
        ]
    },
    {
        category: 'DRESS CODE',
        items: [
            { id: 'dress-1', text: 'We request that you come washed and clean. Wear traditional Indian clothing. If you don\'t have traditional clothes don\'t worry, opt for pants or long dresses.' },
            { id: 'dress-2', text: 'Dress as modestly as you can in loose-fitting clothes that allow you to sit cross-legged, making sure to cover your shoulders, back, and knees, at minimum.' },
            { id: 'dress-3', text: 'Before you enter remove your shoes at the designated shoe rack.' }
        ]
    }
];

const adaptEtiquetteVisitData = (response) => {
    try {
        const rawData = response?.data?.items || response?.items || response?.data;

        // If the API returns empty or fails, use the bulletproof static fallback
        if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
            return DEFAULT_ETIQUETTE_VISIT_DATA;
        }

        // Map backend category groups if they exist
        if (Array.isArray(rawData) && rawData[0]?.category) {
            return rawData.map(group => ({
                category: group?.category || 'General',
                items: (group?.items || []).map((item, index) => ({
                    id: item?._id || item?.id || `etiquette-${index}`,
                    text: item?.text || item?.content || item?.description || '',
                }))
            }));
        }

        return DEFAULT_ETIQUETTE_VISIT_DATA;
     } catch (error) {
        console.error('[Adapter Error] Failed to map Temple Etiquette Data:', error);
        return DEFAULT_ETIQUETTE_VISIT_DATA;
    }
};

const fetchEtiquetteVisit = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: 'Temple Etiquette',
        aspectType: 'templeEtiquette',
        query: {
            aspectType: 'templeEtiquette',
        },
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });
    return adaptEtiquetteVisitData(response);
};

export const useGetEtiquetteVisit = () => {
    return useQuery({
        queryKey: ['etiquetteVisit'],
        queryFn: fetchEtiquetteVisit,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
    });
};