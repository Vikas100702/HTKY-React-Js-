/**
 * @file src/services/recurringDonationApi.js
 * @description Service layer for Recurring Donation card validation and pledge submission.
 * Implements exact parity with the backend PHP `validateCard` and `SubmitRecurringSponsors`
 * contracts (`validateCAWPaymentCard`, `validatePaymentCard`, and `api/bookingService/addPledgeForm`).
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Critical Architectural Non-Negotiables #2, #3, #4, and #5.
 */

import { apiClient } from '../api/client';
import { ENDPOINTS } from '../constants/apiConstants';
import { ENV_CONFIG } from '../config/envConfig';
import { decodeBase64 } from '../utils/base64';
import { detectCardType, encryptVaapField } from '../utils/md5';

/**
 * Formats current local date as MM/DD/YYYY matching PHP `date("m/d/Y")`.
 *
 * @param {Date} [dateObj]
 * @returns {string}
 */
const formatCurrentDateMMDDYYYY = (dateObj = new Date()) => {
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${month}/${day}/${year}`;
};

/**
 * Formats current local time as hh:i A matching PHP `date("h:i A")`.
 *
 * @param {Date} [dateObj]
 * @returns {string}
 */
const formatCurrentTime12Hour = (dateObj = new Date()) => {
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

/**
 * Safely decodes Base64 or returns plain string if already decoded.
 *
 * @param {string} value
 * @returns {string}
 */
const resolvePlainContactValue = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    if (raw.includes('@') || /^[\d+\s()-]+$/.test(raw)) {
        return raw;
    }
    return decodeBase64(raw) || raw;
};

/**
 * Resolves the active payment gateway mode (`CHARGEANYWHERE` vs default) from client settings.
 *
 * @param {Object} [clientSettings]
 * @returns {string}
 */
export const resolveRecurringGatewayMode = (clientSettings = {}) => {
    const settingList = clientSettings?.paymentGatewaySettings;
    if (Array.isArray(settingList)) {
        const webSetting = settingList.find(
            (entry) => String(entry?.source || '').trim().toUpperCase() === 'WEBSITE'
        );
        const activeGateway = String(
            webSetting?.paymentGateway || webSetting?.gateway || webSetting?.name || ''
        )
            .trim()
            .toUpperCase();
        if (activeGateway) return activeGateway;
    }

    const directSetting = String(
        clientSettings?.paymentGatewaySetting ||
        clientSettings?.paymentGateway ||
        clientSettings?.generalSetting?.paymentGateway ||
        ''
    )
        .trim()
        .toUpperCase();

    return directSetting;
};

/**
 * Validates the credit/debit card against the configured VAAPTech payment validation endpoint
 * (`validateCAWPaymentCard` when `CHARGEANYWHERE`, otherwise `validatePaymentCard`).
 *
 * @param {Object} params
 * @param {string} params.cardNumber
 * @param {string} params.expDate - MM/YY or MM/YYYY
 * @param {string} params.cvv
 * @param {string} params.cardHolder
 * @param {Object} [params.clientSettings]
 * @param {Object} [params.devoteeProfile]
 * @param {Object} [params.user]
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<Object>}
 */
export const validateRecurringCard = async ({
    cardNumber,
    expDate,
    cvv,
    cardHolder,
    clientSettings = {},
    devoteeProfile = {},
    user = {},
    signal,
}) => {
    const sanitizedCardNumber = String(cardNumber ?? '').replace(/[\s-]/g, '');
    const trimmedExp = String(expDate ?? '').trim();
    const [month = '', year = ''] = trimmedExp.split('/');

    const gatewayMode = resolveRecurringGatewayMode(clientSettings);
    const chargeAnywhereMerchantId =
        clientSettings?.ChargeAnywhereMerchantId ||
        clientSettings?.generalSetting?.ChargeAnywhereMerchantId ||
        '';

    const isChargeAnywhere =
        gatewayMode === 'CHARGEANYWHERE' || Boolean(chargeAnywhereMerchantId);

    if (isChargeAnywhere && gatewayMode === 'CHARGEANYWHERE') {
        const cawPayload = {
            MerchantId: chargeAnywhereMerchantId,
            CardNumber: sanitizedCardNumber,
            ExpiryMonth: month.trim(),
            ExpiryYear: year.trim(),
            CardHolderName: String(cardHolder ?? '').trim(),
            amount: 1,
            clientId: ENV_CONFIG.CLIENT_ID,
        };

        return apiClient.post(ENDPOINTS.VALIDATE_CAW_PAYMENT_CARD, cawPayload, {
            signal,
        });
    }

    const plainPhone = resolvePlainContactValue(
        devoteeProfile?.phone || user?.phone || ''
    );
    const plainEmail = resolvePlainContactValue(
        devoteeProfile?.email || user?.email || ''
    );

    const standardPayload = {
        paymentAccountNumber: sanitizedCardNumber,
        expirationDate: trimmedExp,
        securityCode: String(cvv ?? '').trim(),
        name: String(cardHolder ?? '').trim(),
        street: devoteeProfile?.addressLine1 || '',
        city: devoteeProfile?.cityTypes || '',
        state: devoteeProfile?.stateTypes || '',
        zip: devoteeProfile?.zip || '12345',
        countryCode: '',
        phone: plainPhone,
        email: plainEmail,
        clientId: ENV_CONFIG.CLIENT_ID,
        amount: 1,
    };

    return apiClient.post(ENDPOINTS.VALIDATE_PAYMENT_CARD, standardPayload, {
        signal,
    });
};

/**
 * Orchestrates card validation followed by `api/bookingService/addPledgeForm`
 * submission for each selected recurring donation item.
 *
 * @param {Object} params
 * @param {Array<Object>} params.items
 * @param {Object} params.schedule
 * @param {Object} params.cardDetails
 * @param {Object} [params.clientSettings]
 * @param {Object} [params.devoteeProfile]
 * @param {Object} [params.user]
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<{ statusCode: number, message: string, responses: Array<Object>, token: string, organizationId: string }>}
 */
export const submitRecurringSponsors = async ({
    items = [],
    schedule = {},
    cardDetails = {},
    clientSettings = {},
    devoteeProfile = {},
    user = {},
    signal,
}) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('No recurring donation items found to process.');
    }

    const sanitizedCardNumber = String(cardDetails.cardNumber ?? '').replace(
        /[\s-]/g,
        ''
    );
    const expDate = String(cardDetails.expDate ?? '').trim();
    const cvv = String(cardDetails.cvv ?? '').trim();
    const cardHolder = String(cardDetails.cardHolder ?? '').trim();
    const cardType = detectCardType(sanitizedCardNumber);

    // Step 1: Validate card and retrieve gateway token + authorizationCode
    const validateResponse = await validateRecurringCard({
        cardNumber: sanitizedCardNumber,
        expDate,
        cvv,
        cardHolder,
        clientSettings,
        devoteeProfile,
        user,
        signal,
    });

    if (Number(validateResponse?.statusCode) !== 1) {
        const validationErr =
            validateResponse?.message ||
            validateResponse?.Message ||
            validateResponse?.error ||
            'Card validation failed. Please check your card details and try again.';
        throw new Error(validationErr);
    }

    const token = validateResponse?.data?.token || '';
    const organizationId = validateResponse?.data?.authorizationCode || '';

    // Step 2: Resolve devotee identity & encrypted card fields
    const memberId =
        devoteeProfile?._id || user?._id || user?.id || user?.memberId || '';
    const memberName =
        devoteeProfile?.refDataName ||
        user?.refDataName ||
        `${devoteeProfile?.firstName || user?.firstName || ''} ${devoteeProfile?.lastName || user?.lastName || ''
            }`.trim() ||
        cardHolder;

    const prsnEmail = resolvePlainContactValue(
        devoteeProfile?.email || user?.email || ''
    );
    const prsnPhone = resolvePlainContactValue(
        devoteeProfile?.phone || user?.phone || ''
    );

    const encryptedCvv = encryptVaapField(cvv);
    const encryptedExpiry = encryptVaapField(expDate);
    const encryptedCardNo = encryptVaapField(sanitizedCardNumber);

    const cartCreDate = formatCurrentDateMMDDYYYY();
    const cartCreTime = formatCurrentTime12Hour();

    const {
        debitFequency = '',
        startDailyDate = '',
        endDailyDate = '',
        startWeeklyDate = '',
        endWeeklyDate = '',
        selectWeeklyDay = '',
        startMonthlyDate = '',
        endMonthlyDate = '',
        selectmonthDate = '',
        selectAnualyMonthValue = '',
        selectAnualyDateValue = '',
        startAnualyDate = '',
        endAnualyDate = '',
    } = schedule;

    // Step 3: Submit each recurring donation item sequentially to `api/bookingService/addPledgeForm`
    const pledgeResponses = [];
    for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        const serviceId = item.id || item._id || '';
        const serviceName =
            item.title || item.name || item.refDataName || item.serviceName || '';
        const serviceAmount = Number(item.amount) || 0;

        const pledgePayload = {
            clientId: ENV_CONFIG.CLIENT_ID,
            dataJson: {
                memberId,
                firstName: '',
                lastName: '',
                memberName,
                prsnEmail,
                prsnPhone,
                noOfPaymentName: '',
                paymentReminderName: '',
                serviceName,
                serviceId,
                serviceAmount,
                pledgeForName: '',
                modeOfPaymentName: 'CREDIT CARD',
                achBankAddress: '',
                achBankCode: '',
                achRoutingNo: '',
                achBankName: '',
                accNo: '',
                accName: '',
                bankName: '',
                checkNo: '',
                checkDate: '',
                cardZipCode: '',
                cvvNo: encryptedCvv,
                expiryDate: encryptedExpiry,
                cardType,
                cardNo: encryptedCardNo,
                cardHolderName: cardHolder,
                debitFequency,
                startDailyDate,
                endDailyDate,
                startWeeklyDate,
                endWeeklyDate,
                selectWeeklyDay,
                startMonthlyDate,
                endMonthlyDate,
                selectmonthDate,
                selectAnualyMonthValue,
                selectAnualyDateValue,
                startAnualyDate,
                endAnualyDate,
                OrganizationId: organizationId,
                token,
                cartCreDate,
                cartCreTime,
                status: 'ACTIVE',
            },
        };

        const res = await apiClient.post(ENDPOINTS.ADD_PLEDGE_FORM, pledgePayload, {
            signal,
        });
        pledgeResponses.push(res);

        if (Number(res?.statusCode) !== 1) {
            const pledgeErr =
                res?.message ||
                res?.Message ||
                `Failed to register recurring pledge for ${serviceName}.`;
            throw new Error(pledgeErr);
        }
    }

    const lastResponse = pledgeResponses[pledgeResponses.length - 1] || {};
    return {
        statusCode: 1,
        message:
            lastResponse?.message ||
            lastResponse?.Message ||
            'Recurring donation pledge created successfully.',
        responses: pledgeResponses,
        token,
        organizationId,
    };
};

export default {
    resolveRecurringGatewayMode,
    validateRecurringCard,
    submitRecurringSponsors,
};