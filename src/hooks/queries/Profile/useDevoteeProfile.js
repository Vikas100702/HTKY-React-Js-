import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { useAuthStore } from '../../../store/useAuthStore';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

// Fetch Devotee Details by memberId
export const useGetDevoteeDetails = (memberId) => {
    return useQuery({
        queryKey: ['devoteeDetails', memberId],
        queryFn: async ({ signal }) => {
            if (!memberId) return null;

            const payload = {
                dataJson: {
                    memberId: memberId,
                    ipAddress: '23.181.160.110',
                },
                ...buildComponentConfigPayload({
                    moduleName: 'Contacts',
                    aspectType: 'getDevoteeDetails',
                }),
            };

            const response = await apiClient.post(
                ENDPOINTS.GET_DEVOTEE_DETAILS_WEB,
                payload,
                { signal, pre: true }
            );

            const rawList = Array.isArray(response?.data?.data)
                ? response.data.data
                : Array.isArray(response?.data)
                    ? response.data
                    : [];

            return rawList[0] || null;
        },
        enabled: Boolean(memberId),
        staleTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
    });
};

// Fetch Nakshatra Master Data
export const useGetNakshatras = () => {
    return useQuery({
        queryKey: ['masterData', 'nakshatras'],
        queryFn: async ({ signal }) => {
            const payload = buildComponentConfigPayload({
                moduleName: 'Master Data Management',
                aspectType: 'nakshatraTypes',
                query: { aspectType: 'nakshatraTypes' }
            });

            const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal, pre: true });
            const list = Array.isArray(response?.data?.data)
                ? response.data.data
                : Array.isArray(response?.data)
                    ? response.data
                    : [];

            const extractedNames = list
                .filter((item) => String(item?.status || 'ACTIVE').toUpperCase() === 'ACTIVE')
                .map((item) => (item?.refDataName ? String(item.refDataName).trim() : ''))
                .filter(Boolean);

            return Array.from(new Set(extractedNames)).sort((a, b) => a.localeCompare(b));
        },
        staleTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
    });
};

// Fetch Gotra Master Data
export const useGetGotras = () => {
    return useQuery({
        queryKey: ['masterData', 'gotras'],
        queryFn: async ({ signal }) => {
            const payload = buildComponentConfigPayload({
                moduleName: 'Master Data Management',
                aspectType: 'gotraTypes',
                query: { aspectType: 'gotraTypes' }
            });

            const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal, pre: true });
            const list = Array.isArray(response?.data?.data)
                ? response.data.data
                : Array.isArray(response?.data)
                    ? response.data
                    : [];

            const extractedNames = list
                .filter((item) => String(item?.status || 'ACTIVE').toUpperCase() === 'ACTIVE')
                .map((item) => (item?.refDataName ? String(item.refDataName).trim() : ''))
                .filter(Boolean);

            return Array.from(new Set(extractedNames)).sort((a, b) => a.localeCompare(b));
        },
        staleTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
    });
};

// Save/Update Devotee Sankalpam Details
export const useSaveDevoteeSankalpam = () => {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token || state.user?.token);

    return useMutation({
        mutationFn: async ({ devoteeId, formData, userName, userToken }) => {
            const isNoSpouse = Boolean(formData.noSpouse);
            const isNoFamily = Boolean(formData.noFamilyMember);
            const activeToken = userToken || token || user?.token || '';

            const formattedMembers = isNoFamily
                ? []
                : (formData.familyMembers || [])
                    .filter((m) => m?.name && String(m.name).trim().length > 0)
                    .map((m) => ({
                        memberName: String(m.name).trim(),
                        nakshatra: m.nakshatra || '',
                        rashi: '',
                        relationship: '',
                        dob: '',
                        anniversaryDate: '',
                    }));

            const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();

            const payload = {
                _id: devoteeId,
                dataJson: {
                    refDataName: fullName,
                    gotraName: formData.gothram || '',
                    Nakshtra: formData.nakshatra || '',
                    noFamily: isNoFamily ? 'noFamily' : '',
                    noSpouse: isNoSpouse ? 'noSpouse' : '',
                    spouseName: isNoSpouse ? '' : formData.spouseName || '',
                    spouseNakshtra: isNoSpouse ? '' : formData.spouseNakshatra || '',
                    memberDetail: formattedMembers,
                },
                ...buildComponentConfigPayload({
                    moduleName: 'Contacts',
                    aspectType: 'saveDevoteeSankalpam',
                    userName: userName || '',
                }),
            };

            const response = await apiClient.post(
                ENDPOINTS.CHECKOUT_SANLAPAM_FORM,
                payload,
                {
                    token: activeToken,
                    pre: true,
                }
            );

            return response?.data || response;
        },
        onSuccess: (_, variables) => {
            if (variables?.devoteeId) {
                queryClient.invalidateQueries({ queryKey: ['devoteeDetails', variables.devoteeId] });
            }
        },
    });
};

