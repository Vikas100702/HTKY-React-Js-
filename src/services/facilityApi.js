/**
 * @file src/services/facilityApi.js
 * @description Service Adapter Layer for the Temple Facility Booking Wizard.
 * Encapsulates all network requests and payload normalizations for:
 * - Temple Client Info (`getclientInfoById`)
 * - Priest Services (`filterAPI` -> IN-TEMPLE `SERVICE REQUEST`)
 * - Priest Availability (`getpriestAvailbilityNew`)
 * - Facility Availability (`facility/getfacilityAvailbility`)
 * - Temple Settings (`CLIENT_SETTINGS` -> `facilitySettings` & `membershipSettings`)
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 */

import { apiClient } from "../api/client";
import { ENV_CONFIG } from "../config/envConfig";
import { ENDPOINTS } from "../constants/apiConstants";

/**
 * Resolves full media URL for facility images returned by backend.
 *
 * @param {string} rawImg
 * @returns {string}
 */
const resolveFacilityImageUrl = (rawImg) => {
    const clean = String(rawImg || "").trim();
    if (!clean) return "";
    if (/^https?:\/\//i.test(clean) || clean.startsWith("data:")) {
        return clean;
    }
    const baseUrl = String(ENV_CONFIG.BASE_URL || "").replace(/\/+$/, "");
    const normalizedPath = clean.startsWith("/") ? clean : `/${clean}`;
    return baseUrl ? `${baseUrl}/${normalizedPath}` : normalizedPath;
};

/**
 * 2A. Service Function: Fetch Read-Only Temple Client Address Details
 *
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{
 *   streetAddress: string,
 *   addressLineOne: string,
 *   addressLinetwo: string,
 *   state: string,
 *   city: string,
 *   zipCode: string
 * }>}
 */
export const fetchTempleClientInfo = async ({ signal } = {}) => {
    const endpoint =
        ENDPOINTS.GET_CLIENT_INFO_BY_ID || "api/client/getclientInfoById";

    const response = await apiClient.post(
        endpoint,
        { _id: ENV_CONFIG.CLIENT_ID },
        { signal, pre: true }
    );

    const clientObj =
        response?.result?.data?.[0] ||
        response?.data?.result?.data?.[0] ||
        response?.data?.[0] ||
        response?.data ||
        response ||
        {};

    const addressLineOne = String(clientObj?.addressLineOne || "").trim();
    const addressLinetwo = String(clientObj?.addressLinetwo || "").trim();
    const streetAddress = [addressLineOne, addressLinetwo]
        .filter(Boolean)
        .join(", ")
        .trim();

    return {
        streetAddress,
        addressLineOne,
        addressLinetwo,
        state: String(clientObj?.state || "").trim(),
        city: String(clientObj?.city || "").trim(),
        zipCode: String(clientObj?.zipCode || clientObj?.zip || "").trim(),
    };
};

/**
 * 2B. Service Function: Fetch Active IN-TEMPLE Priest Services (`SERVICE REQUEST`)
 *
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Array<{
 *   id: string,
 *   refDataName: string,
 *   serviceAmount: number,
 *   formattedAmount: string
 * }>>}
 */
export const fetchFacilityPriestServices = async ({ signal } = {}) => {
    const endpoint = ENDPOINTS.FILTER_API;

    const payload = {
        componentConfig: {
            moduleName: "Temple Services",
            productID: ENV_CONFIG.PRODUCT_ID,
            clientID: ENV_CONFIG.CLIENT_ID,
            aspectType: "ServiceSetup",
            skip: 0,
            next: 200,
            query: {
                aspectType: "ServiceSetup",
                status: "ACTIVE",
                serviceCategoryTypes: "IN-TEMPLE",
                sourceTypes: "SERVICE REQUEST",
            },
        },
    };

    const response = await apiClient.post(endpoint, payload, {
        signal,
        pre: true,
    });

    const rawList =
        response?.result?.data ||
        response?.data?.result?.data ||
        response?.data ||
        [];

    if (!Array.isArray(rawList)) return [];

    return rawList
        .filter((item) => item && String(item?.refDataName || "").trim())
        .map((item) => {
            const numericAmt =
                parseFloat(String(item?.serviceAmount ?? "0").replace(/[^0-9.]/g, "")) ||
                0;
            return {
                id: String(item?._id || item?.id || item?.refDataName),
                refDataName: String(item.refDataName).trim(),
                serviceAmount: numericAmt,
                formattedAmount: numericAmt.toFixed(2),
            };
        });
};

/**
 * 2C. Service Function: Fetch Available Priests for Selected Date & Service Time
 *
 * @param {Object} params
 * @param {string} params.serviceDate - `MM/DD/YYYY`
 * @param {string} params.targetTime - `hh:mm AM/PM`
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Array<{
 *   id: string,
 *   refDataName: string,
 *   availability: string,
 *   isAvailable: boolean
 * }>>}
 */
