/**
 * @file src/hooks/queries/Dashboard/useDashboard.js
 * @description Centralized TanStack Query controller hook for the Devotee Dashboard.
 * Reuses the cached `useGetDevoteeDetails` server query and decouples membership
 * normalization and business logic away from presentational JSX components.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Non-Negotiables #2, #3, #4, and #5.
 */

import { useMemo } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import { useGetDevoteeDetails } from "../Profile/useDevoteeProfile";

/**
 * Normalizes raw MongoDB devotee details into a clean, crash-safe dashboard view model.
 *
 * @param {Object|null} profile - Fetched devotee record from `getDevoteeDetailsWeb`
 * @param {Object|null} fallbackUser - Authenticated user object from Zustand store
 * @returns {Object} Normalized membership and greeting view model
 */
const mapDashboardMembership = (profile, fallbackUser) => {
    const source = profile || fallbackUser || {};
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

    const parsedAmount = Number(
        source.totalAccumulatedAmount ?? source.accumulatedAmount ?? 0
    );
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
        isLoading,
        isError,
        refetch,
    } = useGetDevoteeDetails(memberId);

    const membership = useMemo(
        () => mapDashboardMembership(devoteeDetails, user),
        [devoteeDetails, user]
    );

    return {
        membership,
        isLoading,
        isError,
        refetch,
    };
};

export default useDashboard;