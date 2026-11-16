/**
 * @file src/hooks/queries/Profile/useProfile.js
 * @description Centralized TanStack Query hooks for Devotee Profile viewing,
 * editing, and dynamic Master Data dropdowns (States, dependent Cities, Gotras, Nakshatras, Rashis).
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Non-Negotiables #2, #3, #4, and #5.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';
import { useAuthStore } from '../../../store/useAuthStore';
import { fetchDevoteeProfile, updateDevoteeProfile } from './profileApi';
import {
    useGetGotras,
    useGetNakshatras,
    useGetRashis,
} from './useDevoteeProfile';
import { useGetCompanyDetails } from '../Auth/useRegisterQueries';

/**
 * Normalizes FilterAPI master data items into sorted `{ label, value }` dropdown options.
 *
 * @param {Object} response - Raw Axios/apiClient response
 * @returns {Array<{ label: string, value: string }>}
 */
const normalizeMasterOptions = (response) => {
    const list = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
            ? response.data
            : [];

    const uniqueNames = new Set();

    list.forEach((item) => {
        const isInactive =
            item?.status && String(item.status).trim().toUpperCase() === 'INACTIVE';
        if (isInactive) return;

        const name = item?.refDataName
            ? String(item.refDataName).trim().toUpperCase()
            : '';
        if (name) {
            uniqueNames.add(name);
        }
    });

    return Array.from(uniqueNames)
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({ label: name, value: name }));
};

/**
 * Query hook: Fetches all US States from Master Data Management (`stateTypes`).
 * Automatically passes TanStack Query's AbortSignal for cancellation safety.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useGetStates = () => {
    return useQuery({
        queryKey: ['masterData', 'states'],
        queryFn: async ({ signal }) => {
            const payload = buildComponentConfigPayload({
                moduleName: 'Master Data Management',
                aspectType: 'stateTypes',
                query: {
                    aspectType: 'stateTypes',
                },
                skip: 0,
                next: 700,
            });

            const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, {
                signal,
                pre: true,
            });

            return normalizeMasterOptions(response);
        },
        staleTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
    });
};

/**
 * Query hook: Fetches dependent Cities for a given State (`cityTypes` filtered by `refDataCode`).
 * Automatically aborts stale requests when `selectedState` changes rapidly.
 *
 * @param {string} selectedState - Uppercase state name (e.g., "VIRGINIA")
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useGetCitiesByState = (selectedState) => {
    const normalizedState = selectedState
        ? String(selectedState).trim().toUpperCase()
        : '';

    return useQuery({
        queryKey: ['masterData', 'cities', normalizedState],
        queryFn: async ({ signal }) => {
            if (!normalizedState) return [];

            const payload = buildComponentConfigPayload({
                moduleName: 'Master Data Management',
                aspectType: 'cityTypes',
                query: {
                    aspectType: 'cityTypes',
                    refDataCode: normalizedState,
                },
                skip: 0,
                next: 700,
            });

            const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, {
                signal,
                pre: true,
            });

            return normalizeMasterOptions(response);
        },
        enabled: Boolean(normalizedState),
        staleTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
    });
};

/**
 * Query hook: Retrieves devotee profile details by memberId.
 *
 * @param {string} memberId - MongoDB record ID
 * @param {Object} [options]
 * @param {string} [options.ipAddress] - Optional IP override
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useGetProfile = (memberId, options = {}) => {
    return useQuery({
        queryKey: ['devoteeDetails', memberId],
        queryFn: async ({ signal }) => {
            if (!memberId) return null;
            return await fetchDevoteeProfile(memberId, {
                signal,
                ipAddress: options.ipAddress,
            });
        },
        enabled: Boolean(memberId),
        staleTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
    });
};

/**
 * Mutation hook: Persists updated profile changes to the MongoDB backend.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token || state.user?.token);

    return useMutation({
        mutationFn: async ({
            devoteeId,
            profileData,
            existingProfile,
            userName,
            userToken,
        }) => {
            const activeToken = userToken || token || user?.token || '';
            const activeUserName =
                userName ||
                user?.name ||
                user?.firstName ||
                profileData?.refDataName ||
                'WEBSITE_USER';

            return await updateDevoteeProfile({
                devoteeId,
                profileData,
                existingProfile,
                userName: activeUserName,
                userToken: activeToken,
            });
        },
        onSuccess: (_, variables) => {
            if (variables?.devoteeId) {
                queryClient.invalidateQueries({
                    queryKey: ['devoteeDetails', variables.devoteeId],
                });
            }
            queryClient.invalidateQueries({ queryKey: ['devoteeDetails'] });
        },
    });
};

/**
 * Composite Profile Controller Hook.
 * Accepts `selectedState` so dependent cities fetch and cache dynamically.
 *
 * @param {string} [selectedState] - Currently selected state in the profile form
 * @returns {Object} Consolidated controller methods, state, and master collections
 */
export const useProfile = (selectedState) => {
    const user = useAuthStore((state) => state.user);
    const memberId = user?._id || user?.id || user?.memberId || '';

    const {
        data: profileData,
        isLoading: isProfileLoading,
        isError: isProfileError,
        error: profileError,
        refetch: refetchProfile,
    } = useGetProfile(memberId);

    const activeState =
        selectedState !== undefined
            ? selectedState
            : profileData?.stateTypes || user?.stateTypes || 'VIRGINIA';

    const { data: gotras = [], isLoading: isGotrasLoading } = useGetGotras();
    const { data: nakshatras = [], isLoading: isNakshatrasLoading } =
        useGetNakshatras();
    const { data: rashis = [], isLoading: isRashisLoading } = useGetRashis();
    const { data: states = [], isLoading: isStatesLoading } = useGetStates();
    const { data: cities = [], isFetching: isCitiesFetching } =
        useGetCitiesByState(activeState);

    const updateProfileMutation = useUpdateProfile();
    const companyLookupMutation = useGetCompanyDetails();

    const handleSaveProfile = async (updatedForm) => {
        const targetId = profileData?._id || memberId;
        return await updateProfileMutation.mutateAsync({
            devoteeId: targetId,
            profileData: updatedForm,
            existingProfile: profileData || user || {},
        });
    };

    const handleCheckCompanyDetails = async (email) => {
        if (!email || !String(email).trim()) return null;
        return await companyLookupMutation.mutateAsync({
            email: String(email).trim(),
        });
    };

    return {
        memberId,
        profileData: profileData || user,
        gotras,
        nakshatras,
        rashis,
        states,
        cities,
        isCitiesLoading: isCitiesFetching,
        isCheckingCompany: companyLookupMutation.isPending,
        checkCompanyDetails: handleCheckCompanyDetails,
        isLoading:
            isProfileLoading ||
            isGotrasLoading ||
            isNakshatrasLoading ||
            isRashisLoading ||
            isStatesLoading,
        isSaving: updateProfileMutation.isPending,
        isError: isProfileError,
        errorMessage: profileError?.message || '',
        saveProfile: handleSaveProfile,
        refetchProfile,
    };
};

export default useProfile;