import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

const DEFAULT_ALL_CLASSES = [
    {
        class: "Hindu School",
        timings: ["Sunday 10:30 - 11:45 AM"],
        contactPhone: [
            {
                contact: "Jyoti Mahesh",
                phoneNumber: "(502) 432-6771",
            }
        ],
        email: "HScontact@htky.org",
        website: "https://htky.vaaptech.com/hsky/",
        facebook: ""
    },
    {
        class: "Jain Classes",
        timings: ["Sunday 3:00 - 4:00pm"],
        contactPhone: [
            {
                contact: "Nirav Shah",
                phoneNumber: "(734) 262-1281",
            }
        ],
        email: "Louisvillejains@gmail.com",
        website: "",
        facebook: ""
    },
    {
        class: "Telugu Classes",
        timings: ["Sunday 4:00 - 6:00 PM"],
        contactPhone: [
            {
                contact: "Ramana Bhavaraju",
                phoneNumber: "(502) 509-7463",
            }
        ],
        email: "ramana.bhavaraju@manabadi.siliconandhra.org",
        website: "https://manabadi.siliconandhra.org/",
        facebook: ""
    },
    {
        class: "Tamil Classes",
        timings: ["Tuesday 6:30 - 8:00 PM"],
        contactPhone: [
            {
                contact: "Bhavani Rakshith",
                phoneNumber: "(516) 974-4715",
            },
            {
                contact: "Balasubramani Bhaskaran",
                phoneNumber: "(516) 974-4715",
            }
        ],
        email: "Kylouisvilletamilschool@gmail.com",
        website: "http://louisvilletamilschool.org/",
        facebook: ""
    },
    {
        class: "Yoga Classes",
        timings: ["Sunday 9:00 - 10:00 AM", "Mon-Wed-Fri 6:00 - 7:00 AM"],
        contactPhone: [
            {
                contact: "Sunder Iyer",
                phoneNumber: "(502) 298-7917",
            },
            {
                contact: "Sangamesh Gogi",
                phoneNumber: "(502) 767-4275",
            },
            {
                contact: "Raj Menaria",
                phoneNumber: "(917) 251-0414",
            }
        ],
        email: "Sunderiyer25@gmail.com",
        website: "",
        facebook: ""
    },
    {
        class: "Karate Classes",
        timings: ["Mon, Wed 6:15 - 7:00 PM"],
        contactPhone: [
            {
                contact: "Pankaj Sharma",
                phoneNumber: "(904) 415-4026",
            }
        ],
        email: "Psharma.net@gmail.com",
        website: "",
        facebook: ""
    },
    {
        class: "HSS Shaka",
        timings: ["Sunday 6:00- 7:30 PM"],
        contactPhone: [
            {
                contact: "Ravi Arusam",
                phoneNumber: "(502) 889-6069",
            },
            {
                contact: "Yogesh Kulkarini",
                phoneNumber: "(812) 786-6415",
            }
        ],
        email: "Ravi.arusam@gmail.com",
        website: "https://www.hssus.org/",
        facebook: "https://www.facebook.com/groups/hssomkarky/"
    },
    {
        class: "Hindi Paathshaala",
        timings: ["Fridays 7-8:30 pm"],
        contactPhone: [
            {
                contact: "Meenakshi Gupta",
                phoneNumber: "(502) 471-7997",
            }
        ],
        email: "HindiLouisville@gmail.com",
        website: "",
        facebook: "https://www.facebook.com/HindiLouisville"
    }
];

const adaptAllClassesData = (response) => {
    try {
        const rawItems = response?.data?.items || response?.items || response?.data || [];

        if (!Array.isArray(rawItems) || rawItems.length === 0) {
            return DEFAULT_ALL_CLASSES;
        }

        const mappedItems = rawItems.map((item, index) => {
            const defaultFallback = DEFAULT_ALL_CLASSES[index] || {};

            return {
                id: item?._id || item?.id || `class-${index}`,
                class: item?.class || item?.title || item?.className || defaultFallback.class || "Unknown Class",
                timings: Array.isArray(item?.timings) ? item.timings : defaultFallback.timings || [],
                contactPhone: Array.isArray(item?.contactPhone) ? item.contactPhone : defaultFallback.contactPhone || [],
                email: item?.email || defaultFallback.email || "",
                website: item?.website || defaultFallback.website || "",
                facebook: item?.facebook || defaultFallback.facebook || ""
            };
        });

        return mappedItems.length > 0 ? mappedItems : DEFAULT_ALL_CLASSES;
    } catch (error) {
        console.error('[Adapter Error] Failed to map All Classes Data:', error);
        return DEFAULT_ALL_CLASSES;
    }
};

const fetchAllClasses = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: 'All Classes',
        aspectType: 'allClasses',
        query: {
            aspectType: 'allClasses',
        },
        skip: 0,
        next: 20,
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });
    return adaptAllClassesData(response);
};

export const useGetAllClasses = () => {
    return useQuery({
        queryKey: ['allClasses'],
        queryFn: ({ signal }) => fetchAllClasses({ signal }),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
    });
};