import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

export const STATIC_CONTACT_INFO = Object.freeze([
    {
        id: 'puja-inquiries',
        title: 'For Puja Related Inquiries:',
        contacts: [
            { email: 'poojacommittee@htky.org', phone: '(502)-429-8888' }
        ]
    },
    {
        id: 'facilities-inquiries',
        title: 'For Facilities Related Inquiries:',
        contacts: [
            { email: 'hallrental@htky.org', phone: '+1 (502)-429-8888' }
        ]
    },
    {
        id: 'other-inquiries',
        title: 'For all Other Inquiries:',
        contacts: [
            { email: 'hospitality@htky.org', phone: '+1 (502)-429-8888' },
            { email: 'outreach@htky.org', phone: '+1 (502)-429-8888' },
            { email: 'volunteer@htky.org', phone: '+1 (502)-429-8888' }
        ]
    }
]);

export const useGetContactSettings = () => {
    return {
        data: STATIC_CONTACT_INFO,
        isLoading: false,
        isError: false
    };
};

export const adaptStatesData = (rawData) => {
    try {
        if (!rawData?.data || !Array.isArray(rawData.data)) return [];

        return rawData.data
            .map((item) => ({
                code: item?.refDataCode || '',
                name: item?.refDataName || ''
            }))
            .filter((state) => state.code && state.name)
            .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error(`[Adapter Error - States] ${new Date().toISOString()}:`, { error, rawData });
        return [];
    }
};

const fetchStates = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: 'Master Data Management',
        aspectType: 'stateTypes',
        query: { aspectType: 'stateTypes' },
        skip: 0,
        next: 2000
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal, pre: true });
    return adaptStatesData(response);
};

export const useGetStates = () => {
    return useQuery({
        queryKey: ['masterData', 'states'],
        queryFn: fetchStates,
        staleTime: 1000 * 60 * 60 * 24, // 24-hour cache validity
        refetchOnWindowFocus: false
    });
};

export const adaptCitiesData = (rawData) => {
    try {
        if (!rawData?.data || !Array.isArray(rawData.data)) return [];

        return rawData.data
            .map((item) => ({
                name: item?.refDataName || '',
                statesCode: item?.refDataCode || ''
            }))
            .filter((city) => city.name)
            .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error(`[Adapter Error - Cities] ${new Date().toISOString()}:`, { error, rawData });
        return [];
    }
};

const fetchCities = async ({ queryKey, signal }) => {
    const [, , stateCode] = queryKey;
    if (!stateCode) return [];

    const payload = buildComponentConfigPayload({
        moduleName: 'Master Data Management',
        aspectType: 'cityTypes',
        query: { aspectType: 'cityTypes', refDataCode: stateCode },
        skip: 0,
        next: 2000
    });

    const cacheBustedUrl = `${ENDPOINTS.FILTER_API}?stateRef=${encodeURIComponent(stateCode)}`;
    const response = await apiClient.post(cacheBustedUrl, payload, { signal, pre: true });
    return adaptCitiesData(response);
};

export const useGetCities = (stateCode) => {
    return useQuery({
        queryKey: ['masterData', 'cities', stateCode],
        queryFn: fetchCities,
        enabled: Boolean(stateCode),
        staleTime: 1000 * 60 * 5, // 5-minute cache
        refetchOnWindowFocus: false
    });
};

export const adaptRegardsData = (rawData) => {
    try {
        if (!rawData?.data || !Array.isArray(rawData.data)) return [];

        return rawData.data
            .map((item) => ({
                name: item?.refDataName || ''
            }))
            .filter((regard) => regard.name)
            .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error(`[Adapter Error - Regards] ${new Date().toISOString()}:`, { error, rawData });
        return [];
    }
};

const fetchRegards = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: 'Master Data Management',
        aspectType: 'Regardingtypes',
        query: { aspectType: 'Regardingtypes' },
        skip: 0,
        next: 2000
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal, pre: true });
    return adaptRegardsData(response);
};

export const useGetRegards = () => {
    return useQuery({
        queryKey: ['masterData', 'regards'],
        queryFn: fetchRegards,
        staleTime: 1000 * 60 * 60 * 24, // 24-hour cache validity
        refetchOnWindowFocus: false
    });
};

const submitContactFormRequest = async ({ payload, signal }) => {
    const response = await apiClient.post(ENDPOINTS.SUBMIT_FORM_DATA_API, payload, {
        signal,
        pre: true
    });
    return response?.data || response;
};

export const useSubmitContactForm = () => {
    return useMutation({
        mutationFn: submitContactFormRequest,
        onError: (error) => {
            if (error?.name !== 'CanceledError' && error?.name !== 'AbortError') {
                console.error(`[Mutation Error - Contact Submit] ${new Date().toISOString()}:`, {
                    error,
                    context: 'useSubmitContactForm'
                });
            }
        }
    });
};