/**
 * @file src/hooks/queries/Dashboard/useDashboard.js
 * @description Centralized TanStack Query controller hook for the Devotee Dashboard.
 * Combines cached `useGetDevoteeDetails`, `useGetCumulativeAmount`, and
 * `useGetMyPujaBookings` server queries, evaluates active membership via
 * `evaluateMembershipStatus`, and strips blank fields so presentational JSX
 * never renders empty rows.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Non-Negotiables #2, #3, #4, and #5.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../store/useAuthStore";
import { useGetDevoteeDetails } from "../Profile/useDevoteeProfile";
import {
    fetchCumulativeAmount,
    fetchMyDonations,
    fetchMyPayments,
    fetchMyPujaBookings,
    fetchMySponsors,
    fetchRecurringDonations,
    getCurrentMonthDateRange,
} from "../../../services/dashboardApi";
import { evaluateMembershipStatus } from "../../../utils/membershipDiscount";

/**
 * Sanitizes a display string so blank or placeholder values ("—") resolve to "".
 *
 * @param {string} val
 * @returns {string}
 */
const cleanDisplayValue = (val) => {
    const str = String(val ?? "").trim();
    if (!str || str === "—" || str === "-") return "";
    return str;
};

/**
 * Formats a non-negative integer count into a 2-digit display string ("00", "06", "33").
 *
 * @param {number} count
 * @returns {string}
 */
const formatTwoDigitCount = (count) => {
    const safeNum = Number.isFinite(Number(count))
        ? Math.max(0, Math.floor(Number(count)))
        : 0;
    return String(safeNum).padStart(2, "0");
};

/**
 * TanStack Query hook to fetch accumulated Lifetime Membership transactions
 * from `api/users/getCumulativeAmount`.
 *
 * @param {string} memberId - Logged-in devotee MongoDB `_id`
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useGetCumulativeAmount = (memberId) => {
    return useQuery({
        queryKey: ["cumulativeAmount", memberId],
        queryFn: async ({ signal }) => {
            if (!memberId) {
                return { totalAmount: 0, devoteeData: null };
            }
            return await fetchCumulativeAmount(
                { memberId, checkAndUpdate: false },
                { signal }
            );
        },
        enabled: Boolean(memberId),
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
};

/**
 * TanStack Query hook to fetch the devotee's current-month Puja Bookings
 * (`api/appgen/filterAPI` -> `Calendar` / `Service Schedules` / `serviceBooking`).
 *
 * @param {string} memberId - Logged-in devotee MongoDB `_id`
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useGetMyPujaBookings = (memberId) => {
    const currentMonthRange = useMemo(() => getCurrentMonthDateRange(), []);

    return useQuery({
        queryKey: [
            "myPujaBookings",
            memberId,
            currentMonthRange.startDate,
            currentMonthRange.endDate,
        ],
        queryFn: async ({ signal }) => {
            if (!memberId) {
                return {
                    count: 0,
                    bookings: [],
                    dateRange: currentMonthRange,
                };
            }
            return await fetchMyPujaBookings(
                {
                    memberId,
                    startDate: currentMonthRange.startDate,
                    endDate: currentMonthRange.endDate,
                },
                { signal }
            );
        },
        enabled: Boolean(memberId),
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
};

/**
 * TanStack Query hook to fetch the devotee's current-month Donations
 * (`api/appgen/filterAPI` -> `serviceCategoryTypes: { $in: ["DONATIONS"] }`).
 *
 * @param {string} memberId - Logged-in devotee MongoDB `_id`
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useGetMyDonations = (memberId) => {
    const currentMonthRange = useMemo(() => getCurrentMonthDateRange(), []);

    return useQuery({
        queryKey: [
            "myDonations",
            memberId,
            currentMonthRange.startDate,
            currentMonthRange.endDate,
        ],
        queryFn: async ({ signal }) => {
            if (!memberId) {
                return {
                    count: 0,
                    records: [],
                    dateRange: currentMonthRange,
                };
            }
            return await fetchMyDonations(
                {
                    memberId,
                    startDate: currentMonthRange.startDate,
                    endDate: currentMonthRange.endDate,
                },
                { signal }
            );
        },
        enabled: Boolean(memberId),
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
};

/**
 * TanStack Query hook to fetch the devotee's current-month Sponsorships
 * (`api/appgen/filterAPI` -> `serviceCategoryTypes: { $in: ["SPONSORSHIP"] }`).
 *
 * @param {string} memberId - Logged-in devotee MongoDB `_id`
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useGetMySponsors = (memberId) => {
    const currentMonthRange = useMemo(() => getCurrentMonthDateRange(), []);

    return useQuery({
        queryKey: [
            "mySponsors",
            memberId,
            currentMonthRange.startDate,
            currentMonthRange.endDate,
        ],
        queryFn: async ({ signal }) => {
            if (!memberId) {
                return {
                    count: 0,
                    records: [],
                    dateRange: currentMonthRange,
                };
            }
            return await fetchMySponsors(
                {
                    memberId,
                    startDate: currentMonthRange.startDate,
                    endDate: currentMonthRange.endDate,
                },
                { signal }
            );
        },
        enabled: Boolean(memberId),
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
};

/**
 * TanStack Query hook to fetch the devotee's payment transactions
 * (`api/appgen/filterAPI` -> `moduleName: "Payments"`, `aspectType: "Payments"`).
 *
 * @param {string} memberId - Logged-in devotee MongoDB `_id`
 * @param {string} [userName=""] - Optional devotee full name
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useGetMyPayments = (memberId, userName = "") => {
    return useQuery({
        queryKey: ["myPayments", memberId],
        queryFn: async ({ signal }) => {
            if (!memberId) {
                return { count: 0, records: [] };
            }
            return await fetchMyPayments(
                { memberId, userName },
                { signal }
            );
        },
        enabled: Boolean(memberId),
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
};

/**
 * TanStack Query hook to fetch the devotee's recurring donation schedules
 * (`api/analytics/getrecurringData`).
 *
 * @param {string} memberId - Logged-in devotee MongoDB `_id`
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useGetRecurringDonations = (memberId) => {
    return useQuery({
        queryKey: ["recurringDonations", memberId],
        queryFn: async ({ signal }) => {
            if (!memberId) {
                return { count: 0, records: [] };
            }
            return await fetchRecurringDonations(
                { memberId, startDate: "", endDate: "" },
                { signal }
            );
        },
        enabled: Boolean(memberId),
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
};

/**
 * Normalizes raw MongoDB devotee details + cumulative transaction amount
 * into a clean, crash-safe dashboard view model.
 *
 * @param {Object|null} profile - Fetched devotee record from `getDevoteeDetailsWeb`
 * @param {Object|null} cumulativeResult - Fetched result from `getCumulativeAmount`
 * @param {Object|null} fallbackUser - Authenticated user object from Zustand store
 * @returns {Object} Normalized membership and greeting view model
 */
