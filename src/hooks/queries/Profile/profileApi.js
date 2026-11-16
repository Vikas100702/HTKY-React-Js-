/**
 * @file src/hooks/queries/Profile/profileApi.js
 * @description Service layer for Devotee Profile fetch & update operations.
 * Mirrors the complete PHP `UpdateProfile()` payload contract for `postProfileAPI`,
 * covering all Individual, Spouse, Company, Preferences, Tax/Household/Cumulative
 * indicators, and full 18-field Family Member schemas.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Non-Negotiables #3, #4, and #5.
 */

import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';
import { getDeviceIpAddress } from '../../../utils/deviceInfo';

/**
 * Strips formatting characters from phone numbers and encodes non-empty strings to Base64.
 *
 * @param {string} value
 * @param {boolean} [isPhone=false]
 * @returns {string}
 */
const toBase64Safe = (value, isPhone = false) => {
    if (!value || typeof value !== 'string') return '';
    const cleaned = isPhone
        ? value.replace(/[\s()-]/g, '').trim()
        : value.trim();
    if (!cleaned) return '';

    try {
        return window.btoa(unescape(encodeURIComponent(cleaned)));
    } catch {
        return cleaned;
    }
};

/**
 * Normalizes a string to uppercase safely.
 *
 * @param {string} value
 * @returns {string}
 */
const toUpperSafe = (value) =>
    typeof value === 'string' ? value.trim().toUpperCase() : '';

/**
 * Normalizes a YES/NO indicator flag.
 *
 * @param {string|boolean} value
 * @returns {'YES'|'NO'}
 */
const toYesNo = (value) =>
    value === 'YES' || value === 'on' || value === true ? 'YES' : 'NO';

/**
 * Builds a complete 18-field `memberDetail` entry matching the backend schema.
 *
 * @param {Object} member
 * @returns {Object}
 */
const buildMemberPayload = (member) => ({
    memberName: (member?.memberName || '').trim(),
    dob: member?.dob || '',
    nakshatra: toUpperSafe(member?.nakshatra),
    status: member?.status || 'ACTIVE',
    relationship: (member?.relationship || '').trim(),
    anniversaryDate: member?.anniversaryDate || '',
    gotraName: toUpperSafe(member?.gotraName),
    householdInd: toYesNo(member?.householdInd),
    householdIndNoReason: member?.householdIndNoReason || '',
    householdIndOtherReason: member?.householdIndOtherReason || '',
    member_email: toBase64Safe(member?.member_email || member?.memberEmail),
    member_phone: toBase64Safe(member?.member_phone || member?.memberPhone, true),
    isCumulativeInd: toYesNo(member?.isCumulativeInd),
    isCumulativeIndReason: member?.isCumulativeIndReason || '',
    isCumulativeIndOtherReason: member?.isCumulativeIndOtherReason || '',
    isTaxInd: toYesNo(member?.isTaxInd),
    isTaxIndNoReason: member?.isTaxIndNoReason || '',
    isTaxIndOtherReason: member?.isTaxIndOtherReason || '',
});

/**
 * Builds the `companyDetail` array and `addCompany` flag matching PHP `UpdateProfile()`.
 *
 * @param {Object} profileData
 * @param {Object} existingProfile
 * @returns {{ addCompany: 'YES'|'NO', companyDetail: Array<Object> }}
 */
