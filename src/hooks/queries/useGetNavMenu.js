// import { useQuery } from '@tanstack/react-query';
// import { apiClient } from '../../api/client';
// import { ENDPOINTS } from '../../constants/apiConstants';
// import { buildComponentConfigPayload } from '../../utils/apiPayloadBuilder';

// const DEFAULT_NAV_ITEMS = [
//     { id: '1', title: 'HOME', path: '/' },
//     {
//         id: '2',
//         title: 'SERVICES',
//         subMenu: [
//             { id: '2-1', title: 'BOOK A SERVICE', path: '/book-service' },
//             { id: '2-2', title: 'SPONSORSHIPS', path: '/sponsorships' },
//         ],
//     },
//     {
//         id: '3',
//         title: 'CALENDAR',
//         subMenu: [
//             { id: '2-1', title: 'CALENDAR', path: '/calendar' },
//             { id: '2-2', title: 'COMMUNITY EVENTS', path: '/community-events' },
//             { id: '2-3', title: 'NEWSLETTERS', path: '/newsletters' },
//         ],
//     },
//     {
//         id: '4', title: 'DONATIONS', subMenu: [
//             { id: '4-1', title: 'GENERAL DONATION', path: '/donations/general' },
//             { id: '4-2', title: 'RECURRING DONATION', path: '/recurring-donation' },
//         ]
//     },
//     {
//         id: '5', title: 'EDUCATION', subMenu: [
//             { id: '6-1', title: 'HINDU SCHOOL', path: '/hindu-school' },
//             { id: '6-2', title: 'ALL CLASSES', path: '/all-classes' },
//         ]
//     },
//     {
//         id: '7', title: 'SEVA', subMenu: [
//             { id: '7-1', title: 'VOLUNTEER SIGNUP', path: '/volunteer-signup' },
//             { id: '7-2', title: 'SENIOR Program', path: '/senior-program' },
//             { id: '7-3', title: 'GRIEF SUPPORT', path: '/grief-support' },
//             { id: '7-4', title: 'LOST AND FOUND', path: '/lost-found' },
//         ]
//     },
//     {
//         id: '8',
//         title: 'ABOUT TEMPLE',
//         subMenu: [
//             { id: '8-1', title: 'ABOUT TEMPLE', path: '/about-temple' },
//             { id: '8-2', title: 'ABOUT DEITIES', path: '/about-deities' },
//             { id: '8-3', title: 'ABOUT PRIESTS', path: '/about-priests' },
//             { id: '8-4', title: 'LAND DONORS', path: '/land-donors' },
//             { id: '8-5', title: 'BOARD & COMMITTEE MEMBERS', path: '/board-committee-members' },
//             { id: '8-6', title: 'TEMPLE ETIQUETTE & VISITS', path: '/etiquette-visits' },
//             { id: '8-7', title: 'JAIN-SANGH', path: '/jain-sangh' },
//             { id: '8-8', title: 'SHIRDI SAI SATSANG', path: '/shirdi-sai-satsang' },
//         ],
//     },
//     {
//         id: '9',
//         title: 'MY ACCOUNT',
//         subMenu: [
//             { id: '9-1', title: 'MY ACCOUNT', path: '/account/dashboard' },
//             { id: '9-2', title: 'LOGOUT', path: '#logout' }
//         ],
//     },
// ];

// const adaptNavMenuData = (rawData) => {
//     try {
//         if (!rawData?.data || rawData.data.length === 0) {
//             console.warn('[Adapter] Nav Menu API returned empty data. Using fallback menu.');
//             return DEFAULT_NAV_ITEMS;
//         }

//         // Filter items matching navMenu aspect type or map directly if returned as a list
//         const navMenuItems = rawData.data.filter((entry) => entry?.aspectType === 'navMenu' || entry?.moduleName === 'Navigation').map((item, index) => ({
//             id: item?.id || `nav-${index}`,
//             title: item?.refDataName || item?.title || item?.name || 'MENU ITEM',
//             path: item?.path || item?.link || item?.url || '/',
//             subMenu: Array.isArray(item?.subItems) ? item.subItems.map((subItem, subIndex) => ({
//                 id: subItem?._id || `sub-${subIndex}`,
//                 title: subItem?.refDataName || subItem?.title || 'SUB MENU',
//                 path: subItem?.path || subItem?.link || '/',
//             })) : [],
//         }));

//         // If no matching items were mapped, return default fallbacks
//         return navMenuItems.length > 0 ? navMenuItems : DEFAULT_NAV_ITEMS;
//     } catch (error) {
//         console.error('[Adapter Error] Failed to map Nav Menu Data:', error);
//         return DEFAULT_NAV_ITEMS;
//     }
// };

