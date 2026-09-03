/**
 * @file src/constants/apiConstants.js
 * @description Centralized API Constants routing.
 * consume the fail-safe ENV_CONFIG for base URLs, eliminating hardcoded secrets.
 * Uses Object.freeze() for endpoint paths to prevent accidental runtime mutations.
 */

import { ENV_CONFIG } from './envConfig';

// Base URL for API calls
export const BASE_URL = ENV_CONFIG.BASE_URL;
export const PRE_BASE_URL = ENV_CONFIG.PRE_BASE_URL;

export const ENDPOINTS = Object.freeze({
    FILTER_API: 'api/appgen/filterAPI',
    EVENT_PARTICIPATE_LIST_API: 'api/puja/getParticipateEventList',
    GET_CALENDAR_API: 'api/home/getCalendar',
    SUBMIT_FORM_DATA_API: 'api/emailSend/sendContactEmail',
    VOLUNTEER_UPLOAD_PHOTO_API: 'api/upload/docsmany',
    VOLUNTEER_SIGNUP_API: 'api/volunteer/addVolunteer',
})
