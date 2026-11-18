/**
 * @file src/constants/apiConstants.js
 * @description Centralized API Constants routing.
 * consume the fail-safe ENV_CONFIG for base URLs, eliminating hardcoded secrets.
 * Uses Object.freeze() for endpoint paths to prevent accidental runtime mutations.
 */

import { ENV_CONFIG, MPI_PAYMENT_CONFIG, NMI_PAYMENT_CONFIG } from '../config/envConfig';

// Base URL for API calls
export const BASE_URL = ENV_CONFIG.BASE_URL;
export const PRE_BASE_URL = ENV_CONFIG.PRE_BASE_URL;

/**
 * NMI Hosted Direct API & Script Configurations
 */
export const NMI_GATEWAY_CONFIG = Object.freeze({
    LIVE_API: NMI_PAYMENT_CONFIG.LIVE_API,
    TEST_API: NMI_PAYMENT_CONFIG.TEST_API,
    LIVE_SCRIPT: NMI_PAYMENT_CONFIG.LIVE_SCRIPT,
    TEST_SCRIPT: NMI_PAYMENT_CONFIG.TEST_SCRIPT,
});

/**
 * MPI (BridgePay) Hosted Gateway Scripts & Integration URLs
 */
export const MPI_GATEWAY_CONFIG = Object.freeze({
    LIVE_SCRIPT: MPI_PAYMENT_CONFIG.LIVE_SCRIPT,
    TEST_SCRIPT: MPI_PAYMENT_CONFIG.TEST_SCRIPT,
    DEFAULT_TEST_TOKEN: MPI_PAYMENT_CONFIG.DEFAULT_TEST_TOKEN,
});

export const ENDPOINTS = Object.freeze({
    FILTER_API: 'api/appgen/filterAPI',
    EVENT_PARTICIPATE_LIST_API: 'api/puja/getParticipateEventList',
    GET_CALENDAR_API: 'api/home/getCalendar',
    SUBMIT_FORM_DATA_API: 'api/emailSend/sendContactEmail',
    VOLUNTEER_UPLOAD_PHOTO_API: 'api/upload/docsmany',
    VOLUNTEER_SIGNUP_API: 'api/volunteer/addVolunteer',
    GET_THITHI_NEXT_90_DAYS: '/api/event/getThithiNext90Days',
    CLIENT_SETTINGS: '/api/appsettings/setting',
    GET_SERVICE_AVAILABILITY: '/api/bookingService/getServiceAvailability',
    SERVICE_AVAILABILITY: 'api/service-availability',
    GET_COMPANY_DETAILS: 'api/auth/getCompanyDetails',
    CHECK_USER_EXIST: '/api/customerDetails/checkDevoteExistWeb',
    CUSTOMER_LOGIN: '/api/customerDetails/customerLoginWeb',
    SEND_EMAIL_CODE: '/api/auth/sendMemberAuthCode',
    VERIFY_EMAIL_CODE: '/api/auth/verifyMemberCode',
    ADD_CUSTOMER_DETAIL: '/api/customerDetails/addCustomerDetailWeb',
    GET_DEVOTEE_DETAILS_WEB: '/api/customerDetails/getDevoteeDetailsWeb',
    POST_UPDATE_PROFILE: 'api/contacts/postUpdateProfileAPI',
    POST_PROFILE_API: 'api/appgen/postProfileAPI',
    CHECKOUT_SANKALPAM_FORM: '/api/appgen/postAPI',
    UPDATE_PROFILE_GLOBAL: 'UpdateProfileGlobal/UpdateProfile',
    CHECK_SAREE_AVAILABILITY: 'Events/checkSareeAvailbility',
    GET_EVENT_CART_DETAIL: 'api/bookingService/getEventCartDetail',
    ADD_SERVICE_CART_TEMP: 'api/bookingService/addServiceCartTemp',
    ADD_TO_CART: 'api/bookingService/addServiceCart',
    REMOVE_EXPIRED_SERVICES: 'common/removeExpiredServices',
    MPI_PAY_NOW: 'MPI_Payments/Paynow',
    MPI_PAY_NOW_TEST: 'MPI_Payments/PaynowTest',
    MPI_CARD_PAYMENT_LIVE: 'api/vaaptech/mpiCardPayment',
    MPI_CARD_PAYMENT_TEST: 'api/vaaptech/mpiCardPaymentTest',
    MPI_PAYMENT_BY_TOKEN_MOBILE: 'api/payment/mpiPaymentByTokenMobile',
    NMI_MAKE_PAYMENT: 'NMI_Payment/makePayment',
    UPDATE_TRANSACTION_STATUS: 'api/bookingService/updateTransactionStatus',
    ADD_MEMBERSHIP: 'api/home/addMemberShip',
    GET_CUMULATIVE_AMOUNT: 'api/users/getCumulativeAmount'
});
