import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';


export const STATIC_CONTACT_INFO = [
    {
        id: 'puja-inquiries',
        title: "For Puja Related Inquiries:",
        contacts: [
            { email: "poojacommittee@htky.org", phone: "(502)-429-8888" }
        ]
    },
    {
        id: 'facilities-inquiries',
        title: "For Facilities Related Inquiries:",
        contacts: [
            { email: "hallrental@htky.org", phone: "+1 (502)-429-8888" }
        ]
    },
    {
        id: 'other-inquiries',
        title: "For all Other Inquiries:",
        contacts: [
            { email: "hospitality@htky.org", phone: "+1 (502)-429-8888" },
            { email: "outreach@htky.org", phone: "+1 (502)-429-8888" },
            { email: "volunteer@htky.org", phone: "+1 (502)-429-8888" }
        ]
    }
];

export const useGetContactSettings = () => {
    return {
        data: STATIC_CONTACT_INFO,
        isLoading: false,
        isError: false
    };
};

// List of States
export const adaptStatesData = (rawData) => {
    if (!rawData?.data || !Array.isArray(rawData.data)) return [];

    return rawData.data.map(item => ({
        code: item?.refDataCode || "",
        name: item?.refDataName || ""
    })).filter(state => state.code && state.name).sort((a, b) => a.name.localeCompare(b.name));
};

const fetchStates = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: "Master Data Management",
        aspectType: "stateTypes",
        query: { aspectType: "stateTypes" }
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal, pre: true });
    return adaptStatesData(response);
};

export const useGetStates = () => {
    return useQuery({
        queryKey: ['masterData', 'states'],
        queryFn: fetchStates,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours cache validity
        refetchOnWindowFocus: false,
    });
};

// List of Cities
export const adaptCitiesData = (rawData) => {
    if (!rawData?.data || !Array.isArray(rawData.data)) return [];

    return rawData.data.map(item => ({
        name: item?.refDataName || "",
        statesCode: item?.refDataCode || ""
    })).filter(city => city.name).sort((a, b) => a.name.localeCompare(b.name));
};

const fetchCities = async ({ queryKey, signal }) => {
    const stateCode = queryKey;
    if (!stateCode) return [];
    const payload = buildComponentConfigPayload({
        moduleName: "Master Data Management",
        aspectType: "cityTypes",
        query: { aspectType: "cityTypes", refDataCode: stateCode }
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal, pre: true });
    return adaptCitiesData(response);
};

export const useGetCities = (stateCode) => {
    return useQuery({
        queryKey: stateCode,
        queryFn: fetchCities,
        enabled: !!stateCode, // ONLY fetch if a state is selected
        staleTime: 1000 * 60 * 60 * 24, // 24 hours cache validity
        refetchOnWindowFocus: false,
    });
};

// List of Regards
export const adaptRegardsData = (rawData) => {
    if (!rawData?.data || !Array.isArray(rawData.data)) return [];

    return rawData.data.map(item => ({
        name: item?.refDataName || ""
    })).filter(regard => regard.name).sort((a, b) => a.name.localeCompare(b.name));
};

const fetchRegards = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: "Master Data Management",
        aspectType: "Regardingtypes",
        query: { aspectType: "Regardingtypes" }
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal, pre: true });
    return adaptRegardsData(response);
};

export const useGetRegards = () => {
    return useQuery({
        queryKey: ['masterData', 'regards'],
        queryFn: fetchRegards,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours cache validity
        refetchOnWindowFocus: false,
    });
};


// SUBMIT CONTACT FORM

const submitContactFormRequest = async (formData) => {
    const response = await apiClient.post(ENDPOINTS.SUBMIT_FORM_DATA_API, formData, { pre: true });
    return response.data;
};

export const useSubmitContactForm = () => {
    return useMutation({
        mutationFn: submitContactFormRequest,
        onError: (error) => {
            console.error('[Mutation Error] Contact Form Submit failed:', error);
        }
    });
};