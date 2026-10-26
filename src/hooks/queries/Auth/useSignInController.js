/**
 * @file src/hooks/queries/Auth/useSignInController.js
 * @description Enterprise Business Logic Controller for Devotee Authentication.
 * Supports both Email OTP and Firebase Phone OTP login flows.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useCheckDevoteeExist,
    useCustomerLogin,
    useSendEmailCode,
    useVerifyEmailCode
} from './useAuthQueries';
import {
    requestPhoneOtp,
    confirmPhoneOtp,
    cleanupRecaptchaVerifier
} from '../../../services/firebaseAuthService';
import { useAuthStore } from '../../../store/useAuthStore';
import { useModalStore } from '../../../store/useModalStore';

export const useSignInController = () => {
    const navigate = useNavigate();
    const abortControllerRef = useRef(null);

    // Server State Mutations (Backend API)
    const { mutateAsync: checkExist, isPending: isChecking } = useCheckDevoteeExist();
    const { mutateAsync: sendEmailOtp, isPending: isSendingEmailOtp } = useSendEmailCode();
    const { mutateAsync: verifyEmailOtp, isPending: isVerifyingEmailOtp } = useVerifyEmailCode();
    const { mutateAsync: login, isPending: isLoggingIn } = useCustomerLogin();

    // Global State Controllers
    const authLogin = useAuthStore((state) => state.login);
    const closeModal = useModalStore((state) => state.closeModal);

    // Local Controller State
    const [error, setError] = useState('');
    const [registrationMsg, setRegistrationMsg] = useState('');

    // Auth Channel State: null | 'email' | 'phone'
    const [otpChannel, setOtpChannel] = useState(null);
    const [otpTarget, setOtpTarget] = useState(''); // email address ya phone number
    const [countryCode, setCountryCode] = useState('+1');

    // Firebase Phone Auth confirmation object
    const [phoneConfirmationResult, setPhoneConfirmationResult] = useState(null);
    const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
    const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);

    // DOM & Memory Resilience: Clean up in-flight requests and recaptcha on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            cleanupRecaptchaVerifier();
        };
    }, []);

    const createAbortSignal = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        return abortControllerRef.current.signal;
    };

    const handlePostLoginNavigation = (userData) => {
        const isProfileIncomplete = !userData?.firstName || !userData?.addressLine1;

        if (isProfileIncomplete) {
            const wantToCompleteProfile = window.confirm(
                'Welcome! It looks like your profile is incomplete. Would you like to complete it now?'
            );
            navigate(wantToCompleteProfile ? '/profile' : '/dashboard');
        } else {
            navigate('/dashboard');
        }
    };

    // ------------------------------------------------------------------------
    // EMAIL OTP FLOW
    // ------------------------------------------------------------------------
    const handleSendEmailOtp = async (email) => {
        try {
            setError('');
            setRegistrationMsg('');
            const cleanEmail = typeof email === 'string' ? email.trim() : '';

            if (!cleanEmail) {
                setError('Please enter a valid email address.');
                return false;
            }

            const signal = createAbortSignal();
            const response = await sendEmailOtp({ emailID: cleanEmail, signal });
            const payloadUser = response?.user || response?.data?.user || response?.data;
            const isSuccess = payloadUser?.statusCode === 1 || payloadUser?.statusCode === '1' || response?.statusCode === 1;

            if (isSuccess) {
                setOtpTarget(cleanEmail);
                setOtpChannel('email');
                return true;
            } else {
                setError(payloadUser?.message || 'Failed to send OTP code. Please try again.');
                return false;
            }
        } catch (err) {
            if (err?.name === 'CanceledError' || err?.name === 'AbortError') return false;
            setError(err?.response?.data?.message || err?.message || 'Failed to send verification code.');
            return false;
        }
    };

    const handleVerifyEmailOtp = async (code, overrideEmail = '') => {
        try {
            setError('');
            setRegistrationMsg('');
            const targetEmail = (overrideEmail || otpTarget || '').trim();
            const cleanCode = code != null ? String(code).trim() : '';

            if (!targetEmail) {
                setError('Email address is missing. Please re-enter your email.');
                setOtpChannel(null);
                return;
            }

            if (!cleanCode || cleanCode.length < 4) {
                setError('Please enter a valid verification code.');
                return;
            }

            const signal = createAbortSignal();
            const response = await verifyEmailOtp({
                emailID: targetEmail,
                code: cleanCode,
                signal
            });

            const payloadUser = response?.user || response?.data?.user || response?.data;
            const isSuccess = payloadUser?.statusCode === 1 || payloadUser?.statusCode === '1' || response?.statusCode === 1;

            if (isSuccess) {
                const userData = Array.isArray(payloadUser?.data) ? payloadUser.data[0] : payloadUser?.data;
                const sessionUserData = {
                    email: targetEmail,
                    token: payloadUser?.token || 'verified_member_token',
                    countryCode: '+1',
                    contryCode: '+1',
                    ...(userData || {})
                };

                authLogin(sessionUserData);
                closeModal();
                handlePostLoginNavigation(sessionUserData);
            } else {
                setError(payloadUser?.message || 'Invalid or expired OTP. Please verify and try again.');
            }
        } catch (err) {
            if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
            setError(err?.response?.data?.message || err?.message || 'OTP verification failed. Please try again.');
        }
    };

    // ------------------------------------------------------------------------
    // PHONE OTP FLOW (FIREBASE)
    // ------------------------------------------------------------------------
    const handleSendPhoneOtp = async (rawPhone, dialCode = '+1', containerId = 'recaptcha-container') => {
        try {
            setError('');
            setRegistrationMsg('');
            setIsSendingPhoneOtp(true);

            const cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
            if (!cleanPhone || cleanPhone.length < 6) {
                setError('Please enter a valid phone number.');
                setIsSendingPhoneOtp(false);
                return false;
            }

            // Check if devotee exists on backend first
            const signal = createAbortSignal();
            const existRes = await checkExist({
                credentials: { email: '', phone: cleanPhone },
                signal
            });

            const userExists = existRes?.data?.length > 0 && (existRes?.statusCode === 1 || existRes?.statusCode === '1');
            if (!userExists) {
                setRegistrationMsg('Account not found. Please register as a new devotee.');
                setIsSendingPhoneOtp(false);
                return false;
            }

            // Trigger Firebase SMS OTP
            const confirmation = await requestPhoneOtp(cleanPhone, dialCode, containerId);

            setPhoneConfirmationResult(confirmation);
            setOtpTarget(cleanPhone);
            setCountryCode(dialCode);
            setOtpChannel('phone');
            setIsSendingPhoneOtp(false);
            return true;
        } catch (err) {
            setIsSendingPhoneOtp(false);
            setError(err?.message || 'Failed to send phone OTP.');
            return false;
        }
    };

    const handleVerifyPhoneOtp = async (otpCode) => {
        try {
            setError('');
            setRegistrationMsg('');
            setIsVerifyingPhoneOtp(true);

            if (!phoneConfirmationResult) {
                setError('OTP session expired. Please request a new OTP.');
                setIsVerifyingPhoneOtp(false);
                return;
            }

            // 1. Verify OTP with Firebase
            await confirmPhoneOtp(phoneConfirmationResult, otpCode);

            // 2. Perform backend login to fetch user data
            const signal = createAbortSignal();
            const loginRes = await login({
                credentials: { email: '', phone: otpTarget },
                signal
            });

            const userData = loginRes?.data?.[0];
            if (userData && (loginRes?.statusCode === 1 || loginRes?.statusCode === '1')) {
                const sessionUserData = {
                    ...userData,
                    countryCode: countryCode || userData.contryCode || '+1',
                    contryCode: countryCode || userData.contryCode || '+1'
                };

                authLogin(sessionUserData);
                closeModal();
                handlePostLoginNavigation(sessionUserData);
            } else {
                setError('Login failed after OTP verification. Please try again.');
            }

            setIsVerifyingPhoneOtp(false);
        } catch (err) {
            setIsVerifyingPhoneOtp(false);
            setError(err?.message || 'Phone OTP verification failed.');
        }
    };

    // ------------------------------------------------------------------------
    // UNIFIED ENTRY DISPATCHER
    // ------------------------------------------------------------------------
    const handleSignInSequence = async (formData) => {
        setError('');
        setRegistrationMsg('');

        // Agar user OTP screen par hai:
        if (otpChannel === 'email') {
            await handleVerifyEmailOtp(formData.code, formData.email || otpTarget);
            return;
        }
        if (otpChannel === 'phone') {
            await handleVerifyPhoneOtp(formData.code);
            return;
        }

        const cleanEmail = formData?.email ? String(formData.email).trim() : '';
        const cleanPhone = formData?.phone ? String(formData.phone).replace(/[^0-9]/g, '') : '';

        // Route A: Email entered -> Email OTP
        if (cleanEmail) {
            await handleSendEmailOtp(cleanEmail);
            return;
        }

        // Route B: Phone entered -> Firebase Phone OTP
        if (cleanPhone) {
            await handleSendPhoneOtp(cleanPhone, formData.countryCode || '+1');
            return;
        }

        setError('Please enter either a valid Email Id or Phone number.');
    };

    const resetOtpFlow = () => {
        setOtpChannel(null);
        setOtpTarget('');
        setPhoneConfirmationResult(null);
        setError('');
        setRegistrationMsg('');
        cleanupRecaptchaVerifier();
    };

    return {
        handleSignInSequence,
        handleSendEmailOtp,
        handleVerifyEmailOtp,
        handleSendPhoneOtp,
        handleVerifyPhoneOtp,
        resetOtpFlow,
        otpChannel,
        isOtpSent: Boolean(otpChannel),
        otpTarget,
        countryCode,
        isLoading: isSendingEmailOtp || isVerifyingEmailOtp || isChecking || isLoggingIn || isSendingPhoneOtp || isVerifyingPhoneOtp,
        isSendingOtp: isSendingEmailOtp || isSendingPhoneOtp,
        isVerifyingOtp: isVerifyingEmailOtp || isVerifyingPhoneOtp,
        error,
        registrationMsg,
    };
};