/**
 * @file src/hooks/queries/MakePayment/useGetServiceDetailById.js
 * @description Minimal TanStack Query hook for Make a Payment module.
 * Fetches a single service record from `POST /api/bookingService/getServiceDetailbyId`
 * and normalizes it using the existing `adaptServiceSetupData` adapter so all
 * `UniversalServiceCard` & `EventDetails` rules apply automatically without duplication.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { BASE_URL, ENDPOINTS } from '../../../constants/apiConstants';
import { ENV_CONFIG } from '../../../config/envConfig';
import { adaptServiceSetupData } from '../Services/Book_Services/useGetServices';

const resolveImageUrl = (rawPath) => {
    if (!rawPath || typeof rawPath !== 'string') return '';
    const trimmed = rawPath.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
    const base = String(BASE_URL || '').replace(/\/+$/, '');
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return base ? `${base}${path}` : path;
};

export const useGetServiceDetailById = (serviceId) => {
    const normalizedId = typeof serviceId === 'string' ? serviceId.trim() : '';

    return useQuery({
        queryKey: [
            'makePaymentServiceDetail',
            ENV_CONFIG.PRODUCT_ID,
            ENV_CONFIG.CLIENT_ID,
            normalizedId,
        ],
        enabled: Boolean(normalizedId),
        queryFn: async ({ signal }) => {
            const response = await apiClient.post(
                ENDPOINTS.GET_SERVICE_DETAIL_BY_ID || 'api/bookingService/getServiceDetailbyId',
                {
                    productId: ENV_CONFIG.PRODUCT_ID,
                    clientId: ENV_CONFIG.CLIENT_ID,
                    _id: normalizedId,
                },
                { signal, pre: true }
            );

            const list = Array.isArray(response)
                ? response
                : Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response?.data?.data)
                        ? response.data.data
                        : [];

            const rawRecord = list[0] || null;
            if (!rawRecord) return null;

            const defaultCategory = rawRecord?.serviceCategoryTypes || 'EVENTS';
            const [cardService] = adaptServiceSetupData([rawRecord], defaultCategory);

            return {
                id: rawRecord?._id || rawRecord?.insertedId || normalizedId,
                title:
                    String(rawRecord?.refDataName || '').trim() ||
                    String(rawRecord?.parentService || '').trim() ||
                    'Temple Offering',
                parentService: String(rawRecord?.parentService || '').trim(),
                serviceTypes: String(rawRecord?.serviceTypes || '').trim(),
                serviceCategoryTypes: defaultCategory,
                imageUrl: resolveImageUrl(rawRecord?.Image || rawRecord?.thumbnailImage),
                startDate: rawRecord?.startDate || '',
                endDate: rawRecord?.endDate || '',
                startTime: rawRecord?.startTime || '',
                description: rawRecord?.description || '',
                amount:
                    parseFloat(String(rawRecord?.serviceAmount ?? '0').replace(/[^0-9.]/g, '')) || 0,
                includeSankalpam: rawRecord?.includeSankalpam || '',
                cardService: cardService || null,
                rawItem: rawRecord,
            };
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        retry: 1,
    });
};

export default useGetServiceDetailById;

