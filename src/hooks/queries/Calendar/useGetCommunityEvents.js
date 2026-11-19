/**
 * @file src/hooks/queries/Calendar/useGetCommunityEvents.js
 * @description TanStack Query hook for fetching Temple Community Events flyers
 * (`type: "COMMUNITY EVENTS"`) via `ENDPOINTS.GET_EVENT_AND_NOTIFICATION_DATA`.
 * Resolves `templatePreview` image URLs with `BASE_URL`, filters `ACTIVE` records,
 * sorts by `sequenceId`, and enforces `AbortSignal` cancellation.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Critical Architectural Non-Negotiables #2, #3, #4, and #5.
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { BASE_URL, ENDPOINTS } from "../../../constants/apiConstants";
import { ENV_CONFIG } from "../../../config/envConfig";

export const COMMUNITY_EVENTS_TYPE = "COMMUNITY EVENTS";

/**
 * Resolves a relative backend upload path (e.g. `/uploads/profile/image-...jpeg`)
 * into a fully qualified URL using `BASE_URL`, avoiding duplicate slashes.
 *
 * @param {string} rawPath
 * @returns {string}
 */
const resolveFlyerImageUrl = (rawPath) => {
    if (!rawPath || typeof rawPath !== "string") return "";
    const trimmed = rawPath.trim();
    if (!trimmed) return "";

    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
        return trimmed;
    }

    const normalizedBase = String(BASE_URL || "").replace(/\/+$/, "");
    const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

    return normalizedBase ? `${normalizedBase}${normalizedPath}` : normalizedPath;
};

/**
 * Extracts fallback `<img src="...">` URL from `flyerTemplate` HTML string if `templatePreview` is empty.
 *
 * @param {string} flyerHtml
 * @returns {string}
 */
const extractImageFromFlyerHtml = (flyerHtml) => {
    if (!flyerHtml || typeof flyerHtml !== "string") return "";
    const match = flyerHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match?.[1] ? match[1].trim() : "";
};

/**
 * Normalizes a raw Community Event flyer document from MongoDB into a safe UI view model.
 *
 * @param {Object} item
 * @param {number} index
 * @returns {Object}
 */
const normalizeCommunityEventItem = (item, index) => {
    const rawPreview =
        item?.templatePreview ||
        item?.templatePreview1 ||
        extractImageFromFlyerHtml(item?.flyerTemplate) ||
        "";

    const imageUrl = resolveFlyerImageUrl(rawPreview);
    const startDate = String(item?.startDate || "").trim();
    const endDate = String(item?.endDate || "").trim();
    const title =
        String(item?.templateDesc || item?.refDataName || "").trim() ||
        "Community Event";

    return {
        id: item?._id || item?.insertedId || `community-event-${index}`,
        title,
        refDataName: String(item?.refDataName || COMMUNITY_EVENTS_TYPE).trim(),
        imageUrl,
        pdfUrl: resolveFlyerImageUrl(item?.templatePDF),
        startDate,
        endDate,
        dateLabel:
            startDate && endDate && startDate !== endDate
                ? `${startDate} - ${endDate}`
                : startDate || endDate || "",
        sequence: parseInt(item?.sequenceId ?? "999999", 10) || 999999,
        status: String(item?.status || "ACTIVE").trim().toUpperCase(),
        rawItem: item,
    };
};

/**
 * Fetches active Community Event flyers for the Temple Calendar section.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult<Array<Object>>}
 */
export const useGetCommunityEvents = () => {
    return useQuery({
        queryKey: ["communityEvents", COMMUNITY_EVENTS_TYPE],
        queryFn: async ({ signal }) => {
            const payload = {
                startDate: "",
                endDate: "",
                clientId: ENV_CONFIG.CLIENT_ID,
                type: COMMUNITY_EVENTS_TYPE,
            };

            const response = await apiClient.post(
                ENDPOINTS.GET_EVENT_AND_NOTIFICATION_DATA,
                payload,
                { signal },
            );

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
                        !item?.status || String(item.status).trim().toUpperCase() === "ACTIVE",
                )
                .map(normalizeCommunityEventItem)
                .filter((item) => Boolean(item.imageUrl))
                .sort((a, b) => a.sequence - b.sequence);
        },
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        retry: 2,
    });
};

export default useGetCommunityEvents;

