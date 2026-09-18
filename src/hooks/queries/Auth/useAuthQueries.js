import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { ENV_CONFIG } from '../../../constants/envConfig';

const AUTH_CONFIG = {
    moduleName: "Contacts",
    productID: ENV_CONFIG.PRODUCT_ID,
    clientID: ENV_CONFIG.CLIENT_ID,
};

const sanitizePhoneDigits = (rawPhone) => {
    if (!rawPhone) return "";
    return String(rawPhone).replace(/[^0-9]/g, '');
};

export const buildAuthPayload = ({ email = "", phone = "" } = {}) => {
    const cleanPhone = sanitizePhoneDigits(phone);
    const cleanEmail = typeof email === 'string' ? email.trim() : "";
    const isMobile = Boolean(cleanPhone && !cleanEmail);

    return {
        dataJson: {
            email: isMobile ? "" : cleanEmail,
            isMobile: isMobile,
            phone: isMobile ? cleanPhone : "",
            ipAddress: "::1",
        },
        componentConfig: {
            moduleName: AUTH_CONFIG.moduleName,
            productID: AUTH_CONFIG.productID,
            clientID: AUTH_CONFIG.clientID,
        }
    };
};

const checkDevoteeExist = async ({ credentials, signal }) => {
    try {
        const payload = buildAuthPayload(credentials);
        const response = await apiClient.post(
            ENDPOINTS.CHECK_USER_EXIST,
            payload,
            { signal, pre: true }
        );
        return response;
    } catch (error) {
        // Suppress benign cancellations from unmounted components
        if (error?.name === 'CanceledError' || error?.name === 'AbortError') {
            throw error;
        }

        console.error(`[HTKY_APM][AUTH_CHECK_EXIST_FAILED] ${new Date().toISOString()}`, {
            error: error?.message || error,
            status: error?.response?.status,
            endpoint: ENDPOINTS.CHECK_USER_EXIST,
        });
        throw error;
    }
};

export const useCheckDevoteeExist = () => {
    return useMutation({
        mutationKey: ['auth', 'checkDevoteeExist'],
        mutationFn: checkDevoteeExist,
    });
};

const customerLogin = async ({ credentials, signal }) => {
    try {
        const payload = buildAuthPayload(credentials);
        const response = await apiClient.post(
            ENDPOINTS.CUSTOMER_LOGIN,
            payload,
            { signal, pre: true }
        );
        return response;
    } catch (error) {
        // Suppress benign cancellations from unmounted components
        if (error?.name === 'CanceledError' || error?.name === 'AbortError') {
            throw error;
        }

        console.error(`[HTKY_APM][AUTH_LOGIN_FAILED] ${new Date().toISOString()}`, {
            error: error?.message || error,
            status: error?.response?.status,
            endpoint: ENDPOINTS.CUSTOMER_LOGIN,
        });
        throw error;
    }
};

export const useCustomerLogin = () => {
    return useMutation({
        mutationKey: ['auth', 'customerLogin'],
        mutationFn: customerLogin,
    });
};