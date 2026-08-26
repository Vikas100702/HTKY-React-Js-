import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

const DEFAULT_JAIN_SANGH_DATA = {
    headerInfo: {
        title: "Jain Sangh",
        image: "/src/assets/mahavir-swami.jpg",
        schedule: [
            { label: "Puja/Bhavana", value: "Every 3rd Saturday" },
            { label: "Puja Timings", value: "10:30 AM" },
            { label: "Venue", value: "Main Temple" }
        ]
    },
    aboutSection: {
        intro: "At the heart of right conduct for Jainism lies the five great vows that all Jains hold at the center of their lives:",
        vows: [
            { bold: "Nonviolence (Ahimsa):", text: "to not cause harm to any living beings" },
            { bold: "Truthfulness (Satya):", text: "to speak only the harmless truth" },
            { bold: "Non-stealing (Asetya):", text: "to not take anything not properly given" },
            { bold: "Chastity (Brahmacharya):", text: "to not indulge in sensual pleasure" },
            { bold: "Non-possession/Non-attachment (Aparigraha):", text: "complete detachment from people, places, and material things" }
        ],
        philosophyIntro: "These vows cannot be fully implemented without the acceptance of a philosophy of non-absolutism (Anekantvad) and the theory of relativity (Syadvad). Jainism also teaches that:",
        philosophyPoints: [
            "All events in the universe are random, fixed, and independent of previous events",
            "The universe has always existed and will always exist",
            "Nothing in the universe is ever destroyed or created; they simply change from one form to another",
            "Jiva, or conscious being, is reborn into a different body to live another life, until it achieves liberation"
        ],
        paragraphs: [
            "To Jains, 'God' are omniscient beings who have shed their karmic bondages and are free from the cycle of birth and rebirth. Thus, Jains bow down and aspire to be like the Tirthankaras, who show the true path to enlightenment. Jains believe that all living beings are capable of achieving 'Godhood'.",
            "At the Hindu Temple of Kentucky, our Jain Temple's principle deity (Moolnayak) is Mahavir Swami Bhagwan along with all the 24 Tirthankaras idols. Lord Mahavir, born in 599 B.C. in Bihar, India, spent 12 years in deep silence and meditation to achieve perfect enlightenment (keval jnana).",
            "Mahavir preached the path of right faith (samyak darshana), right knowledge (samyak jnana), and right conduct (samyak charitra) to attain liberation from karmic matter."
        ]
    },
    communitySection: {
        title: "Louisville Jain Community",
        intro: "The Louisville Jain Sangh is a close-knit community of more than 50 families primarily within the Kentuckiana region...",
        pathshalaIntro: "Pathshala kids learn about Jain principles through activities such as:",
        activities: [
            "Performing skits", "Storytelling", "Music", "Sutra recitals",
            "Dance performances", "Art-crafts", "Essay writings", "Charity drives",
            "Field trips to other Jain centers", "YJA retreats", "YJA conventions",
            "Participating in JAINA competitions", "Publishing articles"
        ],
        involvement: {
            label: "How to get involved:",
            link: "https://www.louisvillejains.org/"
        }
    },
    contactSection: {
        title: "Point of Contact",
        contacts: [
            "Bharat Shah: 502-235-7964",
            "Mala Ghiya: 502-500-5595",
            "Jignesh Shah: 502-999-7788",
            "Nirav Shah (Pathshala): 734-262-1281"
        ]
    }
};

const adaptJainSanghData = (response) => {
    try {
        const rawData = response?.data?.items || response?.data;
        if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
            return DEFAULT_JAIN_SANGH_DATA;
        }
        return DEFAULT_JAIN_SANGH_DATA;
    } catch (error) {
        console.error('[Adapter Error] Failed to map Jain Sangh Data:', error);
        return DEFAULT_JAIN_SANGH_DATA;
    }
};

const fetchJainSangh = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: 'Jain Sangh',
        aspectType: 'jainSanghDetails',
        query: { aspectType: 'jainSanghDetails' }
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });
    return adaptJainSanghData(response);
};

export const useGetJainSangh = () => {
    return useQuery({
        queryKey: ['jainSangh'],
        queryFn: fetchJainSangh,
        staleTime: 1000 * 60 * 30, // 30 mins cache
        gcTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
        retry: 1,
    });
};