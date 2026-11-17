/**
 * @file src/hooks/queries/Membership/useMembershipSettings.js
 * @description Centralized TanStack Query hooks for:
 * 1. `useMembershipSettings`: Fetches & normalizes temple membership plans from `CLIENT_SETTINGS`.
 * 2. `useEnrollMembership`: Orchestrates sequential MPI card charge (`mpiCardPayment` / `mpiCardPaymentTest`)
 *    followed by membership registration (`api/home/addMemberShip`) upon `responseCode === "00000"`,
 *    and invalidates cached `devoteeDetails` so Dashboard reflects active status immediately.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Non-Negotiables #2, #3, #4, and #5.
 */

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { ENDPOINTS } from "../../../constants/apiConstants";
import { ENV_CONFIG } from "../../../config/envConfig";
import {
    chargeMpiMembershipCard,
    registerMembershipPlan,
} from "../../../services/membershipApi";

/**
 * Formats a membership title into Title Case (e.g., "LIFETIME MEMBERSHIP" -> "Lifetime Membership").
 *
 * @param {string} rawTitle
 * @returns {string}
 */
const toTitleCase = (rawTitle) =>
    String(rawTitle || "")
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

/**
 * Parses and sorts the `Child Grid` array into clean benefit strings.
 *
 * @param {Array<Object>} childGrid
 * @returns {Array<string>}
 */
const normalizeBenefits = (childGrid) => {
    if (!Array.isArray(childGrid)) return [];

    return [...childGrid]
        .sort((a, b) => Number(a?.sequenceId || 0) - Number(b?.sequenceId || 0))
        .map((entry) => String(entry?.benefit || "").trim())
        .filter(Boolean);
};

/**
 * Normalizes raw `CLIENT_SETTINGS` payload into structured membership plans.
 *
 * @param {Object} rawResponse
 * @returns {Object}
 */
const normalizeMembershipSettings = (rawResponse) => {
    const rootData =
        rawResponse?.result?.data?.[0] ||
        rawResponse?.data?.result?.data?.[0] ||
        rawResponse?.data?.data?.[0] ||
        rawResponse?.data?.[0] ||
        rawResponse?.data ||
        rawResponse ||
        {};

    const membershipSettings = rootData?.membershipSettings || {};
    const generalSetting = rootData?.generalSetting || {};
    const currencySymbol = generalSetting?.currencySymbol || "$";

    const rawTypes = Array.isArray(membershipSettings?.membershipTypes)
        ? membershipSettings.membershipTypes
        : [];

    const plans = rawTypes.map((plan, index) => {
        const rawPrice = Number(plan?.membershipPrice ?? 0);
        const formattedPrice = Number.isFinite(rawPrice)
            ? rawPrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })
            : "0.00";

        const typeCode = String(plan?.membershipType || "").trim().toUpperCase();
        const isLifetime = typeCode === "LIFETIME";
        const rawChildGrid = Array.isArray(plan?.["Child Grid"])
            ? plan["Child Grid"]
            : [];

        return {
            id: plan?._id || `membership-plan-${index}`,
            rawName: String(plan?.membershipName || "").trim(),
            displayName: toTitleCase(plan?.membershipName || "Membership"),
            membershipType: typeCode,
            isLifetime,
            inDays: plan?.inDays || "",
            price: rawPrice,
            formattedPrice: `${currencySymbol} ${formattedPrice}`,
            description: String(
                plan?.membershipDesc || `As a ${typeCode || "MEMBER"}, you'll enjoy:`
            ).trim(),
            isCumulativeApplied: Boolean(plan?.isCumulativeApplied),
            cumulativeNote: isLifetime
                ? `Cumulative discount of ${currencySymbol}${rawPrice.toLocaleString("en-US")} spending with Temple`
                : "",
            rawChildGrid,
            benefits: normalizeBenefits(rawChildGrid),
        };
    });

    return {
        plans,
        currencySymbol,
        membershipDiscount: membershipSettings?.membershipDiscount || "0",
        discountType: membershipSettings?.discountType || "PERCENT",
        facilityMembershipDiscount:
            membershipSettings?.facilityMembershipDiscount || "0",
    };
};

