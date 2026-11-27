/**
 * @file src/hooks/queries/Facilities/useFacilityForm.js
 * @description Server State Queries and Step-1 & Step-2 Controller Hook (`useFacilityForm`)
 * for the 3-step Temple Facility Booking timeline wizard.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    fetchAvailablePriests,
    fetchFacilityAvailability,
    fetchFacilityPriestServices,
    fetchFacilityShiftRules,
    fetchTempleClientInfo,
} from "../../../services/facilityApi";
import { ENV_CONFIG } from "../../../config/envConfig";
import { useAuthStore } from "../../../store/useAuthStore";
import { useGetDevoteeDetails } from "../Profile/useDevoteeProfile";
import { useGetCumulativeAmount } from "../Dashboard/useDashboard";
import { evaluateMembershipStatus } from "../../../utils/membershipDiscount";

export const PREFERRED_LANGUAGES = Object.freeze([
    "PUNJABI",
    "HINDI",
    "GUJARATHI",
    "KANNADA",
    "TELUGU",
    "TAMIL",
    "SANSKRIT",
    "BENGALI",
    "MALAYALAM",
    "ENGLISH",
]);

export const FACILITY_TIMELINE_STEPS = Object.freeze([
    { id: 1, key: "EVENT_DETAILS", label: "Event Details" },
    { id: 2, key: "CHOOSE_RENTAL", label: "Choose Rental" },
    { id: 3, key: "SUBMIT_REQUEST", label: "Submit Request" },
]);

const INITIAL_EVENT_DETAILS = Object.freeze({
    eventName: "",
    eventDate: "", // MM/DD/YYYY
    eventTime: "", // HH:mm (24h)
    attendeesCount: "",
    preferredLanguage: "",
    eventDescription: "",
    addPriestServices: "", // "YES" | "NO" | ""
    selectedServiceId: "",
    selectedServiceName: "",
    serviceAmount: "",
    serviceTime: "", // HH:mm (24h)
    selectedPriestId: "",
    selectedPriestName: "",
});

/**
 * Formats 24-hour `"HH:mm"` into `"hh:mm AM/PM"` (e.g., `"15:29"` -> `"03:29 PM"`).
 *
 * @param {string} time24
 * @returns {string}
 */