const buildCompanyDetailPayload = (profileData, existingProfile = {}) => {
    // If explicit companyDetail array is passed with valid rows, normalize each row
    if (Array.isArray(profileData?.companyDetail) && profileData.companyDetail.length > 0) {
        const validRows = profileData.companyDetail
            .filter((c) => c?.companyFirstName || c?.companyName)
            .map((c) => ({
                companyFirstName: (c.companyFirstName || c.companyName || '').trim(),
                companyLastName: (c.companyLastName || '').trim(),
                companyEmail: toBase64Safe(c.companyEmail),
                companyCountryCode: c.companyCountryCode || '+1',
                companyPhone: toBase64Safe(c.companyPhone, true),
                companyId: c.companyId || '',
                status: c.status || 'ACTIVE',
                isCumulativeInd: toYesNo(c.isCumulativeInd),
                isCumulativeIndReason: c.isCumulativeIndReason || '',
                isCumulativeIndOtherReason: c.isCumulativeIndOtherReason || '',
                isTaxInd: toYesNo(c.isTaxInd),
                isTaxIndNoReason: c.isTaxIndNoReason || '',
                isTaxIndOtherReason: c.isTaxIndOtherReason || '',
                companyWebsite: (c.companyWebsite || '').trim(),
                householdInd: toYesNo(c.householdInd),
                householdIndNoReason: c.householdIndNoReason || '',
                householdIndOtherReason: c.householdIndOtherReason || '',
            }));

        if (validRows.length > 0) {
            return { addCompany: 'YES', companyDetail: validRows };
        }
    }

    // Fallback: synthesize companyDetail entry from top-level company fields if populated
    const hasCompany = Boolean(
        profileData?.companyName?.trim() &&
        profileData?.companyEmail?.trim() &&
        profileData?.companyPhone?.trim()
    );

    if (!hasCompany) {
        const existingList = Array.isArray(existingProfile?.companyDetail)
            ? existingProfile.companyDetail
            : [];
        return {
            addCompany: existingList.length > 0 ? 'YES' : 'NO',
            companyDetail: existingList,
        };
    }

    const prevCompany = Array.isArray(existingProfile?.companyDetail)
        ? existingProfile.companyDetail[0] || {}
        : {};

    return {
        addCompany: 'YES',
        companyDetail: [
            {
                companyFirstName: profileData.companyName.trim(),
                companyLastName: prevCompany.companyLastName || '',
                companyEmail: toBase64Safe(profileData.companyEmail),
                companyCountryCode: prevCompany.companyCountryCode || '+1',
                companyPhone: toBase64Safe(profileData.companyPhone, true),
                companyId: prevCompany.companyId || '',
                status: profileData.companyStatus || 'ACTIVE',
                isCumulativeInd: toYesNo(profileData.companyCumulativeInd),
                isCumulativeIndReason: prevCompany.isCumulativeIndReason || '',
                isCumulativeIndOtherReason: prevCompany.isCumulativeIndOtherReason || '',
                isTaxInd: toYesNo(prevCompany.isTaxInd),
                isTaxIndNoReason: prevCompany.isTaxIndNoReason || '',
                isTaxIndOtherReason: prevCompany.isTaxIndOtherReason || '',
                companyWebsite: (profileData.website || '').trim(),
                householdInd: toYesNo(prevCompany.householdInd),
                householdIndNoReason: prevCompany.householdIndNoReason || '',
                householdIndOtherReason: prevCompany.householdIndOtherReason || '',
            },
        ],
    };
};

/**
 * Fetches full devotee profile details from the backend.
 *
 * @param {string} memberId
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @param {string} [options.ipAddress]
 * @returns {Promise<Object|null>}
 */
export const fetchDevoteeProfile = async (memberId, { signal, ipAddress } = {}) => {
    if (!memberId) {
        return null;
    }

    const resolvedIp = ipAddress || (await getDeviceIpAddress());

    const payload = {
        dataJson: {
            memberId: String(memberId).trim(),
            ipAddress: resolvedIp,
        },
        ...buildComponentConfigPayload({
            moduleName: 'Contacts',
            aspectType: 'getDevoteeDetails',
        }),
    };

    const response = await apiClient.post(
        ENDPOINTS.GET_DEVOTEE_DETAILS_WEB,
        payload,
        { signal, pre: false }
    );

    const rawList = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
            ? response.data
            : [];

    return rawList[0] || null;
};

/**
 * Updates devotee profile details using the complete `postProfileAPI` contract.
 * Preserves existing server fields and encodes sensitive contact fields in Base64.
 *
 * @param {Object} params
 * @param {string} params.devoteeId
 * @param {Object} params.profileData - Updated form state from UI
 * @param {Object} [params.existingProfile] - Original fetched profile object to preserve untouched fields
 * @param {string} [params.userName]
 * @param {string} [params.userToken]
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<Object>}
 */
