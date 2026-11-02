import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { buildComponentConfigPayload } from '../../../utils/apiPayloadBuilder';
import { encodeBase64, decodeBase64 } from '../../../utils/base64';

const getDateTimeMetadata = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    const createdDate = `${month}/${day}/${year}`;

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, '0');
    const createdTime = `${formattedHours}:${minutes} ${ampm}`;

    return { createdDate, createdTime };
};

const cleanedPhoneDigits = (rawPhone) => {
    if (!rawPhone) return "";
    return String(rawPhone).replace(/[^0-9]/g, '');
};

const buildRegisterPayload = (formData) => {
    const { createdDate, createdTime } = getDateTimeMetadata();
    const registrationType = formData.registrationType || "INDIVIDUAL";
    const addCompany = formData.addCompany || "NO";

    let companyDetail = [
        {
            companyFirstName: "",
            companyLastName: "",
            companyEmail: "",
            companyCountryCode: "",
            companyPhone: "",
            companyId: "",
            status: ""
        }
    ];

    if (registrationType === "INDIVIDUAL" && addCompany === "YES") {
        companyDetail = [
            {
                companyFirstName: formData.companyFirstName || "",
                companyLastName: formData.companyLastName || "",
                companyEmail: encodeBase64(formData.companyEmail || ""),
                companyCountryCode: formData.companyCountryCode || "+91",
                companyPhone: encodeBase64(cleanedPhoneDigits(formData.companyPhone || "")),
                companyId: formData.companyId || "",
                status: formData.status || "ACTIVE"
            }
        ];
    }

    const isCompany = registrationType === "COMPANY";

    const payloadEmail = isCompany ? (formData.companyEmail || "") : (formData.email || "");
    const payloadFirstName = isCompany ? (formData.companyFirstName || "") : (formData.firstName || "");
    const payloadLastName = isCompany ? (formData.companyLastName || "") : (formData.lastName || "");
    const payloadPhone = isCompany ? cleanedPhoneDigits(formData.companyPhone || "") : cleanedPhoneDigits(formData.phone || "");
    const payloadCountryCode = isCompany ? (formData.companyCountryCode || "+91") : (formData.countryCode || "+91");

    const configPayload = buildComponentConfigPayload({
        moduleName: "Contacts",
        // aspectType: "Member Directories",
        skip: 0,
        next: 1
    });

    return {
        dataJson: {
            registrationType,
            addCompany: isCompany ? "NO" : addCompany,
            refDataName: `${payloadFirstName} ${payloadLastName}`.trim(),
            email: payloadEmail.trim(),
            phone: payloadPhone,
            contryCode: payloadCountryCode,
            firstName: payloadFirstName,
            lastName: payloadLastName,
            ipAddress: formData.ipAddress || "106.203.230.20",
            companyDetail: isCompany ? [{ companyFirstName: "", companyLastName: "", companyEmail: "", companyCountryCode: "", companyPhone: "", companyId: "", status: "" }] : companyDetail,
            source: "WEBSITE",
            createdDate,
            createdTime
        },
        componentConfig: configPayload.componentConfig
    };
};

const addCustomerDetailWeb = async ({ formData, signal }) => {
    try {
        const payload = buildRegisterPayload(formData);
        const response = await apiClient.post(
            ENDPOINTS.ADD_CUSTOMER_DETAIL,
            payload,
            { signal, pre: true }
        );
        return response;
    } catch (error) {
        if (error?.isAborted || error?.name === 'CanceledError' || error?.name === 'AbortError') {
            throw error;
        }
        console.error(`[HTKY_APM][REGISTER_CUSTOMER_FAILED] ${new Date().toISOString()}`, error);
        throw error;
    }
};

export const useAddCustomerDetail = () => {
    return useMutation({
        mutationKey: ['register', 'addCustomerDetail'],
        mutationFn: addCustomerDetailWeb,
    });
};

const getCompanyDetails = async ({ email = '', signal }) => {
    try {
        const configPayload = buildComponentConfigPayload({
            moduleName: "Contacts",
            aspectType: "companyDetails",
            skip: 0,
            next: 1024
        });

        const payload = {
            dataJson: {
                email: email ? email.trim() : "",
                isMobile: false,
                phone: ""
            },
            devoteeId: "",
            componentConfig: configPayload.componentConfig
        };

        const response = await apiClient.post(
            ENDPOINTS.GET_COMPANY_DETAILS,
            payload,
            { signal, pre: true }
        );

        if (response?.data && Array.isArray(response.data)) {
            response.data = response.data.map(item => {
                let decodedEmail;
                let decodedPhone;
                try {
                    decodedEmail = item?.email ? decodeBase64(item.email) : "";
                } catch {
                    decodedEmail = item?.email || "";
                }
                try {
                    decodedPhone = item?.phone ? decodeBase64(item.phone) : "";
                } catch {
                    decodedPhone = item?.phone || "";
                }

                const decodedItem = {
                    ...item,
                    email: decodedEmail,
                    phone: decodedPhone
                };

                if (decodedItem?.companyDetail && Array.isArray(decodedItem.companyDetail)) {
                    decodedItem.companyDetail = decodedItem.companyDetail.map(comp => {
                        let compEmail;
                        let compPhone;
                        try {
                            compEmail = comp?.companyEmail ? decodeBase64(comp.companyEmail) : "";
                        } catch {
                            compEmail = comp?.companyEmail || "";
                        }
                        try {
                            compPhone = comp?.companyPhone ? decodeBase64(comp.companyPhone) : "";
                        } catch {
                            compPhone = comp?.companyPhone || "";
                        }
                        return {
                            ...comp,
                            companyEmail: compEmail,
                            companyPhone: compPhone
                        };
                    });
                }
                return decodedItem;
            });
        }

        return response;
    } catch (error) {
        if (error?.isAborted || error?.name === 'CanceledError' || error?.name === 'AbortError') {
            throw error;
        }
        console.error(`[HTKY_APM][GET_COMPANY_DETAILS_FAILED] ${new Date().toISOString()}`, error);
        throw error;
    }
};

export const useGetCompanyDetails = () => {
    return useMutation({
        mutationKey: ['register', 'getCompanyDetails'],
        mutationFn: getCompanyDetails,
    });
};




