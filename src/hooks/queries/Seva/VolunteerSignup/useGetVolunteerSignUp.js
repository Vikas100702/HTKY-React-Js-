import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../../api/client';
import { ENDPOINTS } from '../../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../../utils/apiPayloadBuilder';

// PHOTO UPLOAD MODULE
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
                console.error(`[Adapter Error] Failed to parse path array at ${new Date().toISOString()}`, { parseError, pathData: messageObj.path });
            }
        }

        return {
            ...messageObj,
            extractedFileName
        };
    } catch (error) {
        console.error(`[Adapter Error] Failed to map Photo Upload Data at ${new Date().toISOString()}`, { error, rawData });
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
        mutationFn: uploadPhotoRequest,
        onError: (error) => {
            if (error.name !== "CanceledError" && error.name !== "AbortError") {
                console.error(`[Mutation Error] Volunteer Photo Upload failed at ${new Date().toISOString()}`, { error, context: 'useUploadVolunteerPhoto' });
            }
        }
    });
};

// FORM SUBMISSION MODULE
const submitVolunteerFormRequest = async ({ payload, signal }) => {
    const response = await apiClient.post(ENDPOINTS.VOLUNTEER_SIGNUP_API, payload, {
        signal,
        pre: true
    });
    return response?.data || response;
};

export const useSubmitVolunteerForm = () => {
    return useMutation({
        mutationFn: submitVolunteerFormRequest,
        onError: (error) => {
            if (error.name !== "CanceledError" && error.name !== "AbortError") {
                console.error(`[Mutation Error] Volunteer Form Submit failed at ${new Date().toISOString()}`, { error, context: 'useSubmitVolunteerForm' });
            }
        }
    });
};

// MASTER DATA MODULE: STATES
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
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
};

// MASTER DATA MODULE: CITIES
export const adaptCitiesData = (rawData) => {
    if (!rawData?.data || !Array.isArray(rawData.data)) return [];

    return rawData.data.map(item => ({
        name: item?.refDataName || "",
        statesCode: item?.refDataCode || ""
    })).filter(city => city.name).sort((a, b) => a.name.localeCompare(b.name));
};

const fetchCities = async ({ queryKey, signal }) => {
    const stateCode = queryKey[2];
    if (!stateCode) return [];

    const payload = buildComponentConfigPayload({
        moduleName: "Master Data Management",
        aspectType: "cityTypes",
        query: { aspectType: "cityTypes", refDataCode: `${stateCode}`.trim() }
    });

    // Cache-busting URL. Appending the state code prevents apiClient POST collisions
    const cacheBustedUrl = `${ENDPOINTS.FILTER_API}?stateRef=${encodeURIComponent(stateCode)}`;

    const response = await apiClient.post(cacheBustedUrl, payload, { signal, pre: true });
    return adaptCitiesData(response);
};

export const useGetCities = (stateCode) => {
    return useQuery({
        queryKey: ['masterData', 'cities', stateCode],
        queryFn: fetchCities,
        enabled: !!stateCode,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
};