export const fetchAvailablePriests = async (
    { serviceDate, targetTime },
    { signal } = {}
) => {
    const endpoint =
        ENDPOINTS.GET_PRIEST_AVAILABILITY_NEW;

    const payload = {
        clientId: ENV_CONFIG.CLIENT_ID,
        serviceDate: String(serviceDate || "").trim(),
        targetTime: String(targetTime || "").trim(),
        memberType: "PRIEST"
    };

    const response = await apiClient.post(endpoint, payload, {
        signal,
        pre: true,
    });

    const rawList =
        response?.result?.data ||
        response?.data?.result?.data ||
        response?.data ||
        [];

    if (!Array.isArray(rawList)) return [];

    return rawList
        .filter((p) => p && String(p?.refDataName || p?.name || "").trim())
        .map((p) => {
            const availabilityText = String(p?.availability || "Available").trim();
            const isAvailable =
                availabilityText.toLowerCase() === "available" ||
                p?.isAvailable === true;

            return {
                id: String(p?._id || p?.id || p?.refDataName),
                refDataName: String(p?.refDataName || p?.name).trim(),
                availability: availabilityText,
                isAvailable,
            };
        });
};

/**
 * 2D. Service Function: Fetch Facility Availability for Step 2 (`Choose Rental`)
 *
 * @param {Object} params
 * @param {string} params.serviceDate - `MM/DD/YYYY`
 * @param {string} params.targetTime - `hh:mm AM/PM`
 * @param {number|string} params.participant - Estimated attendees count
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Array<Object>>}
 */
export const fetchFacilityAvailability = async (
    {
        serviceDate,
        targetTime,
        targetEndTime = "",
        facilityId = "",
        participant,
    },
    { signal } = {}
) => {
    const endpoint = ENDPOINTS.GET_FACILITY_AVAILABILITY;

    const payload = {
        clientId: ENV_CONFIG.CLIENT_ID,
        serviceDate: String(serviceDate || "").trim(),
        targetTime: String(targetTime || "").trim(),
        targetEndTime: String(targetEndTime || "").trim(),
        facilityId: String(facilityId || "").trim(),
        participant: Number(participant) || 0,
    };

    const response = await apiClient.post(endpoint, payload, {
        signal,
        pre: true,
    });

    const rawList =
        response?.result?.data ||
        response?.data?.result?.data ||
        response?.data ||
        [];

    if (!Array.isArray(rawList)) return [];

    return rawList
        .filter((item) => item && String(item?.refDataName || "").trim())
        .sort((a, b) => {
            const seqA = Number(a?.sequenceId ?? 999999);
            const seqB = Number(b?.sequenceId ?? 999999);
            return (
                (Number.isFinite(seqA) ? seqA : 999999) -
                (Number.isFinite(seqB) ? seqB : 999999)
            );
        })
        .map((item, index) => {
            const id = String(item?._id || item?.id || `facility-${index}`);
            const isAvailableCode = Number(item?.isAvailable ?? 1);
            const availableCount = Number(item?.availableCount ?? 0);
            const availabilityRaw = String(item?.availability ?? "").trim();

            // Block ONLY when backend explicitly returns `"Not Available"`, `isAvailable === 0`,
            // or count-based `isAvailable === 3` has `availableCount <= 0`.
            // Note: `isAvailable === 2` with `availability: "Available"` is an AVAILABLE facility.
            const isBlocked =
                availabilityRaw.toLowerCase() === "not available" ||
                isAvailableCode === 0 ||
                (isAvailableCode === 3 && availableCount <= 0);

            // Parse `priceType` safely (Backend sends JSON stringified array e.g. "[{\"key\":\"1 HOUR\",\"value\":\"50\"}]")
            let rawPriceType = item?.priceType;
            if (typeof rawPriceType === "string") {
                const trimmedJson = rawPriceType.trim();
                if (trimmedJson.startsWith("[") || trimmedJson.startsWith("{")) {
                    try {
                        rawPriceType = JSON.parse(trimmedJson);
                    } catch {
                        rawPriceType = [];
                    }
                } else {
                    rawPriceType = [];
                }
            }

            let priceTypes = [];
            if (Array.isArray(rawPriceType)) {
                priceTypes = rawPriceType
                    .map((entry) => {
                        if (entry && typeof entry === "object") {
                            const key = String(
                                entry.key || entry.type || entry.name || ""
                            ).trim();
                            const value =
                                parseFloat(
                                    String(
                                        entry.value ?? entry.price ?? entry.amount ?? "0"
                                    ).replace(/[^0-9.]/g, "")
                                ) || 0;
                            return key ? { key, value } : null;
                        }
                        return null;
                    })
                    .filter(Boolean);
            } else if (rawPriceType && typeof rawPriceType === "object") {
                priceTypes = Object.entries(rawPriceType)
                    .map(([k, v]) => ({
                        key: String(k || "").trim(),
                        value:
                            parseFloat(String(v ?? "0").replace(/[^0-9.]/g, "")) || 0,
                    }))
                    .filter((entry) => entry.key);
            }

            // Resolve Base Unit Price (`costPerUnit` -> `serviceAmount` -> `amount` -> first `priceTypes` tier)
            const parsedCostPerUnit =
                parseFloat(
                    String(
                        item?.costPerUnit ?? item?.serviceAmount ?? item?.amount ?? "0"
                    ).replace(/[^0-9.]/g, "")
                ) || 0;

            const baseUnitPrice =
                parsedCostPerUnit > 0
                    ? parsedCostPerUnit
                    : priceTypes.length > 0
                        ? priceTypes[0].value
                        : 0;

            const qtyCounterRaw = String(item?.qtyCounter || "").trim().toUpperCase();
            const qtyCounterEnabled =
                qtyCounterRaw === "YES" || item?.qtyCounter === true;

            const isDTVisibleRaw = String(item?.isDTVisible || "").trim().toUpperCase();
            const isDTVisible =
                isDTVisibleRaw === "YES" ||
                item?.isDTVisible === true ||
                priceTypes.length > 0;

            const membershipDiscountFlag =
                String(item?.membershipDiscount || "").trim().toUpperCase() === "YES" ||
                item?.membershipDiscount === true;

            return {
                id,
                refDataName: String(item.refDataName).trim(),
                refDataCode: String(item?.refDataCode || "RENTALS").trim(),
                rentalCategory: String(
                    item?.rentalCategory || item?.serviceCategoryTypes || "FACILITIES"
                ).trim(),
                shortDescription: String(
                    item?.shortDescription || item?.serviceDesc || ""
                ).trim(),
                description: String(
                    item?.serviceDesc || item?.shortDescription || ""
                ).trim(),
                imageUrl: resolveFacilityImageUrl(
                    item?.Image || item?.image || item?.imageUrl
                ),
                baseUnitPrice,
                priceTypes,
                hasPriceTypes: priceTypes.length > 0,
                qtyCounterEnabled,
                isDTVisible,
                isAvailableCode,
                availableCount,
                isBlocked,
                availabilityMessage: String(
                    item?.availabilityMessage ||
                    item?.message ||
                    (isBlocked ? "Not Available" : "")
                ).trim(),
                timedSlot: Array.isArray(item?.timedSlot) ? item.timedSlot : [],
                bookings: Array.isArray(item?.bookings) ? item.bookings : [],
                membershipDiscount: membershipDiscountFlag,
                membershipAmount:
                    parseFloat(
                        String(item?.membershipAmount ?? "0").replace(/[^0-9.]/g, "")
                    ) || 0,
                raw: item,
            };
        });
};

