/**
 * @file src/hooks/queries/Dashboard/useDashboard.js
 * @description Centralized TanStack Query controller hook for the Devotee Dashboard.
 * Combines cached `useGetDevoteeDetails` and `useGetCumulativeAmount` server queries,
 * decoupling membership normalization and amount formatting from presentational JSX.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Non-Negotiables #2, #3, #4, and #5.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../store/useAuthStore";
import { useGetDevoteeDetails } from "../Profile/useDevoteeProfile";
import { fetchCumulativeAmount } from "../../../services/dashboardApi";

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
        staleTime: 1000 * 60 * 5, // 5 minutes cache freshness
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

    const membershipName =
        source.membershipName || legacy.membershipName || "";
    const membershipType =
        source.membershipType || legacy.membershipType || "";
    const membershipStatus = String(
        source.membershipStatus || legacy.membershipStatus || ""
    ).toUpperCase();
    const membershipStartDate =
        source.membershipStartDate || legacy.membershipStartDate || "—";
    const memberShipExpiryDate =
        source.memberShipExpiryDate || legacy.memberShipExpiryDate || "—";

    const rawTotal =
        cumulativeResult?.totalAmount ??
        source.totalAccumulatedAmount ??
        source.accumulatedAmount ??
        0;
    const parsedAmount = Number(rawTotal);
    const accumulatedAmount = Number.isFinite(parsedAmount)
        ? parsedAmount.toFixed(2)
        : "0.00";

    return {
        fullName,
        membershipName,
        membershipType,
        membershipStatus,
        isActive: membershipStatus === "ACTIVE",
        membershipStartDate,
        memberShipExpiryDate,
        accumulatedAmount,
        isMember: Boolean(source.isMember ?? legacy.isMember),
    };
};

/**
 * Composite controller hook for Devotee Dashboard data.
 *
 * @returns {{
 *   membership: Object,
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

    const membership = useMemo(
        () => mapDashboardMembership(devoteeDetails, cumulativeData, user),
        [devoteeDetails, cumulativeData, user]
    );

    const refetch = async () => {
        await Promise.all([refetchProfile(), refetchCumulative()]);
    };

    return {
        membership,
        isLoading: isProfileLoading || isCumulativeLoading,
        isError: isProfileError || isCumulativeError,
        refetch,
    };
};

export default useDashboard;