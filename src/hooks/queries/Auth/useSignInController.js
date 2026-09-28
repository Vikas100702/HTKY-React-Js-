import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useCheckDevoteeExist,
    useCustomerLogin,
    useSendEmailCode,
    useVerifyEmailCode
} from './useAuthQueries';
import { useAuthStore } from '../../../store/useAuthStore';
import { useModalStore } from '../../../store/useModalStore';

export const useSignInController = () => {
    const navigate = useNavigate();
    const abortControllerRef = useRef(null);
    const { mutateAsync: checkExist, isPending: isChecking } = useCheckDevoteeExist();
    const { mutateAsync: sendEmailOtp, isPending: isSendingOtp } = useSendEmailCode();
    const { mutateAsync: verifyEmailOtp, isPending: isVerifyingOtp } = useVerifyEmailCode();
    const { mutateAsync: login, isPending: isLoggingIn } = useCustomerLogin();

    // Global State Controllers
    const authLogin = useAuthStore((state) => state.login);
    const closeModal = useModalStore((state) => state.closeModal);

    // Local Controller State
    const [error, setError] = useState('');
    const [registrationMsg, setRegistrationMsg] = useState('');
    const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
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

            if (wantToCompleteProfile) {
                navigate('/profile');
            } else {
                navigate('/dashboard');
            }
        } else {
            navigate('/dashboard');
        }
    };

    const handleSendOtp = async (email) => {
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
                setOtpEmail(cleanEmail);
                setIsEmailOtpSent(true);
                return true;
            } else {
                setError(payloadUser?.message || 'Failed to send OTP code. Please try again.');
                return false;
            }
        } catch (err) {
            if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
                return false;
            }

            console.error(`[HTKY][SEND_OTP_CONTROLLER_ERROR] ${new Date().toISOString()}`, {
                error: err?.message || err,
                email
            });

            setError(err?.response?.data?.message || err?.message || 'Failed to send verification code. Please check your network.');
            return false;
        }
    };

    const handleVerifyOtp = async (code, overrideEmail = '') => {
        let targetEmail = '';
        try {
            setError('');
            setRegistrationMsg('');

            targetEmail = (overrideEmail || otpEmail || '').trim();
            const cleanCode = code != null ? String(code).trim() : ''; // handles both number and string submissions

            if (!targetEmail) {
                setError('Email address is missing. Please re-enter your email.');
                setIsEmailOtpSent(false);
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
            if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
                return;
            }

            console.error(`[HTKY][VERIFY_OTP_CONTROLLER_ERROR] ${new Date().toISOString()}`, {
                error: err?.message || err,
                email: targetEmail
            });

            setError(err?.response?.data?.message || err?.message || 'OTP verification failed. Please try again.');
        }
    };

    const handleSignInSequence = async (formData) => {
        setError('');
        setRegistrationMsg('');

        const cleanEmail = formData?.email ? String(formData.email).trim() : '';
        const cleanPhone = formData?.phone ? String(formData.phone).replace(/[^0-9]/g, '') : '';
        const cleanCode = formData?.code != null ? String(formData.code).trim() : '';

        // Active OTP Verification Step
        if (isEmailOtpSent || cleanCode) {
            await handleVerifyOtp(cleanCode, cleanEmail || otpEmail);
            return;
        }

        // Email Provided -> Trigger OTP Dispatch
        if (cleanEmail) {
            await handleSendOtp(cleanEmail);
            return;
        }

        // Phone Provided -> Fallback to Direct Phone Authentication
        if (cleanPhone) {
            try {
                const signal = createAbortSignal();
                const credentials = {
                    email: '',
                    phone: cleanPhone
                };

                const existRes = await checkExist({ credentials, signal });
                const userExists =
                    existRes?.data?.length > 0 &&
                    (existRes?.statusCode === 1 || existRes?.statusCode === '1');

                if (!userExists) {
                    setRegistrationMsg('Account not found. Please register as a new devotee.');
                    return;
                }

                const loginRes = await login({ credentials, signal });
                const userData = loginRes?.data?.[0];

                if (userData && (loginRes?.statusCode === 1 || loginRes?.statusCode === '1')) {
                    const sessionUserData = {
                        ...userData,
                        countryCode: formData.countryCode || userData.contryCode || '+1',
                        contryCode: formData.countryCode || userData.contryCode || '+1'
                    };

                    authLogin(sessionUserData);
                    closeModal();
                    handlePostLoginNavigation(sessionUserData);
                } else {
                    setError('Login failed. Please verify your phone number or try again.');
                }
            } catch (err) {
                if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;

                console.error(`[HTKY][PHONE_LOGIN_ERROR] ${new Date().toISOString()}`, {
                    error: err?.message || err
                });
                setError(err?.response?.data?.message || err?.message || 'An unexpected network error occurred.');
            }
            return;
        }

        setError('Please enter either a valid Email Id or Phone number.');
    };

    const resetOtpFlow = () => {
        setIsEmailOtpSent(false);
        setOtpEmail('');
        setError('');
        setRegistrationMsg('');
    };

    return {
        handleSignInSequence,
        handleSendOtp,
        handleVerifyOtp,
        resetOtpFlow,
        isEmailOtpSent,
        otpEmail,
        isLoading: isSendingOtp || isVerifyingOtp || isChecking || isLoggingIn,
        isSendingOtp,
        isVerifyingOtp,
        error,
        registrationMsg,
    };
};

