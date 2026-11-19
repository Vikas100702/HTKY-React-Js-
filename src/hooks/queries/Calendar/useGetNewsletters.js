/**
 * @file src/hooks/queries/Calendar/useGetNewsletters.js
 * @description TanStack Query hook for fetching Yearly Monthly Flyers and
 * Quarterly Newsletters via `ENDPOINTS.GET_EVENT_AND_NOTIFICATION_DATA`.
 * Resolves `templatePDF` and `templatePreview` URLs using `BASE_URL`,
 * maps active records across all 12 months, and enforces `AbortSignal` safety.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Critical Architectural Non-Negotiables #2, #3, #4, and #5.
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { BASE_URL, ENDPOINTS } from "../../../constants/apiConstants";
import { ENV_CONFIG } from "../../../config/envConfig";

export const NEWSLETTER_MONTHS = Object.freeze([
    { index: 0, shortName: "Jan", fullName: "January", upperName: "JANUARY", quarterIndex: 0 },
    { index: 1, shortName: "Feb", fullName: "February", upperName: "FEBRUARY", quarterIndex: 0 },
    { index: 2, shortName: "March", fullName: "March", upperName: "MARCH", quarterIndex: 0 },
    { index: 3, shortName: "Apr", fullName: "April", upperName: "APRIL", quarterIndex: 1 },
    { index: 4, shortName: "May", fullName: "May", upperName: "MAY", quarterIndex: 1 },
    { index: 5, shortName: "June", fullName: "June", upperName: "JUNE", quarterIndex: 1 },
    { index: 6, shortName: "July", fullName: "July", upperName: "JULY", quarterIndex: 2 },
    { index: 7, shortName: "Aug", fullName: "August", upperName: "AUGUST", quarterIndex: 2 },
    { index: 8, shortName: "Sep", fullName: "September", upperName: "SEPTEMBER", quarterIndex: 2 },
    { index: 9, shortName: "Oct", fullName: "October", upperName: "OCTOBER", quarterIndex: 3 },
    { index: 10, shortName: "Nov", fullName: "November", upperName: "NOVEMBER", quarterIndex: 3 },
    { index: 11, shortName: "Dec", fullName: "December", upperName: "DECEMBER", quarterIndex: 3 },
]);

export const NEWSLETTER_QUARTERS = Object.freeze([
    { index: 0, label: "January - March", upperType: "NEWSLETTER", anchorMonthIndex: 1 },
    { index: 1, label: "April - June", upperType: "NEWSLETTER", anchorMonthIndex: 4 },
    { index: 2, label: "July - September", upperType: "NEWSLETTER", anchorMonthIndex: 7 },
    { index: 3, label: "October - December", upperType: "NEWSLETTER", anchorMonthIndex: 10 },
]);

/**
 * Resolves a relative backend upload path (`/uploads/profile/...pdf` or `.jpeg`)
 * into a fully qualified URL using `BASE_URL`, avoiding duplicate slashes.
 *
 * @param {string} rawPath
 * @returns {string}
 */
const resolveTemplateAssetUrl = (rawPath) => {
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
 * Builds `MM/DD/YYYY` start and end dates for a given year and 0-based month index.
 *
 * @param {number} year
 * @param {number} monthIndex
 * @returns {{ startDate: string, endDate: string }}
 */
const getMonthDateRange = (year, monthIndex) => {
    const mm = String(monthIndex + 1).padStart(2, "0");
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const dd = String(lastDay).padStart(2, "0");
    return {
        startDate: `${mm}/01/${year}`,
        endDate: `${mm}/${dd}/${year}`,
    };
};

/**
 * Normalizes a flyer/newsletter record from `getEventAndNotificationData`.
 *
 * @param {Object} item
 * @returns {Object}
 */
const normalizeFlyerRecord = (item) => {
    const pdfUrl = resolveTemplateAssetUrl(item?.templatePDF);
    const previewUrl = resolveTemplateAssetUrl(
        item?.templatePreview || item?.templatePreview1,
    );

    return {
        id: item?._id || item?.insertedId || "",
        title: String(item?.templateDesc || item?.refDataName || "").trim(),
        refDataName: String(item?.refDataName || "").trim(),
        pdfUrl,
        previewUrl,
        targetUrl: pdfUrl || previewUrl,
        startDate: String(item?.startDate || "").trim(),
        endDate: String(item?.endDate || "").trim(),
        status: String(item?.status || "ACTIVE").trim().toUpperCase(),
        rawItem: item,
    };
};

/**
 * Fetches all 12 monthly temple event flyers and 4 quarterly newsletters for a given year.
 *
 * @param {number} year
 * @returns {import("@tanstack/react-query").UseQueryResult<Object>}
 */
export const useGetYearNewsletters = (year) => {
    const numericYear = Number(year) || new Date().getFullYear();

    return useQuery({
        queryKey: ["templeNewsletters", numericYear],
        queryFn: async ({ signal }) => {
            const monthRequests = NEWSLETTER_MONTHS.map(async (monthMeta) => {
                const { startDate, endDate } = getMonthDateRange(
                    numericYear,
                    monthMeta.index,
                );

                const payload = {
                    startDate,
                    endDate,
                    clientId: ENV_CONFIG.CLIENT_ID,
                    type: `${monthMeta.upperName} TEMPLE EVENT FLYER`,
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
                        : [];

                const activeRecord = rawList.find(
                    (entry) =>
                        !entry?.status ||
                        String(entry.status).trim().toUpperCase() === "ACTIVE",
                );

                return {
                    monthIndex: monthMeta.index,
                    flyer: activeRecord ? normalizeFlyerRecord(activeRecord) : null,
                };
            });

            const quarterRequests = NEWSLETTER_QUARTERS.map(async (qMeta) => {
                const startMonth = qMeta.index * 3;
                const endMonth = startMonth + 2;
                const { startDate } = getMonthDateRange(numericYear, startMonth);
                const { endDate } = getMonthDateRange(numericYear, endMonth);

                const payload = {
                    startDate,
                    endDate,
                    clientId: ENV_CONFIG.CLIENT_ID,
                    type: qMeta.upperType,
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
                        : [];

                const activeRecord = rawList.find(
                    (entry) =>
                        !entry?.status ||
                        String(entry.status).trim().toUpperCase() === "ACTIVE",
                );

                return {
                    quarterIndex: qMeta.index,
                    newsletter: activeRecord ? normalizeFlyerRecord(activeRecord) : null,
                };
            });

            const [monthSettled, quarterSettled] = await Promise.all([
                Promise.allSettled(monthRequests),
                Promise.allSettled(quarterRequests),
            ]);

            const monthlyMap = {};
            monthSettled.forEach((res) => {
                if (res.status === "fulfilled" && res.value) {
                    monthlyMap[res.value.monthIndex] = res.value.flyer;
                }
            });

            const quarterlyMap = {};
            quarterSettled.forEach((res) => {
                if (res.status === "fulfilled" && res.value) {
                    quarterlyMap[res.value.quarterIndex] = res.value.newsletter;
                }
            });

            return {
                year: numericYear,
                monthlyMap,
                quarterlyMap,
            };
        },
        staleTime: 1000 * 60 * 15,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        retry: 1,
    });
};

export default useGetYearNewsletters;

