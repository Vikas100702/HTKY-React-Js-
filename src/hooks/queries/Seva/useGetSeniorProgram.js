import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

const DEFAULT_SENIOR_PROGRAM_DATA = {
    headerInfo: {
        title: "Senior Program - Hindu Temple of KY",
        subtitle: "Embracing Wisdom and Community",
    },
    welcomeSection: {
        title: "Welcome to the Senior Program",
        content: "We are pleased to invite the senior members of our community to participate in our comprehensive and engaging Senior Program at the Hindu Temple of Kentucky (KY). This program is designed to provide a supportive environment where wisdom and experience are honored, and seniors can engage in a variety of activities that promote spiritual, social, and cultural well-being."
    },
    activitiesSection: {
        title: "Activities and Events",
        activities: [
            { bold: "Yoga and Meditation Sessions:", text: "Enhance physical health and mental peace through guided yoga and meditation classes." },
            { bold: "Bhajan and Kirtan:", text: "Participate in soulful singing and chanting sessions to deepen spiritual connections." },
            { bold: "Cultural Celebrations:", text: "Engage in the festivities of traditional Hindu holidays and events, fostering community bonds." },
            { bold: "Educational Workshops:", text: "Attend informative sessions on topics ranging from health and wellness to technology usage." },
            { bold: "Social Gatherings:", text: "Participate in regular meetups and tea parties to share stories and experiences." },
            { bold: "Volunteering Opportunities:", text: "Contribute to temple activities and community services, making a positive impact." }
        ]
    },
    contactInfo: {
        phone: "(502)-429-8888",
        email: "out-reach@htky.org",
        address: "4213 Accomack drive, Louisville, KY 40241"
    },
    scheduleSection: {
        title: "Program Schedule",
        content: "Our Senior Program is conducted weekly, offering a variety of sessions to choose from. Detailed schedules and times will be updated regularly on our calendar."
    },
    joinUsSection: {
        title: "Join Us",
        content: "To join our Senior Program, please contact our office. We look forward to welcoming you to our Senior Program. For more information, please feel free to reach out:",
        closing: "Join us in celebrating the golden years with joy, wisdom, and community. Namaste"
    }
};

const adaptSeniorProgramData = (response) => {
    try {
        const rawData = response?.data?.items || response?.data;
        if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
            return DEFAULT_SENIOR_PROGRAM_DATA;
        }

        return DEFAULT_SENIOR_PROGRAM_DATA;
    } catch (error) {
        console.error('[Adapter Error] Failed to map Senior Program Data:', error);
        return DEFAULT_SENIOR_PROGRAM_DATA;
    }
};

const fetchSeniorProgram = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: 'Senior Program',
        aspectType: 'seniorProgramDetails',
        query: { aspectType: 'seniorProgramDetails' }
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });
    return adaptSeniorProgramData(response);
};

export const useGetAboutSeniorProgram = () => {
    return useQuery({
        queryKey: ['seniorProgram'],
        queryFn: fetchSeniorProgram,
        staleTime: 1000 * 60 * 30, // 30 mins cache
        gcTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
        retry: 1,
    });
};