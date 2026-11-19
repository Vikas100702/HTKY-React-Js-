/**
 * @file src/hooks/queries/Services/Sponsorship/useGetSponsorships.js
 * @description Centralized TanStack Query hooks for Sponsorship Categories
 * (`aspectType: "serviceTypes"`, `refDataCode: "SPONSORSHIP"`) and Sponsorship
 * Offerings (`aspectType: "ServiceSetup"`, `serviceCategoryTypes: "SPONSORSHIP"`).
 * Reuses `adaptServiceSetupData` from `../useGetServices` for 100% parity with
 * Book A Service & General Donations rules.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Critical Architectural Non-Negotiables #2, #3, #4, and #5.
 */

import { useQuery } from "@tanstack/react-query";
import { BASE_URL, ENDPOINTS } from "../../../../constants/apiConstants";
import { buildComponentConfigPayload } from "../../../../utils/apiPayloadBuilder";
import { apiClient } from "../../../../api/client";
import { adaptServiceSetupData, SPONSORSHIP_CATEGORY } from "../Book_Services/useGetServices";

/**
 * Resolves a relative backend upload path (e.g., `/uploads/profile/image-...png`)
 * into a fully qualified URL using `BASE_URL`, avoiding duplicate slashes.
 *
 * @param {string} rawImagePath
 * @returns {string}
 */
const resolveSponsorshipImageUrl = (rawImagePath) => {
    if (!rawImagePath || typeof rawImagePath !== "string") return "";
    const trimmedPath = rawImagePath.trim();
    if (!trimmedPath) return "";

    if (/^https?:\/\//i.test(trimmedPath) || trimmedPath.startsWith("data:")) {
        return trimmedPath;
    }

    const normalizedBase = String(BASE_URL || "").replace(/\/+$/, "");
    const normalizedPath = trimmedPath.startsWith("/")
        ? trimmedPath
        : `/${trimmedPath}`;

    return normalizedBase ? `${normalizedBase}${normalizedPath}` : normalizedPath;
};

/**
 * Normalizes a raw sponsorship category record from MongoDB into a clean UI view model.
 *
 * @param {Object} item
 * @param {number} index
 * @returns {Object}
 */
const normalizeSponsorshipItem = (item, index) => {
    const displayName =
        String(item?.displayName || "").trim() ||
        String(item?.refDataName || "").trim() ||
        "Sponsorship";

    return {
        id: item?._id || item?.insertedId || `sponsorship-${index}`,
        title: displayName,
        refDataName: String(item?.refDataName || displayName).trim(),
        refDataCode: String(item?.refDataCode || "SPONSORSHIP").trim(),
        description: String(item?.description || "").trim(),
        imageUrl: resolveSponsorshipImageUrl(item?.image),
        sequence: Number(item?.sequenceIdAsNumber ?? item?.sequenceId ?? index + 1),
        status: String(item?.status || "ACTIVE").toUpperCase(),
        rawItem: item,
    };
};

/**
 * Fetches active Sponsorship category cards (`aspectType: "serviceTypes"`, `refDataCode: "SPONSORSHIP"`).
 *
 * @returns {import("@tanstack/react-query").UseQueryResult<Array<Object>>}
 */
export const useGetSponsorships = () => {
    return useQuery({
        queryKey: ["sponsorships", "serviceTypes", "SPONSORSHIP"],
        queryFn: async ({ signal }) => {
            const baseConfig = buildComponentConfigPayload({
                moduleName: "Master Data Management",
                aspectType: "serviceTypes",
            });

            const payload = {
                ...baseConfig,
                componentConfig: {
                    ...baseConfig.componentConfig,
                    query: {
                        aspectType: "serviceTypes",
                        refDataCode: "SPONSORSHIP",
                    },
                    moduleName: "Master Data Management",
                    aspectType: "serviceTypes",
                    skip: 0,
                    next: 1000,
                },
            };

            const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, {
                signal,
            });

            const rawList = Array.isArray(response?.data?.data)
                ? response.data.data
                : Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response)
                        ? response
                        : [];

            return rawList
                .filter(
                    (item) =>
                        !item?.status || String(item.status).toUpperCase() === "ACTIVE",
                )
                .map(normalizeSponsorshipItem)
                .sort((a, b) => a.sequence - b.sequence);
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        retry: 2,
    });
};

/**
 * Fetches Sponsorship `ServiceSetup` offerings for a specific `serviceTypes` (`refDataName`, e.g., `"ANNUAL PUJAS"`).
 *
 * @param {string} serviceType
 * @returns {import("@tanstack/react-query").UseQueryResult<Array<Object>>}
 */
export const useGetSponsorshipServices = (serviceType) => {
    const normalizedType =
        typeof serviceType === "string" ? serviceType.trim() : "";

    return useQuery({
        queryKey: ["templeServices", SPONSORSHIP_CATEGORY, normalizedType],
        enabled: Boolean(normalizedType),
        queryFn: async ({ signal }) => {
            const baseConfig = buildComponentConfigPayload({
                moduleName: "Temple Services",
                aspectType: "ServiceSetup",
                collectionType: "Business",
            });

            const payload = {
                ...baseConfig,
                componentConfig: {
                    ...baseConfig.componentConfig,
                    query: {
                        aspectType: "ServiceSetup",
                        serviceCategoryTypes: SPONSORSHIP_CATEGORY,
                        serviceTypes: normalizedType,
                        sourceTypes: "WEBSITE",
                        status: "ACTIVE",
                    },
                    moduleName: "Temple Services",
                    aspectType: "ServiceSetup",
                    collectionType: "Business",
                    skip: 0,
                    next: 5000,
                },
            };

            const response = await apiClient.post(ENDPOINTS.FILTER_API, payload, {
                signal,
            });

            return adaptServiceSetupData(
                response?.data || response,
                SPONSORSHIP_CATEGORY,
            );
        },
        staleTime: 1000 * 60 * 15,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        retry: 1,
    });
};

export default useGetSponsorships;