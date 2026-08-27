import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

const DEFAULT_SAI_SATSANG_DATA = {
    headerInfo: {
        title: "SHIRDI SAI SATSANG",
        image: "/src/assets/sai_baba.jpg",
        scheduleNote: "Every Thursday and on Ram Navami, Guru Poornima, Dussehra",
        venue: "HTKY Private Puja Room",
        schedule: [
            { time: "6:00 PM - 6:15 PM", activity: "Shri Shirdi Saibaba Mandap Setup" },
            { time: "6:15 PM - 6:30 PM", activity: "Ashtotharam" },
            { time: "6:30 PM - 7:10 PM", activity: "Bhajans" },
            { time: "7:30 PM - 8:00 PM", activity: "Shri Shirdi Baba Dhoop Aarthi" },
            { time: "8:00 PM", activity: "Maha Prasad distribution" }
        ]
    },
    aboutSection: {
        title: "About Shirdi Sai Satsang:",
        content: "Louisville, KY - In 2009, a week before Guru Poornima, three Indian families started meeting weekly in the Private Puja Room for Satsang every Thursday to chant Shri Shirdi Saibaba Ashtotharam, Bhajans, and conclude with Baba Arathi."
    },
    purposeSection: {
        title: "Purpose & Mission:",
        content: "This Satsang is formed for any lawful purpose or purposes not expressly prohibited under the Act. The Satsang is organized and operated exclusively for spiritual, religious, charitable, and educational purposes within the meaning of Section 501(c)(3) of the Internal Revenue Code."
    },
    missionSection: {
        title: "Satsang's/Group's mission:",
        points: [
            "To provide a place of worship for the devotees of Sri Shirdi Sai Baba and follow his spiritual teachings through Sai Satcharitra.",
            "To provide a place for performing Sri Shirdi Sai Baba bhajans.",
            "To sponsor or support religious, cultural, educational, and charitable activities or organizations in the United States and worldwide.",
            "To strive for spiritual richness and human excellence by assimilating the values of Hindu scriptures into daily life.",
            "To establish and maintain a community worship place for conducting Hindu religious, educational, cultural, literary, and performing arts activities consistent with the above objectives."
        ]
    }
};

const adaptShirdiSaiSatsangData = (response) => {
    try {
        const rawData = response?.data?.items || response?.data;
        if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
            return DEFAULT_SAI_SATSANG_DATA;
        }

        return DEFAULT_SAI_SATSANG_DATA;
    } catch (error) {
        console.error('[Adapter Error] Failed to map Shirdi Sai Satsang Data:', error);
        return DEFAULT_SAI_SATSANG_DATA;
    }
};

const fetchShirdiSaiSatsang = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: 'Sai Satsang',
        aspectType: 'saiSatsangDetails',
        query: { aspectType: 'saiSatsangDetails' }
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });
    return adaptShirdiSaiSatsangData(response);
};

export const useGetAboutShirdiSaiSatsang = () => {
    return useQuery({
        queryKey: ['shirdiSaiSatsang'],
        queryFn: fetchShirdiSaiSatsang,
        staleTime: 1000 * 60 * 30, // 30 mins cache
        gcTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
        retry: 1,
    });
};