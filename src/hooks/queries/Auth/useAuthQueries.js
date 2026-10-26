import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { ENV_CONFIG } from '../../../config/envConfig';

const AUTH_CONFIG = {
    productID: ENV_CONFIG?.PRODUCT_ID,
    clientID: ENV_CONFIG?.CLIENT_ID,
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

// CHECK DEVOTEE EXISTENCE
const checkDevoteeExist = async ({ credentials, signal }) => {
    try {
        const payload = buildAuthPayload(credentials);
        const response = await apiClient.post(
            ENDPOINTS.CHECK_USER_EXIST,
            payload,
            { signal, pre: false }
        );
        return response;
    } catch (error) {
        if (error?.name === 'CanceledError' || error?.name === 'AbortError') {
            throw error;
        }

        console.error(`[HTKY_APM][AUTH_CHECK_EXIST_FAILED] ${new Date().toISOString()}`, {
            error: error?.message || error,
            status: error?.response?.status,
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

// SEND EMAIL AUTH CODE
const sendEmailCode = async ({ emailID, emailId, signal }) => {
    try {
        const resolvedEmail = (emailID || emailId || '').trim();
        const payload = {
            emailID: resolvedEmail,
            clientID: AUTH_CONFIG.clientID
        };

        const response = await apiClient.post(
            ENDPOINTS.SEND_EMAIL_CODE || '/api/auth/sendMemberAuthCode',
            payload,
            { signal, pre: false }
        );
        return response;
    } catch (error) {
        if (error?.name === "CanceledError" || error?.name === "AbortError") {
            throw error;
        }

        console.error(`[HTKY][SEND_OTP_FAILED] ${new Date().toISOString()}`, {
            error: error?.message || error,
            status: error?.response?.status,
            emailID: emailID || emailId,
        });
        throw error;
    }
};

export const useSendEmailCode = () => {
    return useMutation({
        mutationKey: ['auth', 'sendEmailOtp'],
        mutationFn: sendEmailCode
    });
};

export const useSendMemberAuthCode = useSendEmailCode;

// VERIFY EMAIL CODE
const verifyEmailCode = async ({ emailID, emailId, code, signal }) => {
    try {
        const resolvedEmail = (emailID || emailId || '').trim();
        const resolvedCode = code != null ? String(code).trim() : "";
        const payload = {
            emailID: resolvedEmail,
            code: resolvedCode
        };

        const response = await apiClient.post(
            ENDPOINTS.VERIFY_EMAIL_CODE || '/api/auth/verifyMemberCode',
            payload,
            { signal, pre: false }
        );
        return response;
    } catch (error) {
        if (error?.name === "CanceledError" || error?.name === "AbortError") {
            throw error;
        }

        console.error(`[HTKY][VERIFY_OTP_FAILED] ${new Date().toISOString()}`, {
            error: error?.message || error,
            status: error?.response?.status,
            emailID: emailID || emailId,
        });
        throw error;
    }
};

export const useVerifyEmailCode = () => {
    return useMutation({
        mutationKey: ['auth', 'verifyEmailOtp'],
        mutationFn: verifyEmailCode
    });
};

export const useVerifyMemberCode = useVerifyEmailCode;

// CUSTOMER LOGIN
const customerLogin = async ({ credentials, signal }) => {
    try {
        const payload = buildAuthPayload(credentials);
        const response = await apiClient.post(
            ENDPOINTS.CUSTOMER_LOGIN || '/api/customerDetails/customerLoginWeb',
            payload,
            { signal, pre: false }
        );
        return response;
    } catch (error) {
        if (error?.name === 'CanceledError' || error?.name === 'AbortError') {
            throw error;
        }

        console.error(`[HTKY_APM][AUTH_LOGIN_FAILED] ${new Date().toISOString()}`, {
            error: error?.message || error,
            status: error?.response?.status,
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