import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckDevoteeExist, useCustomerLogin } from './useAuthQueries';
import { useAuthStore } from '../../../store/useAuthStore';
import { useModalStore } from '../../../store/useModalStore';

export const useSignInController = () => {
    const navigate = useNavigate();
    const abortControllerRef = useRef(null);

    // Server State Mutations
    const { mutateAsync: checkExist, isPending: isChecking } = useCheckDevoteeExist();
    const { mutateAsync: login, isPending: isLoggingIn } = useCustomerLogin();

    // Global State Controllers
    const authLogin = useAuthStore((state) => state.login);
    const closeModal = useModalStore((state) => state.closeModal);

    // Local Controller State
    const [error, setError] = useState('');
    const [registrationMsg, setRegistrationMsg] = useState('');

    // DOM & Memory Resilience: Auto-cancel in-flight requests on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleSignInSequence = async (formData) => {
        try {
            setError('');
            setRegistrationMsg('');

            // Cancel any previously active in-flight request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();
            const signal = abortControllerRef.current.signal;

            // 1. Sanitize Phone: Strictly digits only, preventing any dial code leak
            const cleanPhone = formData.phone ? String(formData.phone).replace(/[^0-9]/g, '') : '';
            const isMobile = Boolean(cleanPhone && !formData.email);

            // Payload contract: Exclude countryCode from API payload
            const credentials = {
                email: isMobile ? '' : (formData.email?.trim() || ''),
                phone: isMobile ? cleanPhone : ''
            };

            if (!credentials.email && !credentials.phone) {
                setError('Please enter either a valid Email or Phone number.');
                return;
            }

            // 2. Pre-flight Check: Does devotee exist?
            const existRes = await checkExist({ credentials, signal });
            const userExists = existRes?.data?.length > 0 && existRes?.statusCode === '1';

            if (!userExists) {
                setRegistrationMsg('Account not found. Please register as a new devotee.');
                return;
            }

            // 3. Authenticate User
            const loginRes = await login({ credentials, signal });
            const userData = loginRes?.data?.[0];

            if (userData && loginRes.statusCode === '1') {
                // 4. Persist Session & Store Country Code for Future Needs (Rule #4)
                const sessionUserData = {
                    ...userData,
                    contryCode: formData.countryCode || userData.contryCode || '+1'
                };

                authLogin(sessionUserData);
                closeModal();

                // 5. First-Time Login / Profile Check Gate
                const isProfileIncomplete = !userData.firstName || !userData.addressLine1;

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
            } else {
                setError('Login failed. Please verify your credentials or try again.');
            }
        } catch (err) {
            if (err.name === 'CanceledError' || err.name === 'AbortError') {
                return;
            }

            console.error(`[HTKY_APM][AUTH_CONTROLLER_ERROR] ${new Date().toISOString()}`, {
                error: err?.message || err,
                stack: err?.stack
            });

            setError(err?.response?.data?.message || err?.message || 'An unexpected network error occurred.');
        }
    };

    return {
        handleSignInSequence,
        isLoading: isChecking || isLoggingIn,
        error,
        registrationMsg,
    };
};