// const fetchNavMenu = async ({ signal }) => {
//     const payload = buildComponentConfigPayload({
//         moduleName: 'Header Menu',
//         aspectType: 'headerMenu',
//         query: {
//             aspectType: 'headerMenu',
//         },
//         username: ""
//     });

//     const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, { signal });

//     return adaptNavMenuData(response);
// };

// export const useGetNavMenu = () => {
//     return useQuery({
//         queryKey: ['navMenu'],
//         queryFn: fetchNavMenu,
//         staleTime: 1000 * 60 * 60, // Cache navigation for 1 hour
//         retry: 2,
//         refetchOnWindowFocus: false,
//     });
// };

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { BASE_URL, ENDPOINTS } from "../../constants/apiConstants";
import { ROUTES } from "../../constants/routes";
import { buildComponentConfigPayload } from "../../utils/apiPayloadBuilder";

const MY_ACCOUNT_MENU_ITEM = {
    id: "my-account-menu",
    title: "MY ACCOUNT",
    path: ROUTES.myAccount,
    subMenu: [
        { id: "my-account-dashboard", title: "MY ACCOUNT", path: ROUTES.myAccount },
        { id: "my-account-logout", title: "LOGOUT", path: "#logout" },
    ],
};

const parseSequence = (seqVal, fallback = 999) => {
    const num = Number(seqVal);
    return Number.isFinite(num) && seqVal !== "" && seqVal !== null ? num : fallback;
};

const adaptNavMenuData = (rawData) => {
    try {
        const records = Array.isArray(rawData?.data) ? rawData.data : [];
        if (records.length === 0) return [];

        const activeParents = records
            .filter((entry) => {
                const parent = entry?.Parent;
                if (!parent) return false;
                return String(parent.status || "ACTIVE").trim().toUpperCase() === "ACTIVE";
            })
            .sort(
                (a, b) =>
                    parseSequence(a?.Parent?.sequenceId, a?.sequenceIdAsNumber ?? 1) -
                    parseSequence(b?.Parent?.sequenceId, b?.sequenceIdAsNumber ?? 1)
            );

        const mappedItems = activeParents.map((entry, idx) => {
            const parent = entry.Parent || {};
            const refName = String(parent.refDataName || "").trim();
            const displayTitle = String(parent.displayName || refName || "MENU").trim();

            const childList = Array.isArray(entry["Child Grid"]) ? entry["Child Grid"] : [];
            const activeSubMenu = childList
                .filter((child) => {
                    const status = String(child?.status || "ACTIVE").trim().toUpperCase();
                    const isDeleted = String(child?.delete || "").trim().toUpperCase() === "YES";
                    return status === "ACTIVE" && !isDeleted;
                })
                .sort((a, b) => parseSequence(a?.sequenceId, 1) - parseSequence(b?.sequenceId, 1))
                .map((child, subIdx) => {
                    const childRef = String(child?.refDataName || "").trim();
                    const childTitle = String(
                        child?.displayName || child?.dispalyName || childRef || "SUB MENU"
                    ).trim();

                    return {
                        id: `${entry._id || idx}-sub-${subIdx}`,
                        refDataName: childRef,
                        title: childTitle,
                        path: ROUTES[childRef] || ROUTES.home,
                    };
                });

            return {
                id: entry._id || `nav-${idx}`,
                refDataName: refName,
                title: displayTitle,
                path: ROUTES[refName] || ROUTES.home,
                subMenu: activeSubMenu,
            };
        });

        if (mappedItems.length === 0) return [];

        const hasAccountItem = mappedItems.some(
            (item) => item.title.toUpperCase() === "MY ACCOUNT"
        );
        if (!hasAccountItem) {
            mappedItems.push(MY_ACCOUNT_MENU_ITEM);
        }

        return mappedItems;
    } catch (error) {
        console.error("[Adapter Error] Failed to map Header Menu Data:", error);
        return [];
    }
};

const fetchNavMenu = async ({ signal }) => {
    const payload = buildComponentConfigPayload({
        moduleName: "Header Menu",
        aspectType: "headerMenu",
        query: {
            aspectType: "headerMenu",
        },
        skip: 0,
        next: 20,
    });

    const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, {
        baseURL: BASE_URL,
        signal,
    });

    return adaptNavMenuData(response);
};

export const useGetNavMenu = () => {
    return useQuery({
        queryKey: ["navMenu", "headerMenu"],
        queryFn: fetchNavMenu,
        staleTime: 1000 * 60 * 60,
        retry: 2,
        refetchOnWindowFocus: false,
    });
};