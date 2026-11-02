import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAddCustomerDetail, useGetCompanyDetails } from './useRegisterQueries';
import { useAuthStore } from '../../../store/useAuthStore';
import { useModalStore } from '../../../store/useModalStore';

export const useRegisterController = () => {
    const navigate = useNavigate();
    const abortControllerRef = useRef(null);
    const isAutoFillingRef = useRef(false);

    const { mutateAsync: addCustomerDetail, isPending: isRegistering } = useAddCustomerDetail();
    const { mutateAsync: fetchCompanyDetails, isPending: isFetchingCompany } = useGetCompanyDetails();

    const authLogin = useAuthStore((state) => state.login);
    const closeModal = useModalStore((state) => state.closeModal);

    const [registrationType, setRegistrationType] = useState('INDIVIDUAL');
    const [addCompany, setAddCompany] = useState(false);

    // User Personal Details
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+1');

    // Company Details
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyFirstName, setCompanyFirstName] = useState('');
    const [companyLastName, setCompanyLastName] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [companyCountryCode, setCompanyCountryCode] = useState('+1');
    const [companyId, setCompanyId] = useState('');

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [companyEmailError, setCompanyEmailError] = useState('');

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

    const handleRegistrationTypeChange = (type) => {
        setRegistrationType(type);
        setError('');
        setCompanyEmailError('');
        if (type === 'COMPANY') {
            setAddCompany(false);
        }
    };

    const handleAddCompanyToggle = (checked) => {
        setAddCompany(checked);
        setError('');
        setCompanyEmailError('');
        if (!checked) {
            setCompanyEmail('');
            setCompanyFirstName('');
            setCompanyLastName('');
            setCompanyPhone('');
            setCompanyId('');
        }
    };

    const handleLookupCompanyDetails = async (targetEmail) => {
        if (isAutoFillingRef.current) return;

        try {
            setError('');
            setCompanyEmailError('');

            const cleanEmail = targetEmail ? targetEmail.trim() : '';
            if (!cleanEmail || !cleanEmail.includes('@')) return;

            const signal = createAbortSignal();
            const response = await fetchCompanyDetails({
                email: cleanEmail,
                signal
            });

            const isSuccess = response?.statusCode === 1 || response?.statusCode === '1';
            const companyDataList = response?.data;

            if (isSuccess && Array.isArray(companyDataList) && companyDataList.length > 0) {
                const matchedCompany = companyDataList[0];
                const compDetails = matchedCompany?.companyDetail?.[0];

                isAutoFillingRef.current = true;

                setCompanyFirstName(matchedCompany.firstName || compDetails?.companyFirstName || '');
                setCompanyLastName(matchedCompany.lastName || compDetails?.companyLastName || '');
                setCompanyEmail(matchedCompany.email || compDetails?.companyEmail || cleanEmail);

                const resolvedPhone = matchedCompany.phone || compDetails?.companyPhone || '';
                setCompanyPhone(resolvedPhone);

                if (matchedCompany.contryCode) {
                    setCompanyCountryCode(matchedCompany.contryCode);
                }
                setCompanyId(matchedCompany._id || compDetails?.companyId || '');

                setTimeout(() => {
                    isAutoFillingRef.current = false;
                }, 150);
            } else {
                setCompanyEmailError('Company not found with this email.');
                setCompanyFirstName('');
                setCompanyLastName('');
                setCompanyPhone('');
                setCompanyId('');
            }
        } catch (err) {
            isAutoFillingRef.current = false;
            if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
            setCompanyEmailError('Unable to fetch company details. Please try again.');
        }
    };

    const handleRegisterSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');   
        setSuccessMessage('');

        const isCompanyType = registrationType === 'COMPANY';
        const isIndividualWithCompany = registrationType === 'INDIVIDUAL' && addCompany;

        if (registrationType === 'INDIVIDUAL') {
            if (!email.trim()) {
                setError('Please enter your Email.');
                return;
            }
            if (!firstName.trim()) {
                setError('Please enter your First Name.');
                return;
            }
            if (!lastName.trim()) {
                setError('Please enter your Last Name.');
                return;
            }
            if (!phone || !phone.trim()) {
                setError('Please enter your Phone Number.');
                return;
            }
        }

        if (isCompanyType || isIndividualWithCompany) {
            if (!companyEmail.trim()) {
                setError('Please enter Company Email.');
                return;
            }
            if (!companyFirstName.trim()) {
                setError('Please enter Company First Name.');
                return;
            }
            if (!companyLastName.trim()) {
                setError('Please enter Company Last Name.');
                return;
            }

            if (isIndividualWithCompany && (!companyId && companyEmailError)) {
                setError('Cannot register: Company details could not be verified.');
                return;
            }
        }

        const payloadData = {
            registrationType,
            addCompany: isCompanyType ? 'NO' : (addCompany ? 'YES' : 'NO'),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            countryCode,
            companyEmail: (isCompanyType || isIndividualWithCompany) ? companyEmail.trim() : '',
            companyFirstName: (isCompanyType || isIndividualWithCompany) ? companyFirstName.trim() : '',
            companyLastName: (isCompanyType || isIndividualWithCompany) ? companyLastName.trim() : '',
            companyPhone: (isCompanyType || isIndividualWithCompany) ? companyPhone.trim() : '',
            companyCountryCode: (isCompanyType || isIndividualWithCompany) ? companyCountryCode : '+1',
            companyId: companyId.trim(),
        };

        try {
            const signal = createAbortSignal();
            const response = await addCustomerDetail({ formData: payloadData, signal });

            const isSuccess = response?.statusCode === 1 || response?.statusCode === '1';

            if (isSuccess) {
                setSuccessMessage('Registration successful! Logging you in...');

                authLogin({
                    firstName: payloadData.firstName,
                    lastName: payloadData.lastName,
                    email: payloadData.email,
                    phone: payloadData.phone,
                    countryCode: payloadData.countryCode,
                    token: response?.token || 'registered_member_token',
                });

                setTimeout(() => {
                    closeModal();
                    navigate('/dashboard');
                }, 1000);
            } else {
                setError(response?.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
            setError(err?.response?.data?.message || err?.message || 'An error occurred during registration.');
        }
    };

    return {
        registrationType,
        handleRegistrationTypeChange,
        addCompany,
        handleAddCompanyToggle,
        email,
        setEmail,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        phone,
        setPhone,
        countryCode,
        setCountryCode,
        companyEmail,
        setCompanyEmail: (val) => {
            setCompanyEmail(val);
            if (!isAutoFillingRef.current && registrationType === 'INDIVIDUAL' && addCompany && val && val.includes('@')) {
                handleLookupCompanyDetails(val);
            }
        },
        companyFirstName,
        setCompanyFirstName,
        companyLastName,
        setCompanyLastName,
        companyPhone,
        setCompanyPhone,
        companyCountryCode,
        setCompanyCountryCode,
        companyId,
        handleRegisterSubmit,
        isLoading: isRegistering || isFetchingCompany,
        error,
        successMessage,
        companyEmailError,
    };
};




