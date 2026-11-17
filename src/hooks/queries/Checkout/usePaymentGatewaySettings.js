// /**
//  * from CLIENT_SETTINGS API.
//  * two-tier validation:
//  * paymentGatewayoffon (source: "WEBSITE", isenable: true)
//  * paymentGatewaySettings (platform: "WEBSITE", active gateway mapping)
//  */

// import { useQuery } from '@tanstack/react-query';
// import { apiClient } from '../../../api/client';
// import { ENDPOINTS, MPI_GATEWAY_CONFIG } from '../../../constants/apiConstants';
// import { ENV_CONFIG } from '../../../config/envConfig';

// const resolveWebsiteGatewayConfig = (rawSettings) => {
//     const defaultFallback = {
//         isAvailable: false,
//         reason: 'Payment service is currently unavailable. Sorry for the inconvenience.',
//         gatewayProvider: null, // 'NMI' | 'MPI' | null
//         gatewayMode: null, // 'LIVE' | 'TEST' | null
//         tokenizationKey: '',
//         rawConfig: null,
//     };

//     if (!rawSettings) {
//         return defaultFallback;
//     }

//     // Extract nested setting payload safely
//     const settingsData =
//         rawSettings?.data?.data?.[0] ||
//         rawSettings?.data?.[0] ||
//         rawSettings?.data ||
//         rawSettings;

//     const offOnList = Array.isArray(settingsData?.paymentGatewayoffon)
//         ? settingsData.paymentGatewayoffon
//         : [];

//     const gatewaySettingsList = Array.isArray(settingsData?.paymentGatewaySettings)
//         ? settingsData.paymentGatewaySettings
//         : [];

//     const clientInfo = settingsData?.clientInfo || settingsData?.clientInfoById || {};

//     // VERIFY WEBSITE PAYMENT SWITCH 
//     const websiteOffOnConfig = offOnList.find(
//         (item) => String(item?.source || '').trim().toUpperCase() === 'WEBSITE'
//     );

//     // If WEBSITE source does not exist or isenable is not true
//     if (!websiteOffOnConfig || websiteOffOnConfig.isenable !== true) {
//         const downDescription =
//             websiteOffOnConfig?.desc?.trim() ||
//             'Payment service is currently down for maintenance. Sorry for the inconvenience.';
//         return {
//             ...defaultFallback,
//             isAvailable: false,
//             reason: downDescription,
//         };
//     }

//     // WEBSITE PAYMENT GATEWAY 
//     const websiteGatewaySetting = gatewaySettingsList.find(
//         (item) => String(item?.platform || '').trim().toUpperCase() === 'WEBSITE'
//     );

//     const rawGateways = Array.isArray(websiteGatewaySetting?.paymentGateway)
//         ? websiteGatewaySetting.paymentGateway
//         : [];

//     const activeGatewayString = String(rawGateways[0] || '').trim().toUpperCase();

//     if (!activeGatewayString) {
//         return {
//             ...defaultFallback,
//             isAvailable: false,
//             reason: 'No active payment gateway is configured for this platform. Sorry for the inconvenience.',
//         };
//     }

//     // MAP GATEWAY SPECIFICS (NMI vs MPI) 
//     let gatewayProvider;
//     let gatewayMode;
//     let tokenizationKey;

//     // NMI resolution (NMI, NMI-TEST)
//     if (activeGatewayString.includes('NMI')) {
//         gatewayProvider = 'NMI';
//         gatewayMode = activeGatewayString.includes('TEST') ? 'TEST' : 'LIVE';

//         tokenizationKey =
//             gatewayMode === 'TEST'
//                 ? clientInfo?.NmiMerchantKeyTokenizationTest || clientInfo?.NmiMerchantKeyTokenization || ''
//                 : clientInfo?.NmiMerchantKeyTokenization || '';
//     }
//     // MPI / BridgePay resolution (MPI, MPITEST, MPI-BRIDGEPAY)
//     else if (activeGatewayString.includes('MPI')) {
//         gatewayProvider = 'MPI';
//         gatewayMode =
//             activeGatewayString.includes('TEST') || activeGatewayString === 'MPITEST'
//                 ? 'TEST'
//                 : 'LIVE';

//         tokenizationKey =
//             clientInfo?.MPItokenPay ||
//             (gatewayMode === 'TEST' ? MPI_GATEWAY_CONFIG.DEFAULT_TEST_TOKEN : '');
//     }
//     // Unknown or unsupported gateway
//     else {
//         return {
//             ...defaultFallback,
//             isAvailable: false,
//             reason: `Unsupported payment gateway (${activeGatewayString}) encountered. Sorry for the inconvenience.`,
//         };
//     }

//     return {
//         isAvailable: true,
//         reason: '',
//         gatewayProvider,
//         gatewayMode,
//         rawGatewayName: activeGatewayString,
//         tokenizationKey,
//         rawConfig: settingsData,
//     };
// };

// export const usePaymentGatewaySettings = () => {
//     const payload = {
//         action: 'getClientSetting',
//         productId: ENV_CONFIG.PRODUCT_ID,
//         clientId: ENV_CONFIG.CLIENT_ID
//     };
//     const query = useQuery({
//         queryKey: ['clientSettings', 'paymentGateway'],
//         queryFn: async ({ signal }) => {
//             const response = await apiClient.post(ENDPOINTS.CLIENT_SETTINGS, payload, { signal });
//             return response;
//         },
//         staleTime: 1000 * 60 * 10, // 10 minutes cache freshness
//         gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
//         refetchOnWindowFocus: false,
//         retry: 2,
//     });

//     const resolvedConfig = resolveWebsiteGatewayConfig(query.data);