const mapDashboardMembership = (profile, cumulativeResult, fallbackUser) => {
    const source =
        profile || cumulativeResult?.devoteeData || fallbackUser || {};
    const legacy = source.oldMembershipDetail || {};

    const fullName =
        source.refDataName?.trim() ||
        `${source.firstName || ""} ${source.lastName || ""}`.trim() ||
        "Devotee";

    const rawTotal =
        cumulativeResult?.totalAmount ??
        source.totalAccumulatedAmount ??
        source.accumulatedAmount ??
        0;
    const parsedAmount = Number(rawTotal);
    const safeCumulativeNumber = Number.isFinite(parsedAmount) ? parsedAmount : 0;
    const accumulatedAmount = safeCumulativeNumber.toFixed(2);

    // Evaluate authoritative membership status (checks expiry date, payment COMPLETED, and >= $25,000 threshold)
    const evaluated = evaluateMembershipStatus(
        profile,
        fallbackUser,
        safeCumulativeNumber
    );

    const membershipName = cleanDisplayValue(
        evaluated.membershipName ||
        source.membershipName ||
        legacy.membershipName
    );
    const membershipType = cleanDisplayValue(
        evaluated.membershipType ||
        source.membershipType ||
        legacy.membershipType
    );
    const membershipStatus = cleanDisplayValue(
        evaluated.isActive
            ? "ACTIVE"
            : source.membershipStatus || legacy.membershipStatus || evaluated.status
    ).toUpperCase();

    const membershipStartDate = cleanDisplayValue(
        evaluated.membershipStartDate ||
        source.membershipStartDate ||
        legacy.membershipStartDate
    );
    const memberShipExpiryDate = cleanDisplayValue(
        evaluated.expiryDate ||
        source.memberShipExpiryDate ||
        legacy.memberShipExpiryDate
    );

    const hasStatus = Boolean(membershipStatus);
    const hasStartDate = Boolean(membershipStartDate);
    const hasExpiryDate = Boolean(memberShipExpiryDate);
    const hasMembershipCardData = Boolean(
        membershipName ||
        membershipType ||
        hasStatus ||
        hasStartDate ||
        hasExpiryDate ||
        evaluated.isActive
    );

    return {
        fullName,
        membershipName,
        membershipType,
        membershipStatus,
        isActive: Boolean(evaluated.isActive),
        membershipStartDate,
        memberShipExpiryDate,
        accumulatedAmount,
        hasStatus,
        hasStartDate,
        hasExpiryDate,
        hasMembershipCardData,
    };
};