// Centralized Devotee Profile Controller Hook
export const useDevoteeProfile = () => {
    const user = useAuthStore((state) => state.user);
    const memberId = user?._id || user?.id || user?.memberId || '';

    const { data: devoteeProfile, isLoading: isProfileLoading } = useGetDevoteeDetails(memberId);
    const { data: nakshatras = [], isLoading: isNakshatrasLoading } = useGetNakshatras();
    const { data: gotras = [], isLoading: isGotrasLoading } = useGetGotras();
    const saveSankalpamMutation = useSaveDevoteeSankalpam();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        gothram: '',
        nakshatra: '',
        noSpouse: false,
        spouseName: '',
        spouseNakshatra: '',
        noFamilyMember: false,
        familyMembers: [],
    });

    const [errors, setErrors] = useState({});
    const [previousProfile, setPreviousProfile] = useState(null);

    const profile = devoteeProfile || user;
    if (profile && profile !== previousProfile) {
        setPreviousProfile(profile);

        const hasSpouse = Boolean(profile.spouseName?.trim());
        const rawFamily = Array.isArray(profile.memberDetail)
            ? profile.memberDetail
                .filter((m) => m?.memberName?.trim())
                .map((m, idx) => ({
                    id: `profile-${idx}`,
                    name: m.memberName.trim(),
                    nakshatra: m.nakshatra || '',
                }))
            : [];

        setFormData((prev) => ({
            ...prev,
            firstName: profile.firstName || prev.firstName || '',
            lastName: profile.lastName || prev.lastName || '',
            gothram: profile.gotraName || prev.gothram || '',
            nakshatra: profile.Nakshtra || prev.nakshatra || '',
            noSpouse: profile.noSpouse === 'noSpouse' || !hasSpouse,
            spouseName: profile.spouseName || prev.spouseName || '',
            spouseNakshatra: profile.spouseNakshtra || prev.spouseNakshatra || '',
            noFamilyMember: profile.noFamily === 'noFamily' || rawFamily.length === 0,
            familyMembers: rawFamily.length > 0 ? rawFamily : prev.familyMembers,
        }));
    }

    const updateField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const addFamilyMember = () => {
        setFormData((prev) => ({
            ...prev,
            familyMembers: [
                ...prev.familyMembers,
                { id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, name: '', nakshatra: '' },
            ],
        }));
    };

    const removeFamilyMember = (id) => {
        setFormData((prev) => ({
            ...prev,
            familyMembers: prev.familyMembers.filter((m) => m.id !== id),
        }));
    };

    const updateFamilyMember = (id, field, value) => {
        setFormData((prev) => ({
            ...prev,
            familyMembers: prev.familyMembers.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
        }));
    };

    const validate = () => {
        const errs = {};
        if (!formData.firstName.trim()) errs.firstName = 'First Name is required';
        if (!formData.lastName.trim()) errs.lastName = 'Last Name is required';
        if (!formData.gothram.trim()) errs.gothram = 'Gothram is required';
        if (!formData.nakshatra) errs.nakshatra = 'Please select Nakshatra';
        if (!formData.noSpouse && formData.spouseName && !formData.spouseNakshatra) {
            errs.spouseNakshatra = 'Please select Spouse Nakshatra';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const saveSankalpam = async () => {
        const targetId = devoteeProfile?._id || memberId;
        const targetUser = devoteeProfile?.recModBy || user?.name || user?.firstName || 'superadmin4213';
        const targetToken = user?.token || devoteeProfile?.token || '';

        return await saveSankalpamMutation.mutateAsync({
            devoteeId: targetId,
            formData,
            userName: targetUser,
            userToken: targetToken,
        });
    };

    return {
        devoteeProfile,
        nakshatras,
        gotras,
        formData,
        errors,
        isLoading: isProfileLoading || isNakshatrasLoading || isGotrasLoading,
        isSaving: saveSankalpamMutation.isPending,
        updateField,
        addFamilyMember,
        removeFamilyMember,
        updateFamilyMember,
        validate,
        saveSankalpam,
        setFormData,
    };
};


