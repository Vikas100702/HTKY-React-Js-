/**
 * @file src/hooks/queries/Services/useGetServiceCategories.js
 * @description Enterprise Data Layer to dynamically fetch Temple Service Categories.
 * Fully resilient against Axios response nesting and empty payload states.
 */

import { useQuery } from "@tanstack/react-query";
import { buildComponentConfigPayload } from "../../../utils/apiPayloadBuilder";
import { apiClient } from "../../../api/client";
import { ENDPOINTS } from "../../../constants/apiConstants";

/**
 * 1. Data Adapter
 * Sanitizes and normalizes the categories data array.
 * @param {Object} rawData - Response JSON from API
 * @returns {Array} Cleaned and sorted list of categories
 */
export const adaptServiceCategories = (rawData) => {
    try {
        // Handle both axios wrapped (response.data) and direct payload structures
        const items = Array.isArray(rawData?.data)
            ? rawData.data
            : Array.isArray(rawData?.data?.data)
                ? rawData.data.data
                : [];

        if (items.length === 0) {
            console.warn('[Service Categories Adapter] Empty or invalid category array received.');
            return [];
        }

        // Active status filtering and clean mapping
        const activeCategories = items
            .filter((item) => {
                const status = (item?.status || 'ACTIVE').toUpperCase();
                return status === 'ACTIVE' || status === '';
            })
            .map((item) => ({
                id: item?._id || item?.refDataName || Math.random().toString(36).substring(2, 9),
                refDataName: item?.refDataName || 'TEMPLE SERVICE',
                displayName: item?.displayName || item?.refDataName || 'TEMPLE SERVICE',
                refDataCode: item?.refDataCode || item?.refDataName || '',
                sequenceId: parseInt(item?.sequenceId || item?.sequenceIdAsNumber || '999', 10),
            }));

        // Sort by sequenceId ascending
        activeCategories.sort((a, b) => a.sequenceId - b.sequenceId);

        return activeCategories;
    } catch (error) {
        console.error('[Service Categories Adapter Error] Mapping failed:', error);
        return [];
    }
};

/**
 * 2. Categories Fetcher
 */
const fetchServiceCategories = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: 'Master Data Management',
        aspectType: 'serviceCategoryTypes',
        query: {
            aspectType: 'serviceCategoryTypes',
            status: 'ACTIVE',
        },
        skip: 0,
        next: 1000,
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });
    // Axios returns data inside response.data
    return adaptServiceCategories(response?.data || response);
};

/**
 * 3. Custom TanStack Query Hook
 */
export const useGetServiceCategories = () => {
    return useQuery({
        queryKey: ['serviceCategoryTypes'],
        queryFn: fetchServiceCategories,
        staleTime: 1000 * 60 * 30, // 30 mins cache
        gcTime: 1000 * 60 * 60,    // 1 hour garbage collection
        refetchOnWindowFocus: false,
        retry: 1,
    });
};