/**
 * Composite controller hook for Devotee Dashboard data.
 *
 * @returns {{
 *   membership: Object,
 *   pujaBookingsSummary: {
 *     count: number,
 *     formattedCount: string,
 *     bookings: Array<Object>,
 *     dateRange: { startDate: string, endDate: string },
 *     isLoading: boolean
 *   },
 *   isLoading: boolean,
 *   isError: boolean,
 *   refetch: Function
 * }}
 */
export const useDashboard = () => {
    const user = useAuthStore((state) => state.user);
    const memberId = user?._id || user?.id || user?.memberId || "";

    const {
        data: devoteeDetails,
        isLoading: isProfileLoading,
        isError: isProfileError,
        refetch: refetchProfile,
    } = useGetDevoteeDetails(memberId);

    const {
        data: cumulativeData,
        isLoading: isCumulativeLoading,
        isError: isCumulativeError,
        refetch: refetchCumulative,
    } = useGetCumulativeAmount(memberId);

    const {
        data: pujaBookingsData,
        isLoading: isPujaBookingsLoading,
        refetch: refetchPujaBookings,
    } = useGetMyPujaBookings(memberId);

    const {
        data: donationsData,
        isLoading: isDonationsLoading,
        refetch: refetchDonations,
    } = useGetMyDonations(memberId);

    const {
        data: sponsorsData,
        isLoading: isSponsorsLoading,
        refetch: refetchSponsors,
    } = useGetMySponsors(memberId);

    const membership = useMemo(
        () => mapDashboardMembership(devoteeDetails, cumulativeData, user),
        [devoteeDetails, cumulativeData, user]
    );

    const {
        data: paymentsData,
        isLoading: isPaymentsLoading,
        refetch: refetchPayments,
    } = useGetMyPayments(memberId, membership.fullName);

    const {
        data: recurringData,
        isLoading: isRecurringLoading,
        refetch: refetchRecurring,
    } = useGetRecurringDonations(memberId);

    const pujaBookingsSummary = useMemo(() => {
        const rawCount = pujaBookingsData?.count ?? 0;
        return {
            count: rawCount,
            formattedCount: formatTwoDigitCount(rawCount),
            bookings: Array.isArray(pujaBookingsData?.bookings)
                ? pujaBookingsData.bookings
                : [],
            dateRange: pujaBookingsData?.dateRange || getCurrentMonthDateRange(),
            isLoading: isPujaBookingsLoading,
        };
    }, [pujaBookingsData, isPujaBookingsLoading]);

    const donationsSummary = useMemo(() => {
        const rawCount = donationsData?.count ?? 0;
        return {
            count: rawCount,
            formattedCount: formatTwoDigitCount(rawCount),
            records: Array.isArray(donationsData?.records)
                ? donationsData.records
                : [],
            dateRange: donationsData?.dateRange || getCurrentMonthDateRange(),
            isLoading: isDonationsLoading,
        };
    }, [donationsData, isDonationsLoading]);

    const sponsorsSummary = useMemo(() => {
        const rawCount = sponsorsData?.count ?? 0;
        return {
            count: rawCount,
            formattedCount: formatTwoDigitCount(rawCount),
            records: Array.isArray(sponsorsData?.records)
                ? sponsorsData.records
                : [],
            dateRange: sponsorsData?.dateRange || getCurrentMonthDateRange(),
            isLoading: isSponsorsLoading,
        };
    }, [sponsorsData, isSponsorsLoading]);

    const paymentsSummary = useMemo(() => {
        const rawCount =
            paymentsData?.count ?? paymentsData?.records?.length ?? 0;
        return {
            count: rawCount,
            formattedCount: formatTwoDigitCount(rawCount),
            records: Array.isArray(paymentsData?.records)
                ? paymentsData.records
                : [],
            isLoading: isPaymentsLoading,
        };
    }, [paymentsData, isPaymentsLoading]);

    const recurringDonationsSummary = useMemo(() => {
        const rawCount =
            recurringData?.count ?? recurringData?.records?.length ?? 0;
        return {
            count: rawCount,
            formattedCount: formatTwoDigitCount(rawCount),
            records: Array.isArray(recurringData?.records)
                ? recurringData.records
                : [],
            isLoading: isRecurringLoading,
        };
    }, [recurringData, isRecurringLoading]);

    const refetch = async () => {
        await Promise.all([
            refetchProfile(),
            refetchCumulative(),
            refetchPujaBookings(),
            refetchDonations(),
            refetchSponsors(),
            refetchPayments(),
            refetchRecurring(),
        ]);
    };

    return {
        membership,
        pujaBookingsSummary,
        donationsSummary,
        sponsorsSummary,
        paymentsSummary,
        recurringDonationsSummary,
        isLoading: isProfileLoading || isCumulativeLoading,
        isError: isProfileError || isCumulativeError,
        refetch,
    };

};

export default useDashboard;