export const updateDevoteeProfile = async ({
    devoteeId,
    profileData,
    existingProfile = {},
    userName = '',
    userToken = '',
    signal,
}) => {
    if (!devoteeId) {
        throw new Error('Devotee ID (_id) is required for profile updates.');
    }

    const base = existingProfile || {};
    const firstName = (profileData.firstName ?? base.firstName ?? '').trim();
    const lastName = (profileData.lastName ?? base.lastName ?? '').trim();
    const fullName = `${firstName} ${lastName}`.trim();

    const sanitizedMembers = Array.isArray(profileData.memberDetail)
        ? profileData.memberDetail
            .filter((m) => m?.memberName && m.memberName.trim().length > 0)
            .map(buildMemberPayload)
        : [];

    const { addCompany, companyDetail } = buildCompanyDetailPayload(
        profileData,
        base
    );

    const zipValue = profileData.zipCode ?? base.zipCode ?? base.zip ?? '';

    const payload = {
        _id: devoteeId,
        dataJson: {
            refDataName: fullName,
            firstName,
            lastName,
            email: toBase64Safe(profileData.email) || base.email || '',
            phone: toBase64Safe(profileData.phone, true) || base.phone || '',
            zip: zipValue,
            zipCode: zipValue,
            cityTypes: toUpperSafe(profileData.cityTypes ?? base.cityTypes),
            stateTypes: toUpperSafe(profileData.stateTypes ?? base.stateTypes),
            addressLine1: profileData.addressLine1 ?? base.addressLine1 ?? '',
            addressLine2: profileData.addressLine2 ?? base.addressLine2 ?? '',
            county: profileData.county ?? base.county ?? '',
            rashi: toUpperSafe(profileData.rashi ?? base.rashi),
            gotraName: toUpperSafe(profileData.gotraName ?? base.gotraName),
            Nakshtra: toUpperSafe(profileData.Nakshtra ?? base.Nakshtra),
            dob: profileData.dob ?? base.dob ?? '',

            // Spouse & Household/Cumulative/Tax Indicators
            spouseName: profileData.spouseName ?? base.spouseName ?? '',
            spouseDob: profileData.spouseDob ?? base.spouseDob ?? '',
            spousePhone: toBase64Safe(profileData.spousePhone, true),
            spouseEmail: toBase64Safe(profileData.spouseEmail),
            spouseGotra: toUpperSafe(profileData.spouseGotra ?? base.spouseGotra),
            spouseNakshtra: toUpperSafe(
                profileData.spouseNakshtra ?? base.spouseNakshtra
            ),
            spouseRashi: toUpperSafe(profileData.spouseRashi ?? base.spouseRashi),
            householdInd: toYesNo(profileData.householdInd ?? base.householdInd),
            householdIndNoReason:
                profileData.householdIndNoReason ?? base.householdIndNoReason ?? '',
            householdIndOtherReason:
                profileData.householdIndOtherReason ?? base.householdIndOtherReason ?? '',
            isCumulativeInd: toYesNo(
                profileData.isCumulativeInd ?? base.isCumulativeInd
            ),
            isCumulativeIndReason:
                profileData.isCumulativeIndReason ?? base.isCumulativeIndReason ?? '',
            isCumulativeIndOtherReason:
                profileData.isCumulativeIndOtherReason ??
                base.isCumulativeIndOtherReason ??
                '',
            isTaxInd: toYesNo(profileData.isTaxInd ?? base.isTaxInd),
            isTaxIndNoReason:
                profileData.isTaxIndNoReason ?? base.isTaxIndNoReason ?? '',
            isTaxIndOtherReason:
                profileData.isTaxIndOtherReason ?? base.isTaxIndOtherReason ?? '',
            noSpouse: (profileData.spouseName ?? base.spouseName ?? '').trim()
                ? ''
                : 'noSpouse',

            // Preferences & Priest Request
            languagePreferenceName:
                profileData.languagePreferenceName ?? base.languagePreferenceName ?? null,
            requestForPriestName:
                profileData.requestForPriestName ?? base.requestForPriestName ?? null,
            priestEmail: toBase64Safe(profileData.priestEmail ?? base.priestEmail),
            priestPhone: toBase64Safe(
                profileData.priestPhone ?? base.priestPhone,
                true
            ),
            requestedPriestId:
                profileData.requestedPriestId ?? base.requestedPriestId ?? '',
            emailPref: profileData.emailPref ?? base.emailPref ?? 'NO',
            smsPref: profileData.smsPref ?? base.smsPref ?? '',
            phoneCallPref: profileData.phoneCallPref ?? base.phoneCallPref ?? '',

            // Company Details (both top-level & companyDetail[] array)
            companyName: profileData.companyName ?? base.companyName ?? '',
            companyEmail: toBase64Safe(profileData.companyEmail),
            companyPhone: toBase64Safe(profileData.companyPhone, true),
            website: profileData.website ?? base.website ?? '',
            companyStatus: profileData.companyStatus ?? base.companyStatus ?? 'ACTIVE',
            companyCumulativeInd: toYesNo(
                profileData.companyCumulativeInd ?? base.companyCumulativeInd
            ),
            addCompany,
            companyDetail,

            // Family Members
            memberDetail: sanitizedMembers,
            noFamily: sanitizedMembers.length > 0 ? '' : 'noFamily',

            // Registration Type (INDIVIDUAL | COMPANY)
            registrationType:
                profileData.registrationType ?? base.registrationType ?? 'INDIVIDUAL',
        },
        ...buildComponentConfigPayload({
            moduleName: 'Contacts',
            userName: userName || fullName || 'WEBSITE_USER',
        }),
    };

    const response = await apiClient.post(
        ENDPOINTS.POST_PROFILE_API,
        payload,
        {
            signal,
            token: userToken,
            pre: true,
        }
    );

    return response?.data || response;
};

export default {
    fetchDevoteeProfile,
    updateDevoteeProfile,
};