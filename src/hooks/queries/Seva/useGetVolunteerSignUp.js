import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

export const adaptUploadPhotoResponse = (rawData) => {
    try {
        if (!rawData?.success || !rawData?.result?.message) {
            console.warn('[Adapter Warning] Photo Upload API returned unexpected payload:', rawData);
            return null;
        }

        const messageObj = rawData.result.message;
        let extractedFileName = null;

        if (messageObj.path) {
            try {
                const parsedArray = JSON.parse(messageObj.path);
                if (Array.isArray(parsedArray) && parsedArray.length > 0) {
                    extractedFileName = parsedArray[0].paths || "";
                }
            } catch (parseError) {
                console.error('[Adapter Error] Failed to parse stringified path array:', parseError);
            }
        }

        return {
            ...messageObj,
            extractedFileName
        }
    } catch (error) {
        console.error('[Adapter Error] Failed to map Photo Upload Data:', error);
        return null;
    }
};

const uploadPhotoRequest = async ({ image, signal }) => {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('type', 'profile');

    const response = await apiClient.post(ENDPOINTS.VOLUNTEER_UPLOAD_PHOTO_API, formData, {
        signal,
        pre: true,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });

    return adaptUploadPhotoResponse(response);
};

export const useUploadVolunteerPhoto = () => {
    return useMutation({
        mutationFn: uploadPhotoRequest, onError: (error) => {
            console.error('[Mutation Error] Volunteer Photo Upload failed:', error);
        }
    });
};

const submitVolunteerFormRequest = async (payload) => {
    const response = await apiClient.post(ENDPOINTS.VOLUNTEER_SIGNUP_API, payload, { pre: true });
    return response?.data || response;
};

export const useSubmitVolunteerForm = () => {
    return useMutation({
        mutationFn: submitVolunteerFormRequest,
        onError: (error) => {
            
            console.error('[Mutation Error] Volunteer Form Submit failed:', error);
        }
    });
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
