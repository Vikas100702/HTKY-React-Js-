/**
 * Validates whether a devotee currently holds an active membership,
 * mirroring the legacy PHP `membershipStatusCheck()` contract.
 *
 * @param {Object|null} devoteeProfile - Fetched devotee record from database
 * @param {Object|null} authUser - Authenticated user object from Zustand store
 * @param {number} [cumulativeAmount=0] - Lifetime accumulated transaction amount
 * @returns {{ isActive: boolean, status: string, membershipName: string, expiryDate: string }}
 */
export const evaluateMembershipStatus = (devoteeProfile, authUser, cumulativeAmount = 0) => {
    const source = devoteeProfile || authUser || {};
    const legacy = source.oldMembershipDetail || {};

    let rawStatus = String(source.membershipStatus || legacy.membershipStatus || "").trim().toUpperCase();
    const paymentStatus = String(source.membershipPaymentStatus || legacy.membershipPaymentStatus || "").trim().toUpperCase();
    const expiryDateStr = source.memberShipExpiryDate || legacy.memberShipExpiryDate || "";
    const membershipName = source.membershipName || legacy.membershipName || "";
    const membershipId = source.membershipId || legacy.membershipId || "";
    const membershipType = source.membershipType || legacy.membershipType || "";
    const membershipStartDate = source.membershipStartDate || legacy.membershipStartDate || "";

    // 1. Expiry & Payment Status Validation (MM/DD/YYYY parsing)
    if (expiryDateStr && rawStatus !== "ACTIVE") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const targetDate = new Date(expiryDateStr);
        if (!isNaN(targetDate.getTime())) {
            targetDate.setHours(0, 0, 0, 0);

            if (today.getTime() < targetDate.getTime() && paymentStatus === "COMPLETED" && rawStatus === "ACTIVE") {
                rawStatus = "ACTIVE";
            } else if (today.getTime() > targetDate.getTime() && paymentStatus === "COMPLETED" && rawStatus === "ACTIVE") {
                rawStatus = "EXPIRED";
            } else {
                rawStatus = "INACTIVE";
            }
        }
    } else {
        if (paymentStatus === "COMPLETED" && rawStatus === "ACTIVE") {
            rawStatus = "ACTIVE";
        } else if (rawStatus && paymentStatus) {
            rawStatus = "INACTIVE";
        } else {
            rawStatus = "";
        }
    }

    // 2. Cumulative Spending Override ($25,000 threshold for Lifetime status)
    let isActive = rawStatus === "ACTIVE";
    if (!isActive && Number(cumulativeAmount) >= 25000) {
        isActive = true;
        rawStatus = "ACTIVE";
    }

    return {
        isActive,
        status: rawStatus || "INACTIVE",
        membershipName,
        membershipId,
        membershipType,
        membershipStartDate,
        expiryDate: expiryDateStr || "—",
    };
};

/**
 * Calculates per-item and total cart discounts based on active membership eligibility
 * and item-level rules (`membershipDiscount: "YES"` vs CLIENT_SETTINGS fallback).
 *
 * @param {Object} params
 * @param {Array<Object>} params.items - Cart items array from Zustand store
 * @param {boolean} params.isMemberActive - Whether devotee has an active membership
 * @param {Object} [params.membershipSettings] - Settings from CLIENT_SETTINGS (`membershipDiscount`, `discountType`)
 * @returns {Object} Calculated totals and item-level discount breakdown
 */
export const calculateCartDiscounts = ({ items = [], isMemberActive = false, membershipSettings = {} }) => {
    if (!Array.isArray(items) || items.length === 0) {
        return {
            processedItems: [],
            subtotalAmount: 0.0,
            totalMembershipDiscount: 0.0,
            grandTotalAmount: 0.0,
        };
    }

    const globalDiscountVal = Number(membershipSettings?.membershipDiscount || 0);
    const globalDiscountType = String(membershipSettings?.discountType || "PERCENT").trim().toUpperCase();

    let subtotalAmount = 0.0;
    let totalMembershipDiscount = 0.0;

    const processedItems = items.map((item) => {
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        const originalUnitPrice = Number(item.amount || item.unitPrice || item.serviceAmount || 0);
        const lineOriginalTotal = originalUnitPrice * qty;

        subtotalAmount += lineOriginalTotal;

        let unitDiscount = 0.0;
        let discountSource = "NONE";

        const rawDiscFlag = String(item?.membershipDiscount || item?.rawItem?.membershipDiscount || "").trim().toUpperCase();
        const isEligible = isMemberActive && rawDiscFlag === "YES";

        if (isEligible) {
            const rawItemAmount = item?.membershipAmount ?? item?.rawItem?.membershipAmount;
            const hasItemFlatAmount = rawItemAmount !== undefined && rawItemAmount !== null && String(rawItemAmount).trim() !== "";

            if (hasItemFlatAmount) {
                // Case A: Service-specific flat override amount (e.g. membershipAmount: "40")
                unitDiscount = Math.max(0, Number(rawItemAmount) || 0);
                discountSource = "SERVICE_FLAT";
            } else if (globalDiscountVal > 0) {
                // Case B: Global CLIENT_SETTINGS fallback (PERCENT or FLAT)
                if (globalDiscountType === "FLAT") {
                    unitDiscount = Math.max(0, globalDiscountVal);
                    discountSource = "SETTINGS_FLAT";
                } else {
                    // PERCENT type
                    unitDiscount = Math.max(0, (originalUnitPrice * globalDiscountVal) / 100);
                    discountSource = "SETTINGS_PERCENT";
                }
            }
        }

        // Ensure discount cannot exceed original unit price
        unitDiscount = Math.min(originalUnitPrice, unitDiscount);
        const finalUnitPrice = Math.max(0, originalUnitPrice - unitDiscount);
        const lineDiscountTotal = unitDiscount * qty;
        const lineFinalTotal = finalUnitPrice * qty;

        totalMembershipDiscount += lineDiscountTotal;

        return {
            ...item,
            originalUnitPrice,
            unitPrice: finalUnitPrice,
            discountedAmount: unitDiscount,
            oldServiceAmount: originalUnitPrice,
            lineOriginalTotal,
            lineDiscountTotal,
            lineFinalTotal,
            isDiscountApplied: unitDiscount > 0,
            discountSource,
        };
    });

    const grandTotalAmount = Math.max(0, subtotalAmount - totalMembershipDiscount);

    return {
        processedItems,
        subtotalAmount,
        totalMembershipDiscount,
        grandTotalAmount,
    };
};
