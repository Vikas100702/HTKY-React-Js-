/**
 * @file src/hooks/queries/useGetNavMenu.js
 * @description TanStack Query hook to fetch dynamic Navigation Menu items.
 * Includes a robust Data Adapter to handle API schema changes seamlessly.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { ENDPOINTS } from '../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../utils/apiPayloadBuilder';

/**
 * Fallback static menu array in case the API is offline or returns empty data.
 * zero-downtime UI rendering.
 */

const DEFAULT_NAV_ITEMS = [
    { id: '1', title: 'HOME', path: '/' },
    {
        id: '2',
        title: 'SERVICES',
        subMenu: [
            { id: '2-1', title: 'BOOK A SERVICE', path: '/book-service' },
            { id: '2-2', title: 'SPONSORSHIPS', path: '/sponsorships' },
        ],
    },
    {
        id: '3',
        title: 'CALENDAR',
        subMenu: [
            { id: '2-1', title: 'CALENDAR', path: '/calendar' },
            { id: '2-2', title: 'COMMUNITY EVENTS', path: '/community-events' },
            { id: '2-3', title: 'NEWSLETTERS', path: '/newsletters' },
        ],
    },
    {
        id: '4', title: 'DONATIONS', subMenu: [
            { id: '4-1', title: 'GENERAL DONATION', path: '/general-donation' },
            { id: '4-2', title: 'RECURRING DONATION', path: '/recurring-donation' },
        ]
    },
    {
        id: '5', title: 'EDUCATION', subMenu: [
            { id: '6-1', title: 'HINDU SCHOOL', path: '/hindu-school' },
            { id: '6-2', title: 'ALL CLASSES', path: '/all-classes' },
        ]
    },
    {
        id: '7', title: 'SEVA', subMenu: [
            { id: '7-1', title: 'VOLUNTEER SIGNUP', path: '/volunteer-signup' },
            { id: '7-2', title: 'SENIOR PAGE', path: '/senior-page' },
            { id: '7-3', title: 'GRIEF SUPPORT', path: '/grief-support' },
            { id: '7-4', title: 'LOST AND FOUND', path: '/lost-found' },
        ]
    },
    {
        id: '8',
        title: 'ABOUT TEMPLE',
        subMenu: [
            { id: '8-1', title: 'ABOUT TEMPLE', path: '/about-temple' },
            { id: '8-2', title: 'ABOUT DEITIES', path: '/about-deities' },
            { id: '8-3', title: 'ABOUT PRIESTS', path: '/about-priests' },
            { id: '8-4', title: 'LAND DONORS', path: '/land-donors' },
            { id: '8-5', title: 'BOARD & COMMITTEE MEMBERS', path: '/board-committee-members' },
            { id: '8-6', title: 'TEMPLE ETIQUETTE & VISITS', path: '/etiquette-visits' },
            { id: '8-7', title: 'JAIN-SANGH', path: '/jain-sangh' },
            { id: '8-8', title: 'SHIRDI SAI SATSANG', path: '/shirdi-sai-satsang' },
        ],
    },
];

/**
 * 1. Data Adapter ("Mapper" Equivalent)
 * Safely parses raw API response into a clean, array-based menu structure.
 * Handles nested submenus/dropdowns if present in the backend response.
 * * @param {Object} rawData - Raw JSON response from the API
 * @returns {Array} Sanitized array of navigation menu objects
 */

const adaptNavMenuData = (rawData) => {
    try {
        if (!rawData?.data || rawData.data.length === 0) {
            console.warn('[Adapter] Nav Menu API returned empty data. Using fallback menu.');
            return DEFAULT_NAV_ITEMS;
        }

        // Filter items matching navMenu aspect type or map directly if returned as a list
        const navMenuItems = rawData.data.filter((entry) => entry?.aspectType === 'navMenu' || entry?.moduleName === 'Navigation').map((item, index) => ({
            id: item?.id || `nav-${index}`,
            title: item?.refDataName || item?.title || item?.name || 'MENU ITEM',
            path: item?.path || item?.link || item?.url || '/',
            subMenu: Array.isArray(item?.subItems) ? item.subItems.map((subItem, subIndex) => ({
                id: subItem?._id || `sub-${subIndex}`,
                title: subItem?.refDataName || subItem?.title || 'SUB MENU',
                path: subItem?.path || subItem?.link || '/',
            })) : [],
        }));

        // If no matching items were mapped, return default fallbacks
        return navMenuItems.length > 0 ? navMenuItems : DEFAULT_NAV_ITEMS;
    } catch (error) {
        console.error('[Adapter Error] Failed to map Nav Menu Data:', error);
        return DEFAULT_NAV_ITEMS;
    }
};

/**
 * 2. Service Function
 * Executes network request passing AbortController signal for memory safety.
 */

const fetchNavMenu = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: 'Navigation Menu',
        aspectType: 'navMenu',
        query: {
            aspectType: 'navMenu',
        },
        skip: 0,
        next: 100,
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });

    return adaptNavMenuData(response);
};

/**
 * 3. Custom Hook (Server State Manager)
 */
export const useGetNavMenu = () => {
    return useQuery({
        queryKey: ['navMenu'],
        queryFn: fetchNavMenu,
        staleTime: 1000 * 60 * 60, // Cache navigation for 1 hour
        retry: 2,
        refetchOnWindowFocus: false,
    });
};