/**
 * Query hook to fetch and normalize temple membership plans from `CLIENT_SETTINGS`.
 *
 * @returns {Object}
 */
export const useMembershipSettings = () => {
    const payload = {
        action: "getClientSetting",
        productId: ENV_CONFIG.PRODUCT_ID,
        clientId: ENV_CONFIG.CLIENT_ID,
    };

    const query = useQuery({
        queryKey: ["clientSettings", "paymentGateway"],
        queryFn: async ({ signal }) => {
            const response = await apiClient.post(ENDPOINTS.CLIENT_SETTINGS, payload, {
                signal,
            });
            return response;
        },
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        retry: 2,
    });

    const normalized = useMemo(
        () => normalizeMembershipSettings(query.data),
        [query.data]
    );

    return {
        ...normalized,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
};

/**
 * Mutation hook to execute the two-step Membership Enrollment flow:
 * 1. Charge card via MPI (`mpiCardPaymentTest` or `mpiCardPayment`).
 * 2. Verify `responseCode === "00000"`, then call `api/home/addMemberShip`.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export const useEnrollMembership = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            token,
            membershipPlan,
            devoteeInfo,
            billingAddress = "",
            zipcode,
            isTestMode = true,
        }) => {
            const invoiceNum = Date.now();

            // Step 1: Charge tokenized card via MPI backend endpoint
            const paymentResponse = await chargeMpiMembershipCard({
                token,
                amount: membershipPlan?.price || 0,
                name: devoteeInfo?.name || "",
                address: billingAddress,
                zipcode,
                invoiceNum,
                isTestMode,
            });

            const gatewayData = paymentResponse?.data?.responseCode ? paymentResponse.data : paymentResponse || {};
            const responseCode = String(gatewayData?.responseCode || "").trim();

            if (responseCode !== "00000") {
                const declineReason =
                    paymentResponse?.message ||
                    gatewayData?.responseMessage ||
                    "Card payment was declined by the gateway.";
                throw new Error(declineReason);
            }

            // Build standard reconciled transaction reference string matching legacy PHP contract
            const referenceNumber =
                gatewayData?.ReferenceNumber ||
                gatewayData?.TransactionID ||
                String(invoiceNum);
            const cardType = gatewayData?.cardType || "CARD";
            const maskedCard = gatewayData?.maskedAccountNumber || "";
            const reconciledTransactionId = [
                "Payment completed",
                referenceNumber,
                cardType,
                maskedCard,
            ]
                .filter(Boolean)
                .join("~");

            // Step 2: Register active membership in MongoDB via `api/home/addMemberShip`
            const registrationResponse = await registerMembershipPlan({
                membershipPlan,
                devoteeInfo,
                transactionId: reconciledTransactionId,
                paymentStatus: "COMPLETED",
                status: "ACTIVE",
                paymentSource: "MPI_CARD_NOT_PRESENT",
            });

            const regStatusCode = String(registrationResponse?.statusCode || "");
            if (regStatusCode !== "1") {
                throw new Error(
                    registrationResponse?.message ||
                    "Payment succeeded, but membership registration failed. Please contact temple support with Reference #" +
                    referenceNumber
                );
            }

            return {
                invoiceNo: String(invoiceNum),
                transactionId: reconciledTransactionId,
                referenceNumber,
                paymentResponse,
                registrationResponse,
            };
        },
        onSuccess: (_, variables) => {
            const memberId = variables?.devoteeInfo?.memberId;
            if (memberId) {
                queryClient.invalidateQueries({
                    queryKey: ["devoteeDetails", memberId],
                });
            } else {
                queryClient.invalidateQueries({ queryKey: ["devoteeDetails"] });
            }
        },
    });
};

export default useMembershipSettings;