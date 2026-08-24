import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

const DEFAULT_TEMPLE_DATA = [
    {
        id: 'aboutTemple-who-we-are',
        title: 'WHO WE ARE',
        description: 'htky.vaaptech.com (short for Hindu Temple of Kentucky) is a non-profit spiritual organization established with the goal of serving the local community and beyond.\n\nWe provide a welcoming space for individuals and families to come together in prayer, meditation, and education, while embracing the timeless traditions of Hindu culture and spirituality.',
        imageUrl: '/src/assets/1.png',
    },
    {
        id: 'aboutTemple-what-we-do',
        title: 'WHAT WE DO',
        description: 'At htky.vaaptech.com, we strive to create an inclusive and harmonious space for spiritual and cultural exploration.\n\nOur offerings include:\n\nRegular Poojas & Festivals: Join us in celebrating important Hindu festivals like Diwali, Navaratri, and Janmashtami, as well as weekly and monthly temple rituals.\n\nSpiritual Classes: Participate in classes and discussions on the Bhagavad Gita, Ramayana, Upanishads, and other sacred texts.\n\nYoga & Meditation: Experience the transformative power of yoga and meditation, designed to help individuals attain mental peace, physical health, and spiritual awareness.\n\nYouth & Family Programs: We offer programs that cater to families, children, and youth, fostering a deeper connection with our cultural roots while strengthening community bonds.',
        imageUrl: '/src/assets/2.png',
    },
    {
        id: 'aboutTemple-vision',
        title: 'VISION',
        description: 'Our vision is to create a space that inspires individuals to discover their higher purpose, connect with their inner divinity, and contribute to the well-being of the world.\n\nWe aim to be a beacon of light, guiding individuals on their spiritual journey while preserving and sharing the rich cultural heritage of Hinduism.',
        imageUrl: '/src/assets/3.png',
    }
];

const adaptAboutTempleData = (response) => {
    try {
        const rawItems = response?.data?.items || response?.items || response?.data || [];

        if (!Array.isArray(rawItems) || rawItems.length === 0) {
            return DEFAULT_TEMPLE_DATA;
        }

        const mappedItems = rawItems.map((item, index) => {
            return {
                id: item?._id || item?.id || `aboutHtky-${index}`,
                title: item?.title || item?.heading || DEFAULT_TEMPLE_DATA[0].title,
                description: item?.description || item?.content || DEFAULT_TEMPLE_DATA[0].description,
                imageUrl: item?.imageUrl || item?.image || DEFAULT_TEMPLE_DATA[0].imageUrl,
            };
        });

        return mappedItems.length > 0 ? mappedItems : DEFAULT_TEMPLE_DATA;
    } catch (error) {
        console.error('[Adapter Error] Failed to map About HTKY Data:', error);
        return DEFAULT_TEMPLE_DATA;
    }
};

const fetchAboutTemple = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: 'About Section',
        aspectType: 'aboutHtky',
        query: {
            aspectType: 'aboutHtky',
        },
        skip: 0,
        next: 10,
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });
    return adaptAboutTempleData(response);
};

export const useGetAboutTemple = () => {
    return useQuery({
        queryKey: ['aboutTemple'],
        queryFn: fetchAboutTemple,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
    });
};