/**
 * @file src/hooks/queries/useGetFooterSettings.js
 * @description TanStack Query hook to fetch Footer configuration.
 * Includes a fail-safe data adapter to gracefully map contact info, 
 * timings, social links, and copyright text.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { BASE_URL, ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';

/**
 * 1. Data Adapter ("Mapper" Equivalent)
 * Extracts the 0th index object and neutralizes undefined/null values.
 * @param {Object} rawData - Raw JSON response from the API
 * @returns {Object} Cleaned footer configuration object
 */

export const adaptFooterData = (rawData) => {
    try {
        if (!rawData?.data || rawData.data.length === 0) {
            console.warn('[Adapter] Footer API returned empty data. Using fallback.');
            return null; // Component should handle null gracefully
        }

        const footerItem = rawData.data[0]; // Safely access the 0th index
        if (!footerItem) return null;

        let formattedLogoUrl = null;
        if (footerItem?.footerLogo) {
            formattedLogoUrl = footerItem.footerLogo.startsWith('http')
                ? footerItem.footerLogo
                : `${BASE_URL}${footerItem.footerLogo}`;
        }

        return {
            phone: footerItem?.phone || "",
            email: footerItem?.email || "",
            address: footerItem?.refDataCode || "",
            logoUrl: formattedLogoUrl,
            weekdayMorningTime: footerItem?.weekdayMorningTime || "",
            weekDayEveningTime: footerItem?.weekDayEveningTime || "",
            weekEndMorningTime: footerItem?.weekEndMorningTime || "",
            weekEndEveningTime: footerItem?.weekEndEveningTime || "",
            facebookLink: footerItem?.facebookLink || "",
            twitterLink: footerItem?.twitterLink || "",
            youtubeLink: footerItem?.youtubeLink || "",
            instagramLink: footerItem?.instagramLink || "",
            copyright: footerItem?.copyRight || "",
            termsOfUse: footerItem?.termsOfUse || "",
            privacyPolicy: footerItem?.privacyPolicy || "",
            security: footerItem?.securityPage || ""
        };
    } catch (error) {
        console.error('[Adapter Error] Failed to map Footer Data:', error);
        return null;
    }
};

/**
 * 2. Service Function
 */
const fetchFooterSettings = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: 'Footer Settings',
        aspectType: 'footerSettings',
        query: { aspectType: 'footerSettings' },
    });

    // Auto-cancellation via AbortController signal on unmount
    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });

    return adaptFooterData(response);
};

/**
 * 3. Custom Hook (Server State Manager)
 */
export const useGetFooterSettings = () => {
    return useQuery({
        queryKey: ['footerSettings'],
        queryFn: fetchFooterSettings,
        staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

// 2. BACKGROUND MUSIC ADAPTER & HOOK
export const adaptBackgroundMusicData = (rawData) => {
    try {
        if (!rawData?.data || rawData.data.length === 0) return null;

        // Find today's music based on current day
        const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
        const todayMusic = rawData.data.find(m => m.dayName === todayDay) || rawData.data[0];

        if (!todayMusic?.refDataName) return null;

        return {
            musicName: todayMusic.musicName || "Temple Music",
            url: todayMusic.refDataName.startsWith('http')
                ? todayMusic.refDataName
                : `${BASE_URL}${todayMusic.refDataName}`
        };
    } catch (error) {
        console.error('[Adapter Error] Failed to map Background Music:', error);
        return null;
    }
};

const fetchBackgroundMusic = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: "Background Music",
        aspectType: "backgroundMusic",
        query: { aspectType: "backgroundMusic", status: "ACTIVE" },
        skip: 0,
        next: 10
    });
    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });
    return adaptBackgroundMusicData(response);
};

export const useGetBackgroundMusic = () => {
    return useQuery({
        queryKey: ['backgroundMusic'],
        queryFn: fetchBackgroundMusic,
        staleTime: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: false,
    });
};