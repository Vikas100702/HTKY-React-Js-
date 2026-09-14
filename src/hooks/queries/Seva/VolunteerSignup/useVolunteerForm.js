/**
 * @file src/pages/Seva/hooks/useVolunteerForm.js
 * @description Logic Controller for the Volunteer Sign Up feature.
 * Encapsulates all state, form validation, network orchestration, and memory safety.
 */

import { useState, useRef, useEffect } from "react";
import {
    useUploadVolunteerPhoto,
    useSubmitVolunteerForm,
    useGetStates,
    useGetCities,
} from "../../Seva/VolunteerSignup/useGetVolunteerSignUp";
import { ENV_CONFIG } from "../../../../constants/envConfig";
import { useToastStore } from "../../../../store/useToastStore";

export const useVolunteerForm = () => {
    const addToast = useToastStore?.((state) => state.addToast) || console.log;

    const { mutateAsync: uploadPhoto, isPending: isUploading } = useUploadVolunteerPhoto();
    const { mutateAsync: submitForm, isPending: isSubmitting } = useSubmitVolunteerForm();

    const { data: statesList } = useGetStates();

    const [uploadedFileMeta, setUploadedFileMeta] = useState(null);
    const [uploadError, setUploadError] = useState(null);
    const [isTermsAccepted, setIsTermsAccepted] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        productId: ENV_CONFIG?.PRODUCT_ID || "HTKY",
        clientId: ENV_CONFIG?.CLIENT_ID || "WEB",
        date: new Date().toLocaleDateString("en-GB"),
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        volunteerID: "",
        name: "",
        firstName: "",
        lastName: "",
        mobile: "",
        email: "",
        volunteerArea: [],
        isInsert: true,
        emrgContactName: "",
        emrgContactNumber: "",
        dob: "",
        gender: "Male",
        workingHours: "",
        notes: "",
        country: "",
        state: "",
        city: "",
        zip: "",
        address: "",
    });

    const { data: citiesList, isLoading: isCitiesLoading } = useGetCities(formData.state);

    const abortControllerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleNumericKeyDown = (e) => {
        const allowedKeys = [
            "Backspace", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
            "Delete", "Tab", "Enter",
        ];

        if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
        }
    };

    const handleInputChange = (e) => {
        let { name, value, type, checked } = e.target;

        if (["mobile", "emrgContactNumber", "workingHours", "zip"].includes(name)) {
            value = value.replace(/\D/g, "");
        }

        if (type === "checkbox" && name !== "terms") {
            setFormData((prev) => {
                const currentAreas = prev.volunteerArea || [];
                if (checked) {
                    return { ...prev, volunteerArea: [...currentAreas, value] };
                } else {
                    return {
                        ...prev,
                        volunteerArea: currentAreas.filter((item) => item !== value),
                    };
                }
            });
            return;
        }

        // FIX: Proactively reset the interdependent City field when State changes
        setFormData((prev) => {
            const updatedData = { ...prev, [name]: value };
            if (name === "state") {
                updatedData.city = ""; // Clear stale city data
            }
            return updatedData;
        });
    };

    const handleFileChange = async (e) => {
        const selectedFile = e.target?.files?.[0];
        if (!selectedFile) return;

        setUploadError(null);
        abortControllerRef.current = new AbortController();

        try {
            const result = await uploadPhoto({
                image: selectedFile,
                signal: abortControllerRef.current.signal,
            });

            if (result) {
                setUploadedFileMeta(result);
            } else {
                setUploadError("Failed to parse server response. Please try again.");
                addToast({ type: "error", message: "Photo upload failed. Invalid server response." });
            }
        } catch (error) {
            if (error.name !== "CanceledError" && error.name !== "AbortError") {
                console.error(`[Upload Error] ${new Date().toISOString()}:`, error);
                setUploadError("Network error occurred during upload.");
                addToast({ type: "error", message: "Network error occurred during upload." });
            }
        }
    };

    const handleClearForm = () => {
        setFormData((prev) => ({
            ...prev,
            firstName: "", lastName: "", mobile: "", email: "", volunteerArea: [],
            emrgContactName: "", emrgContactNumber: "", dob: "", gender: "Male",
            workingHours: "", notes: "", state: "", city: "", zip: "", address: "",
        }));
        setUploadedFileMeta(null);
        setUploadError(null);
        setIsTermsAccepted(false);
    };

    const handleTermsClick = (e) => {
        e.preventDefault();
        if (isTermsAccepted) setIsTermsAccepted(false);
        else setIsTermsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isTermsAccepted) {
            addToast({ type: "warning", message: "Please accept the Terms and Conditions." });
            return;
        }

        abortControllerRef.current = new AbortController();

        const finalPayload = {
            ...formData,
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            base64: uploadedFileMeta?.extractedFileName
                ? `uploads/others/${uploadedFileMeta.extractedFileName}`
                : "",
            volunteerArea: JSON.stringify(formData.volunteerArea),
        };

        delete finalPayload.firstName;
        delete finalPayload.lastName;

        try {
            const response = await submitForm({
                payload: finalPayload,
                signal: abortControllerRef.current.signal
            });

            if (response?.statusCode === 1 || response?.msg === "Volunteer added succesfully") {
                addToast({ type: "success", message: "Volunteer registration successful!" });
                handleClearForm();
            } else {
                console.warn(`[Submit Validation Failure] ${new Date().toISOString()}:`, response);
                addToast({ type: "error", message: response?.msg || "Failed to submit registration. Please try again." });
            }
        } catch (error) {
            if (error.name !== "CanceledError" && error.name !== "AbortError") {
                console.error(`[Submit Error] ${new Date().toISOString()}:`, error);
                addToast({ type: "error", message: "An error occurred during submission. Please try again." });
            }
        }
    };

    return {
        state: {
            formData,
            isUploading,
            isSubmitting,
            uploadError,
            uploadedFileMeta,
            isTermsAccepted,
            isTermsModalOpen,
            statesList,
            citiesList,
            isCitiesLoading
        },
        handlers: {
            handleInputChange,
            handleNumericKeyDown,
            handleFileChange,
            handleClearForm,
            handleTermsClick,
            handleSubmit,
            setIsTermsModalOpen,
            setIsTermsAccepted
        }
    };
};