//     return {
//         isPaymentEnabled: resolvedConfig.isAvailable,
//         gatewayProvider: resolvedConfig.gatewayProvider,
//         gatewayMode: resolvedConfig.gatewayMode,
//         rawGatewayName: resolvedConfig.rawGatewayName,
//         tokenizationKey: resolvedConfig.tokenizationKey,
//         downReason: resolvedConfig.reason,
//         isLoading: query.isLoading,
//         isError: query.isError,
//         error: query.error,
//         refetch: query.refetch,
//     };
// };

// export default usePaymentGatewaySettings;


/**
 * @file src/hooks/queries/Checkout/usePaymentGatewaySettings.js
 * @description Centralized TanStack Query hook to resolve active payment gateway settings
 * from the temple backend CLIENT_SETTINGS API using the correct POST payload.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS, MPI_GATEWAY_CONFIG } from '../../../constants/apiConstants';
import { ENV_CONFIG } from '../../../config/envConfig';

const resolveWebsiteGatewayConfig = (rawSettings) => {
    const defaultFallback = {
        isAvailable: false,
        reason: 'Payment service is currently unavailable. Sorry for the inconvenience.',
        gatewayProvider: null, // 'NMI' | 'MPI' | null
        gatewayMode: null, // 'LIVE' | 'TEST' | null
        tokenizationKey: '',
        rawConfig: null,
    };

    if (!rawSettings) {
        return defaultFallback;
    }

    // Extract nested setting payload safely based on your JSON structure
    const settingsData =
        rawSettings?.data?.data?.[0] ||
        rawSettings?.data?.[0] ||
        rawSettings?.result?.data?.[0] ||
        rawSettings?.result?.[0] ||
        rawSettings;

    const offOnList = Array.isArray(settingsData?.paymentGatewayoffon)
        ? settingsData.paymentGatewayoffon
        : [];

    const gatewaySettingsList = Array.isArray(settingsData?.paymentGatewaySettings)
        ? settingsData.paymentGatewaySettings
        : [];

    const clientInfo = settingsData?.clientInfo || settingsData?.clientInfoById || {};

    // 1. Verify Website Payment Switch in paymentGatewayoffon
    const websiteOffOnConfig = offOnList.find(
        (item) => String(item?.source || '').trim().toUpperCase() === 'WEBSITE'
    );

    if (!websiteOffOnConfig || websiteOffOnConfig.isenable !== true) {
        const downDescription =
            websiteOffOnConfig?.desc?.trim() ||
            'Payment service is currently down for maintenance. Sorry for the inconvenience.';
        return {
            ...defaultFallback,
            isAvailable: false,
            reason: downDescription,
        };
    }

    // 2. Resolve Active Gateway from paymentGatewaySettings for platform: WEBSITE
    const websiteGatewaySetting = gatewaySettingsList.find(
        (item) => String(item?.platform || '').trim().toUpperCase() === 'WEBSITE'
    );

    const rawGateways = Array.isArray(websiteGatewaySetting?.paymentGateway)
        ? websiteGatewaySetting.paymentGateway
        : [];

    const activeGatewayString = String(rawGateways[0] || '').trim().toUpperCase();

    if (!activeGatewayString) {
        return {
            ...defaultFallback,
            isAvailable: false,
            reason: 'No active payment gateway is configured for this platform. Sorry for the inconvenience.',
        };
    }

    let gatewayProvider;
    let gatewayMode;
    let tokenizationKey;

    // Map NMI vs MPI
    if (activeGatewayString.includes('NMI')) {
        gatewayProvider = 'NMI';
        gatewayMode = activeGatewayString.includes('TEST') ? 'TEST' : 'LIVE';

        tokenizationKey =
            gatewayMode === 'TEST'
                ? clientInfo?.NmiMerchantKeyTokenizationTest || clientInfo?.NmiMerchantKeyTokenization || ''
                : clientInfo?.NmiMerchantKeyTokenization || '';
    } else if (activeGatewayString.includes('MPI')) {
        gatewayProvider = 'MPI';
        gatewayMode =
            activeGatewayString.includes('TEST') || activeGatewayString === 'MPITEST'
                ? 'TEST'
                : 'LIVE';

        tokenizationKey =
            clientInfo?.MPItokenPay ||
            (gatewayMode === 'TEST' ? MPI_GATEWAY_CONFIG.DEFAULT_TEST_TOKEN : '');
    } else {
        return {
            ...defaultFallback,
            isAvailable: false,
            reason: `Unsupported payment gateway (${activeGatewayString}) encountered.`,
        };
    }

    return {
        isAvailable: true,
        reason: '',
        gatewayProvider,
        gatewayMode,
        rawGatewayName: activeGatewayString,
        tokenizationKey,
        rawConfig: settingsData,
    };
};

export const usePaymentGatewaySettings = () => {
    const payload = {
        action: 'getClientSetting',
        productId: ENV_CONFIG.PRODUCT_ID,
        clientId: ENV_CONFIG.CLIENT_ID
    };

    const query = useQuery({
        queryKey: ['clientSettings', 'paymentGateway'],
        queryFn: async ({ signal }) => {
            // Must use POST with payload as required by the backend settings API
            const response = await apiClient.post(ENDPOINTS.CLIENT_SETTINGS, payload, { signal });
            return response;
        },
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        retry: 2,
    });

    const resolvedConfig = resolveWebsiteGatewayConfig(query.data);

    return {
        isPaymentEnabled: resolvedConfig.isAvailable,
        gatewayProvider: resolvedConfig.gatewayProvider,
        gatewayMode: resolvedConfig.gatewayMode,
        rawGatewayName: resolvedConfig.rawGatewayName,
        tokenizationKey: resolvedConfig.tokenizationKey,
        downReason: resolvedConfig.reason,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
};

export default usePaymentGatewaySettings;