export const format24To12Label = (time24) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(time24 || "").trim());
    if (!match) return "";
    const h24 = Math.min(23, Math.max(0, Number(match[1])));
    const min = Math.min(59, Math.max(0, Number(match[2])));
    const period = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${String(h12).padStart(2, "0")}:${String(min).padStart(2, "0")} ${period}`;
};

/**
 * Parses `"hh:mm AM/PM"` or `"HH:mm"` into minutes from midnight (`0..1439`).
 *
 * @param {string} rawTime
 * @returns {number|null}
 */
export const parseAnyTimeToMinutes = (rawTime) => {
    const clean = String(rawTime || "").trim().toUpperCase();
    if (!clean) return null;

    const amPmMatch = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/.exec(clean);
    if (amPmMatch) {
        let h = Number(amPmMatch[1]) % 12;
        const m = Number(amPmMatch[2]);
        if (amPmMatch[3] === "PM") h += 12;
        return h * 60 + m;
    }

    const h24Match = /^(\d{1,2}):(\d{2})$/.exec(clean);
    if (h24Match) {
        return Number(h24Match[1]) * 60 + Number(h24Match[2]);
    }

    return null;
};

/**
 * Adds `hoursToAdd` to `"HH:mm"` (24h) and wraps cleanly past midnight (`% 1440`)
 * so late-evening events (e.g. `10:45 PM` + `4h` -> `02:45 AM`) calculate accurately.
 *
 * @param {string} startTime24
 * @param {number} hoursToAdd
 * @returns {string}
 */
export const addHoursToTime24 = (startTime24, hoursToAdd) => {
    const startMins = parseAnyTimeToMinutes(startTime24);
    if (startMins === null || !Number.isFinite(hoursToAdd) || hoursToAdd <= 0) return "";
    const wrappedMins = Math.round(startMins + hoursToAdd * 60) % (24 * 60);
    return `${String(Math.floor(wrappedMins / 60)).padStart(2, "0")}:${String(wrappedMins % 60).padStart(2, "0")}`;
};

export const normalizeTo24Hour = (rawTime) => {
    const mins = parseAnyTimeToMinutes(rawTime);
    if (mins === null) return "";
    return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
};

export const computeDurationMinutes = (startTime24, endTime24) => {
    const startMins = parseAnyTimeToMinutes(startTime24);
    const endMins = parseAnyTimeToMinutes(endTime24);
    if (startMins === null || endMins === null) return null;
    if (endMins === startMins) return 0;
    return endMins > startMins ? endMins - startMins : 24 * 60 - startMins + endMins;
};

export const generateAllowedEndTimeSlots = (startTime24, minHours, maxHours) => {
    const startMins = parseAnyTimeToMinutes(startTime24);
    if (startMins === null || minHours <= 0 || maxHours < minHours) return [];
    const slots = [];
    for (let offset = Math.round(minHours * 60); offset <= Math.round(maxHours * 60); offset += 30) {
        const wrappedMins = (startMins + offset) % (24 * 60);
        const value24 = `${String(Math.floor(wrappedMins / 60)).padStart(2, "0")}:${String(wrappedMins % 60).padStart(2, "0")}`;
        slots.push({ value24, label12: format24To12Label(value24) });
    }
    return slots;
};

/**
 * Validates `[startTime24, endTime24]` against `minHours`/`maxHours` bounds,
 * `timedSlot` temple operating hours, and existing `bookings` overlap.
 */
export const validateFacilityTimeWindow = (
    facility,
    eventDateStr,
    startTime24,
    endTime24,
    { minHours = 0, maxHours = 0, isShiftLocked = false } = {}
) => {
    const startMins = parseAnyTimeToMinutes(startTime24);
    const endMins = parseAnyTimeToMinutes(endTime24);

    if (startMins === null || endMins === null) return "";

    const durationMins = computeDurationMinutes(startTime24, endTime24);
    if (!durationMins || durationMins <= 0) {
        return "End Time must be different from Start Time.";
    }

    // 1. Validate `hourFrom` (minHours) and `hourTo` (maxHours) for hourly rules
    if (!isShiftLocked && minHours > 0 && maxHours >= minHours) {
        const minRequiredMins = Math.round(minHours * 60);
        const maxAllowedMins = Math.round(maxHours * 60);
        if (durationMins < minRequiredMins || durationMins > maxAllowedMins) {
            return minHours === maxHours
                ? `Selected duration tier requires exactly ${minHours} hour(s).`
                : `Selected duration tier requires between ${minHours} and ${maxHours} hours.`;
        }
    }

    // 2. Check weekday `timedSlot` temple operating window if configured (same-day intervals)
    if (
        endMins > startMins &&
        Array.isArray(facility?.timedSlot) &&
        facility.timedSlot.length > 0 &&
        eventDateStr
    ) {
        const parts = String(eventDateStr).split("/");
        if (parts.length === 3) {
            const dt = new Date(
                Number(parts[2]),
                Number(parts[0]) - 1,
                Number(parts[1])
            );
            const weekdayName = dt.toLocaleDateString("en-US", { weekday: "long" });
            const matchedSlot = facility.timedSlot.find(
                (s) =>
                    String(s?.day || "").trim().toLowerCase() ===
                    weekdayName.toLowerCase()
            );
            if (matchedSlot) {
                const slotStart = parseAnyTimeToMinutes(matchedSlot.timedStartTime);
                const slotEnd = parseAnyTimeToMinutes(matchedSlot.timedEndTime);
                if (slotStart !== null && slotEnd !== null) {
                    if (startMins < slotStart || endMins > slotEnd) {
                        return `Available on ${weekdayName} only between ${matchedSlot.timedStartTime} and ${matchedSlot.timedEndTime}.`;
                    }
                }
            }
        }
    }

    // 3. Check existing `bookings` array for overlap on the same date
    if (Array.isArray(facility?.bookings) && facility.bookings.length > 0) {
        const hasOverlap = facility.bookings.some((b) => {
            const bStart = parseAnyTimeToMinutes(b?.startTime || b?.time);
            const bEnd = parseAnyTimeToMinutes(b?.endTime);
            if (bStart === null || bEnd === null) return false;
            return startMins < bEnd && endMins > bStart;
        });
        if (hasOverlap) {
            return "Selected time overlaps with an existing facility booking.";
        }
    }

    return "";
};

/**
 * Generates half-hour (30-minute) interval slots starting at `startTime24` (inclusive)
 * up to 11:00 PM (`23:00` / `1380` minutes) on the same day.
 *
 * @param {string} startTime24 - `"HH:mm"`
 * @returns {Array<{ value24: string, label12: string }>}
 */
export const generateHalfHourServiceSlots = (startTime24) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(startTime24 || "").trim());
    if (!match) return [];

    const startMins = Number(match[1]) * 60 + Number(match[2]);
    const endCutoffMins = 23 * 60; // 11:00 PM

    if (!Number.isFinite(startMins) || startMins < 0 || startMins > endCutoffMins) {
        return [];
    }

    const slots = [];
    for (let mins = startMins; mins <= endCutoffMins; mins += 30) {
        const hh = String(Math.floor(mins / 60)).padStart(2, "0");
        const mm = String(mins % 60).padStart(2, "0");
        const value24 = `${hh}:${mm}`;
        slots.push({
            value24,
            label12: format24To12Label(value24),
        });
    }
    return slots;
};

/**
 * Fetches read-only Temple client address details via TanStack Query.
 */
export const useGetTempleClientInfo = (clientId = ENV_CONFIG.CLIENT_ID) => {
    return useQuery({
        queryKey: ["templeClientInfo", clientId],
        queryFn: ({ signal }) => fetchTempleClientInfo({ signal }),
        staleTime: 1000 * 60 * 60,
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

/**
 * Fetches active IN-TEMPLE `SERVICE REQUEST` items when Priest Services (`YES`) is enabled.
 */
export const useGetFacilityPriestServices = (enabled = false) => {
    return useQuery({
        queryKey: [
            "facilityPriestServices",
            ENV_CONFIG.CLIENT_ID,
            ENV_CONFIG.PRODUCT_ID,
        ],
        queryFn: ({ signal }) => fetchFacilityPriestServices({ signal }),
        enabled: Boolean(enabled),
        staleTime: 1000 * 60 * 15,
        retry: 1,
        refetchOnWindowFocus: false,
    });
};

/**
 * Fetches available priests for the selected `eventDate` and `serviceTime`.
 */
export const useGetAvailablePriests = ({
    enabled = false,
    serviceDate = "",
    serviceTime24 = "",
}) => {
    const targetTime12 = useMemo(
        () => format24To12Label(serviceTime24),
        [serviceTime24]
    );

    return useQuery({
        queryKey: [
            "facilityAvailablePriests",
            ENV_CONFIG.CLIENT_ID,
            serviceDate,
            targetTime12,
        ],
        queryFn: ({ signal }) =>
            fetchAvailablePriests(
                {
                    serviceDate,
                    targetTime: targetTime12,
                },
                { signal }
            ),
        enabled: Boolean(enabled && serviceDate && targetTime12),
        staleTime: 1000 * 60 * 2,
        retry: 1,
        refetchOnWindowFocus: false,
    });
};

/**
 * Fetches facility availability for Step 2 (`Choose Rental`).
 */
export const useGetFacilityAvailability = ({
    enabled = false,
    serviceDate = "",
    eventTime24 = "",
    participant = 0,
}) => {
    const targetTime12 = useMemo(
        () => format24To12Label(eventTime24),
        [eventTime24]
    );

    return useQuery({
        queryKey: [
            "facilityAvailability",
            ENV_CONFIG.CLIENT_ID,
            serviceDate,
            targetTime12,
            Number(participant) || 0,
        ],
        queryFn: ({ signal }) =>
            fetchFacilityAvailability(
                {
                    serviceDate,
                    targetTime: targetTime12,
                    participant,
                },
                { signal }
            ),
        enabled: Boolean(enabled && serviceDate && targetTime12),
        staleTime: 1000 * 60 * 2,
        retry: 1,
        refetchOnWindowFocus: false,
    });
};

/**
 * Fetches temple `facilitySettings` (`shift` & `hourlyBookingRules`).
 */
export const useGetFacilityShiftRules = (enabled = false) => {
    return useQuery({
        queryKey: ["facilityShiftRules", ENV_CONFIG.CLIENT_ID],
        queryFn: ({ signal }) => fetchFacilityShiftRules({ signal }),
        enabled: Boolean(enabled),
        staleTime: 1000 * 60 * 60,
        retry: 1,
        refetchOnWindowFocus: false,
    });
};

const validateCoreEventFields = (details) => {
    const errors = {};
    const missingLabels = [];

    if (!String(details.eventName || "").trim()) {
        errors.eventName = "Event Name is required.";
        missingLabels.push("Event Name");
    }

    if (!String(details.eventDate || "").trim()) {
        errors.eventDate = "Event Date is required.";
        missingLabels.push("Event Date");
    }

    if (!String(details.eventTime || "").trim()) {
        errors.eventTime = "Event Time is required.";
        missingLabels.push("Event Time");
    }

    const attendeesNum = Number(details.attendeesCount);
    if (
        !String(details.attendeesCount || "").trim() ||
        !Number.isFinite(attendeesNum) ||
        attendeesNum <= 0
    ) {
        errors.attendeesCount = "Estimated Number of Attendees is required.";
        missingLabels.push("No. of Attendees");
    }

    return {
        isValid: missingLabels.length === 0,
        errors,
        missingLabels,
    };
};

export const useFacilityForm = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [eventDetails, setEventDetails] = useState(() => ({
        ...INITIAL_EVENT_DETAILS,
    }));
    const [fieldErrors, setFieldErrors] = useState({});
    const [validationBanner, setValidationBanner] = useState("");
    const [selectedRentals, setSelectedRentals] = useState({});

    // Tracks per-facility slot availability results when a time slot (`facilityId` + `targetEndTime`) is checked
    const [slotAvailabilityMap, setSlotAvailabilityMap] = useState({});
    const slotAbortControllersRef = useRef({});

    useEffect(() => {
        const controllers = slotAbortControllersRef.current;
        return () => {
            Object.values(controllers).forEach((ctrl) => {
                try {
                    ctrl?.abort();
                } catch {
                    // Ignore abort cleanup errors
                }
            });
        };
    }, []);

    /**
     * Calls `getfacilityAvailbility` with `facilityId`, `targetTime`, and `targetEndTime`
     * whenever the user selects or changes a time slot on a specific facility card.
     */
    const verifyFacilitySlotAvailability = useCallback(
        async (facilityId, startTime24, endTime24) => {
            const targetStart12 = format24To12Label(startTime24);
            const targetEnd12 = format24To12Label(endTime24);

            if (!facilityId || !eventDetails.eventDate || !targetStart12 || !targetEnd12) {
                return;
            }

            if (slotAbortControllersRef.current[facilityId]) {
                try {
                    slotAbortControllersRef.current[facilityId].abort();
                } catch {
                    // Ignore previous request abort
                }
            }

            const controller = new AbortController();
            slotAbortControllersRef.current[facilityId] = controller;

            setSlotAvailabilityMap((prev) => ({
                ...prev,
                [facilityId]: {
                    ...(prev[facilityId] || {}),
                    isChecking: true,
                    isSlotUnavailable: false,
                    message: "",
                },
            }));

            try {
                const results = await fetchFacilityAvailability(
                    {
                        serviceDate: eventDetails.eventDate,
                        targetTime: targetStart12,
                        targetEndTime: targetEnd12,
                        facilityId,
                        participant: eventDetails.attendeesCount,
                    },
                    { signal: controller.signal }
                );

                if (controller.signal.aborted) return;

                const matched =
                    results.find((item) => item.id === facilityId) || results[0] || null;

                const isSlotUnavailable = Boolean(matched?.isBlocked);
                const message = isSlotUnavailable
                    ? matched?.availabilityMessage || "Not Available for selected time slot."
                    : "";

                setSlotAvailabilityMap((prev) => ({
                    ...prev,
                    [facilityId]: {
                        isChecking: false,
                        isSlotUnavailable,
                        message,
                    },
                }));

                if (isSlotUnavailable) {
                    setSelectedRentals((prev) => {
                        const existing = prev[facilityId];
                        if (!existing) return prev;
                        return {
                            ...prev,
                            [facilityId]: {
                                ...existing,
                                isChecked: false,
                                timeError: message,
                            },
                        };
                    });
                }
            } catch (err) {
                if (
                    controller.signal.aborted ||
                    err?.name === "AbortError" ||
                    err?.code === "ERR_CANCELED"
                ) {
                    return;
                }
                setSlotAvailabilityMap((prev) => ({
                    ...prev,
                    [facilityId]: {
                        isChecking: false,
                        isSlotUnavailable: false,
                        message: "",
                    },
                }));
            }
        },
        [eventDetails.eventDate, eventDetails.attendeesCount]
    );

    const {
        data: templeAddress,
        isLoading: isAddressLoading,
        isError: isAddressError,
    } = useGetTempleClientInfo();

    const isPriestSectionActive = eventDetails.addPriestServices === "YES";

    const {
        data: priestServices = [],
        isLoading: isPriestServicesLoading,
    } = useGetFacilityPriestServices(isPriestSectionActive);

    const serviceTimeSlots = useMemo(
        () => generateHalfHourServiceSlots(eventDetails.eventTime),
        [eventDetails.eventTime]
    );

    const activeServiceTime24 =
        eventDetails.serviceTime || eventDetails.eventTime || "";

    const {
        data: rawAvailablePriests = [],
        isLoading: isPriestsLoading,
    } = useGetAvailablePriests({
        enabled: isPriestSectionActive,
        serviceDate: eventDetails.eventDate,
        serviceTime24: activeServiceTime24,
    });

    const availablePriests = useMemo(
        () =>
            rawAvailablePriests.filter(
                (priest) =>
                    String(priest?.availability || "")
                        .trim()
                        .toLowerCase() === "available"
            ),
        [rawAvailablePriests]
    );

    const {
        data: facilitiesList = [],
        isLoading: isFacilitiesLoading,
        isError: isFacilitiesError,
        refetch: refetchFacilities,
    } = useGetFacilityAvailability({
        enabled: currentStep >= 2,
        serviceDate: eventDetails.eventDate,
        eventTime24: eventDetails.eventTime,
        participant: eventDetails.attendeesCount,
    });

    const { data: facilitySettingsData } = useGetFacilityShiftRules(
        currentStep >= 2
    );

    const shiftDefinitions = useMemo(
        () =>
            Array.isArray(facilitySettingsData?.shifts)
                ? facilitySettingsData.shifts
                : [],
        [facilitySettingsData]
    );

    const hourlyBookingRules = useMemo(
        () =>
            Array.isArray(facilitySettingsData?.hourlyBookingRules)
                ? facilitySettingsData.hourlyBookingRules
                : [],
        [facilitySettingsData]
    );

    /**
     * Updates Step 1 fields with one-way sync from upper `eventTime` -> lower `serviceTime`.
     */
    const updateEventField = useCallback((field, value) => {
        setEventDetails((prev) => {
            if (field === "eventTime") {
                return {
                    ...prev,
                    eventTime: value,
                    serviceTime: value,
                    selectedPriestId: "",
                    selectedPriestName: "",
                };
            }

            if (field === "eventDate") {
                return {
                    ...prev,
                    eventDate: value,
                    selectedPriestId: "",
                    selectedPriestName: "",
                };
            }

            if (field === "serviceTime") {
                return {
                    ...prev,
                    serviceTime: value,
                    selectedPriestId: "",
                    selectedPriestName: "",
                };
            }

            return {
                ...prev,
                [field]: value,
            };
        });

        setFieldErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });

        setValidationBanner("");
    }, []);

    /**
     * Selects a Priest Service from dropdown and auto pre-fills `serviceAmount`.
     */
    const selectPriestServiceOffering = useCallback(
        (serviceId) => {
            const cleanId = String(serviceId || "").trim();
            const matched = priestServices.find((srv) => srv.id === cleanId);

            setEventDetails((prev) => ({
                ...prev,
                selectedServiceId: matched ? matched.id : "",
                selectedServiceName: matched ? matched.refDataName : "",
                serviceAmount: matched ? matched.formattedAmount : "",
            }));

            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.selectedServiceId;
                delete next.serviceAmount;
                return next;
            });
            setValidationBanner("");
        },
        [priestServices]
    );

    /**
     * Selects a Preferred Priest from `getpriestAvailbilityNew` list.
     */
    const selectPreferredPriest = useCallback(
        (priestId) => {
            const cleanId = String(priestId || "").trim();
            const matched = availablePriests.find((p) => p.id === cleanId);

            setEventDetails((prev) => ({
                ...prev,
                selectedPriestId: matched ? matched.id : "",
                selectedPriestName: matched ? matched.refDataName : "",
            }));

            setFieldErrors((prev) => {
                if (!prev.selectedPriestId) return prev;
                const next = { ...prev };
                delete next.selectedPriestId;
                return next;
            });
            setValidationBanner("");
        },
        [availablePriests]
    );

    /**
     * Enforces mandatory core fields before allowing Priest Services = `"YES"`.
     */
    const selectPriestServices = useCallback(
        (choice) => {
            const normalized = String(choice || "").trim().toUpperCase();

            if (normalized === "YES") {
                const { isValid, errors, missingLabels } =
                    validateCoreEventFields(eventDetails);

                if (!isValid) {
                    setFieldErrors((prev) => ({
                        ...prev,
                        ...errors,
                    }));
                    setValidationBanner(
                        `Please fill ${missingLabels.join(", ")} before selecting Yes for Priest Services.`
                    );
                    return false;
                }
            }

            setEventDetails((prev) => ({
                ...prev,
                addPriestServices: normalized,
                serviceTime:
                    normalized === "YES" ? prev.serviceTime || prev.eventTime : "",
                ...(normalized === "NO"
                    ? {
                        selectedServiceId: "",
                        selectedServiceName: "",
                        serviceAmount: "",
                        selectedPriestId: "",
                        selectedPriestName: "",
                    }
                    : {}),
            }));

            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.addPriestServices;
                return next;
            });
            setValidationBanner("");
            return true;
        },
        [eventDetails]
    );

    /**
     * Validates Step 1 completely (including Priest sub-fields when `"YES"` is selected).
     */
    const handleProceedFromEventDetails = useCallback(() => {
        const { isValid, errors, missingLabels } =
            validateCoreEventFields(eventDetails);
        const nextErrors = { ...errors };
        const allMissing = [...missingLabels];

        if (!eventDetails.addPriestServices) {
            nextErrors.addPriestServices =
                "Please select Yes or No for Priest Services.";
            allMissing.push("Priest Services (Yes/No)");
        }

        if (eventDetails.addPriestServices === "YES") {
            if (!String(eventDetails.selectedServiceId || "").trim()) {
                nextErrors.selectedServiceId = "Please select a Priest Service.";
                allMissing.push("Service");
            }
            if (!String(eventDetails.serviceAmount || "").trim()) {
                nextErrors.serviceAmount = "Service Amount is required.";
                allMissing.push("Service Amount");
            }
            if (!String(activeServiceTime24 || "").trim()) {
                nextErrors.serviceTime = "Please select a Service Time.";
                allMissing.push("Service Time");
            }
            if (!String(eventDetails.selectedPriestId || "").trim()) {
                nextErrors.selectedPriestId = "Please select a Preferred Priest.";
                allMissing.push("Preferred Priest");
            }
        }

        if (allMissing.length > 0 || !isValid) {
            setFieldErrors(nextErrors);
            setValidationBanner(
                `Please complete all required fields: ${allMissing.join(", ")}.`
            );
            return false;
        }

        setFieldErrors({});
        setValidationBanner("");
        setCurrentStep(2);
        return true;
    }, [eventDetails, activeServiceTime24]);

    /**
     * Resolves shift lock OR `hourFrom` (minHours) / `hourTo` (maxHours) rule for a tier key.
     */
    const resolveRuleForTier = useCallback(
        (startTime24, tierKey) => {
            const cleanKey = String(tierKey || "").trim().toUpperCase();

            // 1. Check Shift-Based rule (`facilitySettings.shift`: MORNING, AFTERNOON, EVENING, FULL DAY)
            const matchedShift = shiftDefinitions.find(
                (s) => s.name.toUpperCase() === cleanKey
            );
            if (matchedShift && matchedShift.startTime && matchedShift.endTime) {
                return {
                    isShiftLocked: true,
                    shiftName: matchedShift.name,
                    startTime: normalizeTo24Hour(matchedShift.startTime),
                    endTime: normalizeTo24Hour(matchedShift.endTime),
                    minHours: 0,
                    maxHours: 0,
                    endTimeSlots: [],
                };
            }

            // Guard: Never treat known shift names as hourly min/max durations
            const isNamedShift = ["MORNING", "AFTERNOON", "EVENING", "FULL DAY"].includes(
                cleanKey
            );
            if (isNamedShift) {
                return {
                    isShiftLocked: true,
                    shiftName: cleanKey,
                    startTime: startTime24,
                    endTime: startTime24,
                    minHours: 0,
                    maxHours: 0,
                    endTimeSlots: [],
                };
            }

            // 2. Check Hourly Booking Rule (`hourFrom` = minHours, `hourTo` = maxHours)
            const matchedHourly = hourlyBookingRules.find(
                (r) => r.slotName.toUpperCase() === cleanKey
            );

            let minHours = matchedHourly?.hourFrom || 0;
            let maxHours = matchedHourly?.hourTo || minHours;

            if (minHours <= 0) {
                if (cleanKey.includes("OVER 4")) {
                    minHours = 5;
                    maxHours = 9;
                } else if (cleanKey.includes("1 - 4") || cleanKey.includes("1-4")) {
                    minHours = 4;
                    maxHours = 4;
                } else if (cleanKey.startsWith("1 HOUR")) {
                    minHours = 1;
                    maxHours = 1;
                } else {
                    minHours = 1;
                    maxHours = 4;
                }
            }

            const defaultEnd = addHoursToTime24(startTime24, minHours);
            const endTimeSlots = generateAllowedEndTimeSlots(
                startTime24,
                minHours,
                maxHours
            );

            return {
                isShiftLocked: false,
                shiftName: "",
                startTime: startTime24,
                endTime: defaultEnd,
                minHours,
                maxHours,
                endTimeSlots,
            };
        },
        [shiftDefinitions, hourlyBookingRules]
    );

    /**
     * Updates the `Select Type` (`priceType`) dropdown for a facility card.
     * Applies Shift timings (MORNING/EVENING/etc.) or `hourFrom`..`hourTo` bounds.
     * Does NOT auto-check the facility.
     */
    const selectFacilityPriceTier = useCallback(
        (facility, tierKey) => {
            if (!facility || facility.isBlocked) return;
            const matchedTier = facility.priceTypes.find((t) => t.key === tierKey);
            if (!matchedTier) return;

            const baseStart = eventDetails.eventTime || "";
            const ruleInfo = resolveRuleForTier(baseStart, matchedTier.key);

            const timeError = validateFacilityTimeWindow(
                facility,
                eventDetails.eventDate,
                ruleInfo.startTime,
                ruleInfo.endTime,
                {
                    minHours: ruleInfo.minHours,
                    maxHours: ruleInfo.maxHours,
                    isShiftLocked: ruleInfo.isShiftLocked,
                }
            );

            setSelectedRentals((prev) => {
                const existing = prev[facility.id];
                return {
                    ...prev,
                    [facility.id]: {
                        facilityId: facility.id,
                        serviceName: facility.refDataName,
                        rentalCategory: facility.rentalCategory,
                        refDataCode: facility.refDataCode,
                        selectedTierKey: matchedTier.key,
                        unitPrice: matchedTier.value,
                        qty: existing?.qty || 1,
                        isShiftLocked: ruleInfo.isShiftLocked,
                        minHours: ruleInfo.minHours,
                        maxHours: ruleInfo.maxHours,
                        endTimeSlots: ruleInfo.endTimeSlots,
                        startTime: ruleInfo.startTime,
                        endTime: ruleInfo.endTime,
                        timeError,
                        isChecked: Boolean(existing?.isChecked && !timeError),
                        rawFacility: facility,
                    },
                };
            });
            setValidationBanner("");

            if (!timeError && ruleInfo.startTime && ruleInfo.endTime) {
                verifyFacilitySlotAvailability(
                    facility.id,
                    ruleInfo.startTime,
                    ruleInfo.endTime
                );
            }
        },
        [
            eventDetails.eventTime,
            eventDetails.eventDate,
            resolveRuleForTier,
            verifyFacilitySlotAvailability,
        ]
    );

    /**
     * Updates `From Time` or `To Time` on an individual facility card.
     * Ignores manual edits when a fixed shift (`MORNING`, `EVENING`, etc.) is locked.
     */
    const updateFacilityTimeRange = useCallback(
        (facility, field, nextTime24) => {
            if (!facility || facility.isBlocked) return;

            setSelectedRentals((prev) => {
                const existing = prev[facility.id];
                if (!existing || existing.isShiftLocked) return prev;

                const nextStart =
                    field === "startTime" ? nextTime24 : existing.startTime;

                const ruleInfo = existing.selectedTierKey
                    ? resolveRuleForTier(nextStart, existing.selectedTierKey)
                    : {
                        minHours: existing.minHours || 0,
                        maxHours: existing.maxHours || 0,
                        endTimeSlots: [],
                        endTime: existing.endTime,
                    };

                const nextEnd =
                    field === "startTime" ? ruleInfo.endTime : nextTime24;

                const timeError = validateFacilityTimeWindow(
                    facility,
                    eventDetails.eventDate,
                    nextStart,
                    nextEnd,
                    {
                        minHours: ruleInfo.minHours,
                        maxHours: ruleInfo.maxHours,
                        isShiftLocked: false,
                    }
                );

                const isTimeComplete = Boolean(nextStart && nextEnd);

                return {
                    ...prev,
                    [facility.id]: {
                        ...existing,
                        startTime: nextStart,
                        endTime: nextEnd,
                        minHours: ruleInfo.minHours,
                        maxHours: ruleInfo.maxHours,
                        endTimeSlots: ruleInfo.endTimeSlots,
                        timeError,
                        isChecked: Boolean(
                            existing.isChecked && isTimeComplete && !timeError
                        ),
                    },
                };
            });
            setValidationBanner("");

            const currentEntry = selectedRentals[facility.id];
            if (currentEntry && !currentEntry.isShiftLocked) {
                const resolvedStart =
                    field === "startTime" ? nextTime24 : currentEntry.startTime;
                const resolvedRule = currentEntry.selectedTierKey
                    ? resolveRuleForTier(resolvedStart, currentEntry.selectedTierKey)
                    : {
                        minHours: currentEntry.minHours || 0,
                        maxHours: currentEntry.maxHours || 0,
                        endTime: currentEntry.endTime,
                    };
                const resolvedEnd =
                    field === "startTime" ? resolvedRule.endTime : nextTime24;

                const nextErr = validateFacilityTimeWindow(
                    facility,
                    eventDetails.eventDate,
                    resolvedStart,
                    resolvedEnd,
                    {
                        minHours: resolvedRule.minHours,
                        maxHours: resolvedRule.maxHours,
                        isShiftLocked: false,
                    }
                );

                if (!nextErr && resolvedStart && resolvedEnd) {
                    verifyFacilitySlotAvailability(
                        facility.id,
                        resolvedStart,
                        resolvedEnd
                    );
                }
            }
        },
        [
            eventDetails.eventDate,
            resolveRuleForTier,
            selectedRentals,
            verifyFacilitySlotAvailability,
        ]
    );

    /**
     * Steps quantity (`-1` / `+1`) for facilities with `qtyCounterEnabled === true`.
     */
    const adjustFacilityQuantity = useCallback((facility, delta) => {
        if (!facility || facility.isBlocked) return;

        setSelectedRentals((prev) => {
            const existing = prev[facility.id];
            const currentQty = existing?.qty || 1;
            const nextQty = Math.max(1, currentQty + delta);

            return {
                ...prev,
                [facility.id]: {
                    facilityId: facility.id,
                    serviceName: facility.refDataName,
                    rentalCategory: facility.rentalCategory,
                    refDataCode: facility.refDataCode,
                    selectedTierKey: existing?.selectedTierKey || "",
                    unitPrice: existing?.unitPrice ?? facility.baseUnitPrice,
                    qty: nextQty,
                    isShiftLocked: Boolean(existing?.isShiftLocked),
                    minHours: existing?.minHours || 0,
                    maxHours: existing?.maxHours || 0,
                    endTimeSlots: existing?.endTimeSlots || [],
                    startTime: existing?.startTime || "",
                    endTime: existing?.endTime || "",
                    timeError: existing?.timeError || "",
                    isChecked: existing?.isChecked ?? false,
                    rawFacility: facility,
                },
            };
        });
    }, []);

    /**
     * Toggles the selection checkbox manually:
     * - Unchecking wipes all stored selections for this facility.
     * - Checking validates tier, times, shift/min-max rules, and overlap.
     */
    const toggleFacilitySelection = useCallback(
        (facility) => {
            if (!facility || facility.isBlocked) return;

            const existing = selectedRentals[facility.id];
            const willCheck = !existing?.isChecked;

            if (!willCheck) {
                setSelectedRentals((prev) => {
                    const next = { ...prev };
                    delete next[facility.id];
                    return next;
                });
                setSlotAvailabilityMap((prev) => {
                    if (!prev[facility.id]) return prev;
                    const next = { ...prev };
                    delete next[facility.id];
                    return next;
                });
                setValidationBanner("");
                return;
            }

            const slotState = slotAvailabilityMap[facility.id];
            if (slotState?.isChecking) {
                setValidationBanner(
                    `Checking slot availability for ${facility.refDataName}... Please wait.`
                );
                return;
            }
            if (slotState?.isSlotUnavailable) {
                setValidationBanner(
                    slotState.message ||
                    `${facility.refDataName} is Not Available for the selected time slot.`
                );
                return;
            }

            if (facility.hasPriceTypes && !existing?.selectedTierKey) {
                setValidationBanner(
                    `Please select a duration type ("Select Type") for ${facility.refDataName} before checking it.`
                );
                return;
            }

            const resolvedStart = existing?.startTime || "";
            const resolvedEnd = existing?.endTime || "";

            if (facility.isDTVisible && (!resolvedStart || !resolvedEnd)) {
                setValidationBanner(
                    `Please select From Time and To Time for ${facility.refDataName} before checking it.`
                );
                return;
            }

            const timeError =
                existing?.timeError ||
                (facility.isDTVisible
                    ? validateFacilityTimeWindow(
                        facility,
                        eventDetails.eventDate,
                        resolvedStart,
                        resolvedEnd,
                        {
                            minHours: existing?.minHours || 0,
                            maxHours: existing?.maxHours || 0,
                            isShiftLocked: Boolean(existing?.isShiftLocked),
                        }
                    )
                    : "");

            if (timeError) {
                setValidationBanner(timeError);
                return;
            }

            setSelectedRentals((prev) => ({
                ...prev,
                [facility.id]: {
                    facilityId: facility.id,
                    serviceName: facility.refDataName,
                    rentalCategory: facility.rentalCategory,
                    refDataCode: facility.refDataCode,
                    selectedTierKey: existing?.selectedTierKey || "",
                    unitPrice: existing?.unitPrice ?? facility.baseUnitPrice,
                    qty: existing?.qty || 1,
                    isShiftLocked: Boolean(existing?.isShiftLocked),
                    minHours: existing?.minHours || 0,
                    maxHours: existing?.maxHours || 0,
                    endTimeSlots: existing?.endTimeSlots || [],
                    startTime: resolvedStart,
                    endTime: resolvedEnd,
                    timeError: "",
                    isChecked: true,
                    rawFacility: facility,
                },
            }));

            setValidationBanner("");
        },
        [selectedRentals, slotAvailabilityMap, eventDetails.eventDate]
    );

    /**
     * Validates Step 2 (`Choose Rental`) and advances to Step 3 (`Submit Request`).
     */
    const handleProceedFromChooseRental = useCallback(() => {
        const checkedItems = Object.values(selectedRentals).filter(
            (item) => item?.isChecked
        );

        if (checkedItems.length === 0) {
            setValidationBanner(
                "Please select at least one available facility rental to proceed."
            );
            return false;
        }

        const invalidTimeItem = checkedItems.find((item) => item.timeError);
        if (invalidTimeItem) {
            setValidationBanner(invalidTimeItem.timeError);
            return false;
        }

        setValidationBanner("");
        setCurrentStep(3);
        return true;
    }, [selectedRentals]);

    const checkedRentalsList = useMemo(
        () => Object.values(selectedRentals).filter((item) => item?.isChecked),
        [selectedRentals]
    );

    const rentalsSubtotal = useMemo(
        () =>
            checkedRentalsList.reduce(
                (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.qty || 1),
                0
            ),
        [checkedRentalsList]
    );

    // Devotee membership evaluation for Step 3 (`Submit Request`)
    const authUser = useAuthStore((state) => state.user);
    const memberId = authUser?._id || authUser?.id || authUser?.memberId || "";
    const { data: devoteeProfile } = useGetDevoteeDetails(memberId);
    const { data: cumulativeData } = useGetCumulativeAmount(memberId);

    const membershipStatusInfo = useMemo(
        () =>
            evaluateMembershipStatus(
                devoteeProfile,
                authUser,
                cumulativeData?.totalAmount || 0
            ),
        [devoteeProfile, authUser, cumulativeData]
    );

    const isMemberActive = Boolean(membershipStatusInfo?.isActive);

    // Step 3 Financial Breakdown (Rentals + Optional Priest Service + Member Discount + Security Deposit)
    const step3PricingSummary = useMemo(() => {
        const facilitySettings = facilitySettingsData?.facilitySettings || {};
        const membershipSettings = facilitySettingsData?.membershipSettings || {};

        const globalFacDiscVal =
            parseFloat(String(membershipSettings?.facilityMembershipDiscount ?? "0")) || 0;
        const globalFacDiscType = String(
            membershipSettings?.facilityDiscountType || "PERCENT"
        )
            .trim()
            .toUpperCase();

        let totalMembershipDiscount = 0;

        const itemizedRentals = checkedRentalsList.map((item) => {
            const qty = Math.max(1, Number(item.qty) || 1);
            const originalUnitPrice = Number(item.unitPrice || 0);
            const lineOriginalTotal = originalUnitPrice * qty;

            const rawFacility = item.rawFacility || {};
            const isItemEligible =
                isMemberActive &&
                Boolean(rawFacility.membershipDiscount);

            let unitDiscount = 0;
            if (isItemEligible) {
                const flatOverride = Number(rawFacility.membershipAmount || 0);
                if (flatOverride > 0) {
                    unitDiscount = flatOverride;
                } else if (globalFacDiscVal > 0) {
                    unitDiscount =
                        globalFacDiscType === "FLAT"
                            ? globalFacDiscVal
                            : (originalUnitPrice * globalFacDiscVal) / 100;
                }
            }

            unitDiscount = Math.min(originalUnitPrice, Math.max(0, unitDiscount));
            const finalUnitPrice = Math.max(0, originalUnitPrice - unitDiscount);
            const lineDiscountTotal = unitDiscount * qty;
            const lineFinalTotal = finalUnitPrice * qty;

            totalMembershipDiscount += lineDiscountTotal;

            return {
                ...item,
                qty,
                originalUnitPrice,
                unitDiscount,
                finalUnitPrice,
                lineOriginalTotal,
                lineDiscountTotal,
                lineFinalTotal,
            };
        });

        const priestServiceAmount =
            eventDetails.addPriestServices === "YES"
                ? parseFloat(
                    String(eventDetails.serviceAmount || "0").replace(/[^0-9.]/g, "")
                ) || 0
                : 0;

        const subtotal = rentalsSubtotal + priestServiceAmount;
        const discountedSubtotal = Math.max(0, subtotal - totalMembershipDiscount);

        // Facility Security Amount (`facilitySecurityAmount` & `facilitySecurityType`: "FLAT" | "PERCENT")
        const rawSecurityVal =
            parseFloat(String(facilitySettings?.facilitySecurityAmount ?? "0")) || 0;
        const securityType = String(
            facilitySettings?.facilitySecurityType || "FLAT"
        )
            .trim()
            .toUpperCase();

        const securityDepositAmount =
            rawSecurityVal > 0
                ? securityType === "PERCENT"
                    ? (discountedSubtotal * rawSecurityVal) / 100
                    : rawSecurityVal
                : 0;

        const saleTotal = discountedSubtotal + securityDepositAmount;

        return {
            itemizedRentals,
            priestServiceAmount,
            rentalsSubtotal,
            subtotal,
            totalMembershipDiscount,
            discountedSubtotal,
            securityDepositAmount,
            securityType,
            saleTotal,
            facilitySettings,
            membershipSettings,
        };
    }, [
        facilitySettingsData,
        checkedRentalsList,
        isMemberActive,
        rentalsSubtotal,
        eventDetails.addPriestServices,
        eventDetails.serviceAmount,
    ]);

    const goToStep = useCallback(
        (stepNumber) => {
            if (stepNumber === 1) {
                setCurrentStep(1);
            } else if (stepNumber === 2 && currentStep >= 2) {
                setCurrentStep(2);
            }
        },
        [currentStep]
    );

    const readOnlyAddress = useMemo(
        () => ({
            streetAddress: templeAddress?.streetAddress ?? "",
            addressLineOne: templeAddress?.addressLineOne ?? "",
            addressLinetwo: templeAddress?.addressLinetwo ?? "",
            state: templeAddress?.state ?? "",
            city: templeAddress?.city ?? "",
            zipCode: templeAddress?.zipCode ?? "",
        }),
        [templeAddress]
    );

    return {
        currentStep,
        steps: FACILITY_TIMELINE_STEPS,
        eventDetails,
        fieldErrors,
        validationBanner,
        clearValidationBanner: () => setValidationBanner(""),
        readOnlyAddress,
        isAddressLoading,
        isAddressError,
        isPriestSectionActive,
        priestServices,
        isPriestServicesLoading,
        serviceTimeSlots,
        activeServiceTime24,
        availablePriests,
        isPriestsLoading,
        updateEventField,
        selectPriestServiceOffering,
        selectPreferredPriest,
        selectPriestServices,
        handleProceedFromEventDetails,
        goToStep,
        facilitiesList,
        isFacilitiesLoading,
        isFacilitiesError,
        refetchFacilities,
        selectedRentals,
        slotAvailabilityMap,
        checkedRentalsList,
        rentalsSubtotal,
        selectFacilityPriceTier,
        updateFacilityTimeRange,
        adjustFacilityQuantity,
        toggleFacilitySelection,
        handleProceedFromChooseRental,
        isMemberActive,
        membershipStatusInfo,
        step3PricingSummary,
    };
};

export default useFacilityForm;