/**
 * 2E. Service Function: Fetch Temple Facility & Membership Settings
 * Reads `facilitySettings` (`shift`, `hourlyBookingRules`, `facilitySecurityAmount`,
 * `facilitySecurityType`, `bookingTypes`, etc.) and `membershipSettings`
 * (`facilityMembershipDiscount`, `facilityDiscountType`).
 *
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{
 *   shifts: Array<{ name: string, startTime: string, endTime: string }>,
 *   hourlyBookingRules: Array<{ slotName: string, hourFrom: number, hourTo: number }>,
 *   facilitySettings: Object,
 *   membershipSettings: Object,
 *   rawSettings: Object|null
 * }>}
 */
export const fetchFacilityShiftRules = async ({ signal } = {}) => {
    const endpoint = ENDPOINTS.CLIENT_SETTINGS;

    const payload = {
        action: "getClientSetting",
        productId: ENV_CONFIG.PRODUCT_ID,
        clientId: ENV_CONFIG.CLIENT_ID,
    };

    const response = await apiClient.post(endpoint, payload, {
        signal,
        pre: true,
    });

    const rootSettings =
        response?.result?.data?.[0] ||
        response?.data?.result?.data?.[0] ||
        response?.data?.[0] ||
        response?.data ||
        response ||
        null;

    const facilitySettings = rootSettings?.facilitySettings || {};
    const membershipSettings = rootSettings?.membershipSettings || {};

    const rawShifts = Array.isArray(facilitySettings?.shift)
        ? facilitySettings.shift
        : [];
    const rawHourlyRules = Array.isArray(facilitySettings?.hourlyBookingRules)
        ? facilitySettings.hourlyBookingRules
        : [];

    return {
        shifts: rawShifts
            .filter((s) => s && String(s.name || s.slotName || "").trim())
            .map((s) => ({
                name: String(s.name || s.slotName || "").trim(),
                startTime: String(s.startTime || "").trim(),
                endTime: String(s.endTime || "").trim(),
            })),
        hourlyBookingRules: rawHourlyRules
            .filter((r) => r && String(r.slotName || r.name || "").trim())
            .map((r) => ({
                slotName: String(r.slotName || r.name || "").trim(),
                hourFrom: Number(r.hourFrom ?? 0) || 0,
                hourTo: Number(r.hourTo ?? r.hourFrom ?? 0) || 0,
            })),
        facilitySettings,
        membershipSettings,
        rawSettings: rootSettings,
    };
};