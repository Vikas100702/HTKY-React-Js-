// /**
//  * @file src/hooks/queries/Checkout/checkoutApi.js
//  * @description Centralized TanStack Query mutations for the Checkout & Payment pipeline:
//  * 1. `useCheckSareeAvailability` - Verifies deity saree slot availability.
//  * 2. `useAddServiceCartTemp` - Locks temporary cart reservation in MongoDB.
//  * 3. `useProcessMpiPayment` - Charges tokenized BridgePay/MPI card via `mpiCardPayment` / `mpiCardPaymentTest`.
//  * 4. `useProcessNmiPayment` - Charges tokenized NMI card via `NMI_Payment/makePayment`.
//  * 5. `useFinalizeOrder` - Records completed order (`Common/AddToCart`) and issues official receipt (`Common/updateTransactionStatus`).
//  *
//  */

// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { apiClient } from '../../../api/client';
// import { ENV_CONFIG } from '../../../config/envConfig';
// import { ENDPOINTS } from '../../../constants/apiConstants';
// import { useAuthStore } from '../../../store/useAuthStore';
// import { useCartStore } from '../../../store/useCartStore';

// /**
//  * Formats current local date (MM/DD/YYYY) and time (hh:mm AM/PM) for MongoDB records.
//  *
//  * @returns {{ cartCreDate: string, cartCreTime: string }}
//  */
// const getFormattedCartTimestamp = () => {
//     const now = new Date();
//     const cartCreDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
//     const hours = now.getHours();
//     const minutes = String(now.getMinutes()).padStart(2, '0');
//     const ampm = hours >= 12 ? 'PM' : 'AM';
//     const cartCreTime = `${String(hours % 12 || 12).padStart(2, '0')}:${minutes} ${ampm}`;

//     return { cartCreDate, cartCreTime };
// };

// /**
//  * Normalizes cart items (including membership-discounted prices) into the server line-item contract.
//  *
//  * @param {Array<Object>} items
//  * @returns {Array<Object>}
//  */
// export const transformCartItemsForServer = (items) => {
//     if (!Array.isArray(items)) return [];

//     const { cartCreDate, cartCreTime } = getFormattedCartTimestamp();

//     return items.map((item) => {
//         const isDonationItem = String(
//             item.itemType || item.serviceCategoryTypes || item.category || ''
//         )
//             .toUpperCase()
//             .includes('DONATION');
//         const qty = isDonationItem ? 0 : Math.max(1, Number(item.quantity || 1));
//         const originalUnit = Number(item.oldServiceAmount ?? item.originalUnitPrice ?? item.amount ?? 0);
//         const unitDiscount = Number(item.discountedAmount ?? 0);
//         const finalUnit = Number(
//             item.unitPrice !== undefined ? item.unitPrice : Math.max(0, originalUnit - unitDiscount)
//         );

//         return {
//             _id: item.id || item._id || '',
//             ServiceId: item.serviceId || item.id || item._id || '',
//             serviceName: item.refDataName || item.title || item.name || '',
//             serviceCategory: item.serviceCategoryTypes || item.category || '',
//             serviceType: item.serviceTypes || '',
//             serviceAmount: finalUnit,
//             startDate: item.startDate || (Array.isArray(item.selectedDates) ? item.selectedDates[0] || '' : ''),
//             qty,
//             time: item.time || item.selectedTime || item.startTime || '',
//             startTime: item.startTime || item.selectedTime || item.time || '',
//             endTime: item.endTime || '',
//             bookingType: item.bookingType || item.bookingTypes || item.selectedTierKey || '',
//             serviceAddress: item.serviceAddress || '',
//             day: item?.dayTypes || '',
//             cartCreDate,
//             cartCreTime,
//             isServicePaid: item.isServicePaid ? 1 : 0,
//             serviceDesc: item.description || '',
//             serviceOccurrencesNo: item.occurrences || 1,
//             oldServiceAmount: originalUnit,
//             discountedAmount: unitDiscount,
//             fullPackage: item.fullPackage ? 1 : 0,
//             BookingLimitPerDay: Number(item.bookingLimitPerDay || item.BookingLimitPerDay || 0),
//         };
//     });
// };

// export const useCheckSareeAvailability = () => {
//     return useMutation({
//         mutationFn: async ({ name = 'saree' } = {}, { signal } = {}) => {
//             const response = await apiClient.post(
//                 ENDPOINTS.CHECK_SAREE_AVAILABILITY,
//                 { name },
//                 { signal }
//             );
//             return response?.data || response;
//         },
//     });
// };

// export const useAddServiceCartTemp = () => {
//     const user = useAuthStore((state) => state.user);

//     return useMutation({
//         mutationFn: async ({ invoiceNum, totalAmount, cartItems, eventDetail = {}, serviceDetail = {} }, { signal } = {}) => {
//             const formattedCardData = transformCartItemsForServer(cartItems);
//             const { cartCreDate, cartCreTime } = getFormattedCartTimestamp();

//             const memberId = user?._id || user?.id || user?.memberId || '';
//             const memberName = user?.refDataName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Devotee';
//             const prsnEmail = user?.email || '';
//             const prsnPhone = user?.phone || '';

//             const payload = {
//                 cardData: formattedCardData,
//                 eventDetail,
//                 serviceDetail,
//                 Paymenttype: 'CREDIT CARD',
//                 InvNumber: String(invoiceNum),
//                 totalAmount: Number(totalAmount),
//                 TerminalId: 'WEBSITE',
//                 clientId: ENV_CONFIG.CLIENT_ID,
//                 productId: ENV_CONFIG.PRODUCT_ID,
//                 paymentSource: 'MPI_CARD_NOT_PRESENT',
//                 Source: 'WEBSITE',
//                 cartCreDate,
//                 cartCreTime,
//                 remark: `WEBSITE~WEBSITE~${memberId}`,
//                 memberId,
//                 memberName,
//                 prsnEmail,
//                 prsnPhone,
//             };

//             const response = await apiClient.post(
//                 ENDPOINTS.ADD_SERVICE_CART_TEMP,
//                 payload,
//                 { signal }
//             );

//             return response?.data || response;
//         },
//     });
// };

// export const useProcessMpiPayment = () => {
//     return useMutation({
//         mutationFn: async ({ token, totalAmount, name, address = '', zipcode, invoiceNum, isTest = true }, { signal } = {}) => {
//             const roundedAmount = Math.round((Number(totalAmount) || 0) * 100) / 100;
//             const amountInCents = Math.round(roundedAmount * 100);
//             const endpoint = isTest ? ENDPOINTS.MPI_CARD_PAYMENT_TEST : ENDPOINTS.MPI_CARD_PAYMENT_LIVE;

//             const payload = {
//                 token,
//                 amount: isTest ? 500 : amountInCents,
//                 name: String(name || '').trim(),
//                 address: String(address || '').trim(),
//                 zipcode: String(zipcode || '').trim(),
//                 clientId: ENV_CONFIG.CLIENT_ID,
//                 InvoiceNum: invoiceNum || Date.now(),
//             };

//             const response = await apiClient.post(endpoint, payload, { signal });
//             return response?.data || response;
//         },
//     });
// };

// export const useProcessNmiPayment = () => {
//     return useMutation({
//         mutationFn: async ({ token, totalAmount, name, email, zipcode, cartItems }, { signal } = {}) => {
//             const formattedCardData = transformCartItemsForServer(cartItems);

//             const payload = {
//                 token,
//                 totolAmt: Number(totalAmount),
//                 name: String(name || '').trim(),
//                 email: String(email || '').trim(),
//                 zipcode: String(zipcode || '').trim(),
//                 clientId: ENV_CONFIG.CLIENT_ID,
//                 cart_data: formattedCardData,
//             };

//             const response = await apiClient.post(ENDPOINTS.NMI_MAKE_PAYMENT, payload, { signal });
//             return response?.data || response;
//         },
//     });
// };

// const mapItemTypeToCartCategory = (itemType) => {
//     const type = String(itemType || 'SERVICE').trim().toUpperCase();
//     if (type === 'SPONSORSHIP') return 'sponsorship';
//     if (type === 'DONATION') return 'donation';
//     if (type === 'EVENT') return 'event';
//     if (type === 'SAREE') return 'saree';
//     if (type.includes('FACILITY') || type === 'RENTAL' || type === 'RENTALS') return 'facilities';
//     return 'services';
// };

// export const useFinalizeOrder = () => {
//     const queryClient = useQueryClient();
//     const clearCart = useCartStore((state) => state.clearCart);
//     const user = useAuthStore((state) => state.user);

//     return useMutation({
//         mutationFn: async (
//             {
//                 status,
//                 paymentSource,
//                 acharyaSambhavana = 0,
//                 generalDonation = 0,
//                 totalPrice,
//                 mpiInvNumber,
//                 transactionId,
//                 cartItems = [],
//                 eventDetail = {},
//                 serviceDetail = {}
//             },
//             { signal } = {}
//         ) => {
//             const { cartCreDate, cartCreTime } = getFormattedCartTimestamp();

//             const memberId = user?._id || user?.id || user?.memberId || '';
//             const memberName =
//                 user?.refDataName ||
//                 `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
//                 'Devotee';
//             const prsnEmail = user?.email || '';
//             const prsnPhone = user?.phone || '';

//             const normalizedData = transformCartItemsForServer(cartItems).map((srvItem, idx) => ({
//                 ...srvItem,
//                 serviceAmount: String(srvItem.serviceAmount ?? 0),
//                 oldServiceAmount: String(srvItem.oldServiceAmount ?? srvItem.serviceAmount ?? 0),
//                 discountedAmount: Number(srvItem.discountedAmount ?? 0),
//                 cartCategory: mapItemTypeToCartCategory(cartItems[idx]?.itemType),
//             }));

//             // Step 1: Record Completed Order via `api/bookingService/addServiceCart`
//             const addServiceCartPayload = {
//                 productId: ENV_CONFIG.PRODUCT_ID,
//                 clientId: ENV_CONFIG.CLIENT_ID,
//                 memberId,
//                 memberName,
//                 prsnEmail,
//                 prsnPhone,
//                 data: normalizedData,
//                 eventDetail: eventDetail || {},
//                 serviceDetail: serviceDetail || {},
//                 paymentType: 'CREDIT CARD',
//                 paymentSource,
//                 etKitchenTIp: '0',
//                 attemptType: status,
//                 cartCreDate,
//                 cartCreTime,
//                 bankName: '',
//                 chequeNo: '',
//                 chequeAmount: '',
//                 chequeDate: '',
//                 acharyasanbhavana: Number(acharyaSambhavana || 0),
//                 generaldonations: Number(generalDonation || 0),
//                 mpiInvNumber: String(mpiInvNumber),
//                 totalAmount: Number(totalPrice),
//                 transactionId: String(transactionId || ''),
//                 paymentStatus: status,
//                 source: 'WEBSITE',
//                 creditCardRemark: '',
//             };

//             const addToCartResponse = await apiClient.post(
//                 ENDPOINTS.ADD_TO_CART,
//                 addServiceCartPayload,
//                 { signal }
//             );
//             const unpackedAddToCart = addToCartResponse?.data || addToCartResponse;
//             const cartRecord = Array.isArray(unpackedAddToCart)
//                 ? unpackedAddToCart[0]
//                 : unpackedAddToCart;

//             console.log("ADD_TO_CART Response Full Object:", unpackedAddToCart);

//             // Step 2: Finalize Transaction Status & Issue Official Invoice
//             // const updateStatusPayload = {
//             //     status,
//             //     transactionId: transactionId,
//             //     paymentDescription,
//             // };

//             const updateStatusPayload = {
//                 productId: ENV_CONFIG.PRODUCT_ID,
//                 clientId: ENV_CONFIG.CLIENT_ID,
//                 _id: cartRecord?._id || cartRecord?.id || '',
//                 invoiceNo: String(cartRecord?.invoiceNo || mpiInvNumber),
//                 paymentStatus: status,
//                 transactionId: transactionId,
//             };

//             const updateStatusResponse = await apiClient.post(
//                 ENDPOINTS.UPDATE_TRANSACTION_STATUS,
//                 updateStatusPayload,
//                 { signal, pre: false }
//             );
//             const unpackedStatus = updateStatusResponse?.data || updateStatusResponse;

//             return {
//                 addToCart: unpackedAddToCart,
//                 transactionStatus: unpackedStatus,
//                 invoiceNo: unpackedStatus?.envoiceNo || unpackedStatus?.invoiceNo || mpiInvNumber,
//             };
//         },
//         onSuccess: (_, variables) => {
//             if (variables.status === 'COMPLETED') {
//                 if (!variables.skipCartClear) {
//                     clearCart();
//                 }
//                 queryClient.invalidateQueries({ queryKey: ['cartSession'] });
//                 queryClient.invalidateQueries({ queryKey: ['devoteeBookings'] });
//                 queryClient.invalidateQueries({ queryKey: ['cumulativeAmount'] });
//                 queryClient.invalidateQueries({ queryKey: ['devoteeDetails'] });
//             }
//         },
//     });
// };

// export const useFinalizeFacilityOrder = () => {
//     const queryClient = useQueryClient();
//     const user = useAuthStore((state) => state.user);

//     return useMutation({
//         mutationFn: async (
//             {
//                 status = 'COMPLETED',
//                 acharyaSambhavana = 0,
//                 generalDonation = 0,
//                 totalPrice = 0,
//                 securityDeposit = 0,
//                 mpiInvNumber = '',
//                 transactionId = '',
//                 cartItems = [],
//                 eventDetail = {},
//                 serviceDetail = {},
//             },
//             { signal } = {}
//         ) => {
//             const { cartCreDate, cartCreTime } = getFormattedCartTimestamp();

//             const memberId = user?._id || user?.id || user?.memberId || '';
//             const memberName =
//                 user?.refDataName ||
//                 `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
//                 'Devotee';
//             const prsnEmail = user?.email || '';
//             const prsnPhone = user?.phone || '';

//             const formattedRentals = (Array.isArray(cartItems) ? cartItems : []).map((item) => {
//                 const rawQty = Math.max(1, Number(item.quantity || item.qty || 1));
//                 const originalUnit = Number(
//                     item.oldServiceAmount ?? item.originalUnitPrice ?? item.amount ?? 0
//                 );
//                 const unitDiscount = Number(item.discountedAmount ?? 0);
//                 const finalUnit = Number(
//                     item.unitPrice !== undefined
//                         ? item.unitPrice
//                         : Math.max(0, originalUnit - unitDiscount)
//                 );

//                 const formattedFinal = finalUnit.toFixed(2);
//                 const formattedOld = originalUnit.toFixed(2);
//                 const hasStartDate = Boolean(item.startDate);
//                 const hasTimeWindow = Boolean(item.startTime || item.endTime);

//                 return {
//                     _id: String(item.id || item._id || ''),
//                     ServiceId: String(item.serviceId || item.id || item._id || ''),
//                     serviceName: String(item.refDataName || item.title || item.name || ''),
//                     serviceCategory: String(item.serviceCategoryTypes || item.category || 'FACILITIES'),
//                     serviceType: String(item.serviceTypes || 'RENTALS'),
//                     serviceAmount: formattedFinal,
//                     costPerDay: formattedFinal,
//                     startDate: hasStartDate ? String(item.startDate) : null,
//                     qty: String(rawQty),
//                     time: null,
//                     day: String(item.dayTypes || ''),
//                     bookingTypes: String(
//                         item.bookingTypes || item.bookingType || item.selectedTierKey || ''
//                     ),
//                     oldServiceAmount: formattedOld,
//                     discountedAmount: unitDiscount,
//                     couponCode: '',
//                     couponId: '',
//                     startTime: hasTimeWindow ? String(item.startTime || item.time || '') : null,
//                     endTime: hasTimeWindow ? String(item.endTime || '') : null,
//                 };
//             });

//             const addRentalPayload = {
//                 productId: ENV_CONFIG.PRODUCT_ID,
//                 clientId: ENV_CONFIG.CLIENT_ID,
//                 memberId,
//                 memberName,
//                 prsnEmail,
//                 prsnPhone,
//                 eventDetail: eventDetail || {},
//                 serviceDetail: serviceDetail || {},
//                 deliveryDetails: {},
//                 deliveryTime: '',
//                 paymentType: 'CREDIT CARD',
//                 deliveryDate: '',
//                 delivery: '',
//                 etKitchenTIp: '',
//                 pickupTime: '',
//                 bankName: '',
//                 chequeNo: '',
//                 chequeAmount: '',
//                 chequeDate: '',
//                 source: 'WEBSITE',
//                 totalAmount: Number(totalPrice || 0),
//                 securityDeposit: Number(securityDeposit || 0),
//                 transactionId: String(transactionId || ''),
//                 stationName: '',
//                 stationId: '',
//                 userId: memberName,
//                 data: formattedRentals,
//                 cartCreDate,
//                 cartCreTime,
//                 serviceImage: '',
//                 serviceName: '',
//                 serviceCategory: '',
//                 serviceType: '',
//                 qty: '',
//                 startTime: '',
//                 endTime: '',
//                 uniteType: '',
//                 costPerUnitType: '',
//                 serviceAmount: '',
//                 userName: '',
//                 beneName: '',
//                 acharyasanbhavana: Number(acharyaSambhavana || 0),
//                 generaldonations: Number(generalDonation || 0),
//                 bookingType: 'BOOKING WITH PAYMENT',
//                 paymentStatus: status,
//                 mpiInvNumber: String(mpiInvNumber || ''),
//             };

//             const response = await apiClient.post(
//                 ENDPOINTS.ADD_RENTAL_SERVICE_CART,
//                 addRentalPayload,
//                 { signal }
//             );

//             const unpacked = response?.data || response;
//             const record = Array.isArray(unpacked?.data)
//                 ? unpacked.data[0]
//                 : Array.isArray(unpacked)
//                     ? unpacked[0]
//                     : unpacked;

//             return {
//                 addToCart: unpacked,
//                 invoiceNo: record?.invoiceNo || mpiInvNumber,
//             };
//         },
//         onSuccess: (_, variables) => {
//             if (variables.status === 'COMPLETED') {
//                 queryClient.invalidateQueries({ queryKey: ['devoteeBookings'] });
//                 queryClient.invalidateQueries({ queryKey: ['cumulativeAmount'] });
//                 queryClient.invalidateQueries({ queryKey: ['devoteeDetails'] });
//             }
//         },
//     });
// };

// export const useRemoveExpiredServices = () => {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: async ({ expireServices = [] }, { signal } = {}) => {
//             const response = await apiClient.post(
//                 ENDPOINTS.REMOVE_EXPIRED_SERVICES,
//                 { expireServices },
//                 { signal }
//             );
//             return response?.data || response;
//         },
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ['cartSession'] });
//         },
//     });
// };

// export const useCheckout = () => {
//     const checkSaree = useCheckSareeAvailability();
//     const addTempCart = useAddServiceCartTemp();
//     const processMpi = useProcessMpiPayment();
//     const processNmi = useProcessNmiPayment();
//     const finalizeOrder = useFinalizeOrder();
//     const finalizeFacilityOrder = useFinalizeFacilityOrder();
//     const removeExpired = useRemoveExpiredServices();

//     const isProcessing =
//         checkSaree.isPending ||
//         addTempCart.isPending ||
//         processMpi.isPending ||
//         processNmi.isPending ||
//         finalizeOrder.isPending ||
//         finalizeFacilityOrder.isPending ||
//         removeExpired.isPending;

//     return {
//         checkSareeAvailability: checkSaree.mutateAsync,
//         addServiceCartTemp: addTempCart.mutateAsync,
//         processMpiPayment: processMpi.mutateAsync,
//         processNmiPayment: processNmi.mutateAsync,
//         finalizeOrder: finalizeOrder.mutateAsync,
//         finalizeFacilityOrder: finalizeFacilityOrder.mutateAsync,
//         removeExpiredServices: removeExpired.mutateAsync,
//         isProcessing,
//         errors: {
//             sareeError: checkSaree.error,
//             tempCartError: addTempCart.error,
//             mpiError: processMpi.error,
//             nmiError: processNmi.error,
//             finalizeError: finalizeOrder.error || finalizeFacilityOrder.error,
//         },
//     };
// };

// export default useCheckout;


/**
 * @file src/hooks/queries/Checkout/checkoutApi.js
 * @description Centralized TanStack Query mutations for the Checkout & Payment pipeline:
 * 1. `useCheckSareeAvailability` - Verifies deity saree slot availability.
 * 2. `useAddServiceCartTemp` - Locks temporary cart reservation in MongoDB.
 * 3. `useProcessMpiPayment` - Charges tokenized BridgePay/MPI card via `mpiCardPayment` / `mpiCardPaymentTest`.
 * 4. `useProcessNmiPayment` - Charges tokenized NMI card via `NMI_Payment/makePayment`.
 * 5. `useFinalizeOrder` - Records completed order (`Common/AddToCart`) and issues official receipt (`Common/updateTransactionStatus`).
 * 6. `useFinalizeFacilityOrder` - Records completed facility rental order (`addRentalServiceCart`).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENV_CONFIG } from '../../../config/envConfig';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { useAuthStore } from '../../../store/useAuthStore';
import { useCartStore } from '../../../store/useCartStore';

/**
 * Formats current local date (MM/DD/YYYY) and time (hh:mm AM/PM) for MongoDB records.
 *
 * @returns {{ cartCreDate: string, cartCreTime: string }}
 */
const getFormattedCartTimestamp = () => {
    const now = new Date();
    const cartCreDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const cartCreTime = `${String(hours % 12 || 12).padStart(2, '0')}:${minutes} ${ampm}`;

    return { cartCreDate, cartCreTime };
};

/**
 * Normalizes cart items (including membership-discounted prices) into the server line-item contract.
 *
 * @param {Array<Object>} items
 * @returns {Array<Object>}
 */
export const transformCartItemsForServer = (items) => {
    if (!Array.isArray(items)) return [];

    const { cartCreDate, cartCreTime } = getFormattedCartTimestamp();

    return items.map((item) => {
        const isDonationItem = String(
            item.itemType || item.serviceCategoryTypes || item.category || ''
        )
            .toUpperCase()
            .includes('DONATION');
        const qty = isDonationItem ? 0 : Math.max(1, Number(item.quantity || 1));
        const originalUnit = Number(item.oldServiceAmount ?? item.originalUnitPrice ?? item.amount ?? 0);
        const unitDiscount = Number(item.discountedAmount ?? 0);
        const finalUnit = Number(
            item.unitPrice !== undefined ? item.unitPrice : Math.max(0, originalUnit - unitDiscount)
        );

        return {
            _id: item.id || item._id || '',
            ServiceId: item.serviceId || item.id || item._id || '',
            serviceName: item.refDataName || item.title || item.name || '',
            serviceCategory: item.serviceCategoryTypes || item.category || '',
            serviceType: item.serviceTypes || '',
            serviceAmount: finalUnit,
            startDate: item.startDate || (Array.isArray(item.selectedDates) ? item.selectedDates[0] || '' : ''),
            qty,
            time: item.time || item.selectedTime || item.startTime || '',
            startTime: item.startTime || item.selectedTime || item.time || '',
            endTime: item.endTime || '',
            bookingType: item.bookingType || item.bookingTypes || item.selectedTierKey || '',
            serviceAddress: item.serviceAddress || '',
            day: item?.dayTypes || '',
            cartCreDate,
            cartCreTime,
            isServicePaid: item.isServicePaid ? 1 : 0,
            serviceDesc: item.description || '',
            serviceOccurrencesNo: item.occurrences || 1,
            oldServiceAmount: originalUnit,
            discountedAmount: unitDiscount,
            fullPackage: item.fullPackage ? 1 : 0,
            BookingLimitPerDay: Number(item.bookingLimitPerDay || item.BookingLimitPerDay || 0),
        };
    });
};

export const useCheckSareeAvailability = () => {
    return useMutation({
        mutationFn: async ({ name = 'saree' } = {}, { signal } = {}) => {
            const response = await apiClient.post(
                ENDPOINTS.CHECK_SAREE_AVAILABILITY,
                { name },
                { signal }
            );
            return response?.data || response;
        },
    });
};

export const useAddServiceCartTemp = () => {
    const user = useAuthStore((state) => state.user);

    return useMutation({
        mutationFn: async ({ invoiceNum, totalAmount, cartItems, eventDetail = {}, serviceDetail = {} }, { signal } = {}) => {
            const formattedCardData = transformCartItemsForServer(cartItems);
            const { cartCreDate, cartCreTime } = getFormattedCartTimestamp();

            const memberId = user?._id || user?.id || user?.memberId || '';
            const memberName = user?.refDataName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Devotee';
            const prsnEmail = user?.email || '';
            const prsnPhone = user?.phone || '';

            const payload = {
                cardData: formattedCardData,
                eventDetail,
                serviceDetail,
                Paymenttype: 'CREDIT CARD',
                InvNumber: String(invoiceNum),
                totalAmount: Number(totalAmount),
                TerminalId: 'WEBSITE',
                clientId: ENV_CONFIG.CLIENT_ID,
                productId: ENV_CONFIG.PRODUCT_ID,
                paymentSource: 'MPI_CARD_NOT_PRESENT',
                Source: 'WEBSITE',
                cartCreDate,
                cartCreTime,
                remark: `WEBSITE~WEBSITE~${memberId}`,
                memberId,
                memberName,
                prsnEmail,
                prsnPhone,
            };

            const response = await apiClient.post(
                ENDPOINTS.ADD_SERVICE_CART_TEMP,
                payload,
                { signal }
            );

            return response?.data || response;
        },
    });
};

export const useProcessMpiPayment = () => {
    return useMutation({
        mutationFn: async ({ token, totalAmount, name, address = '', zipcode, invoiceNum, isTest = true }, { signal } = {}) => {
            const roundedAmount = Math.round((Number(totalAmount) || 0) * 100) / 100;
            const amountInCents = Math.round(roundedAmount * 100);
            const endpoint = isTest ? ENDPOINTS.MPI_CARD_PAYMENT_TEST : ENDPOINTS.MPI_CARD_PAYMENT_LIVE;

            const payload = {
                token,
                amount: isTest ? 500 : amountInCents,
                name: String(name || '').trim(),
                address: String(address || '').trim(),
                zipcode: String(zipcode || '').trim(),
                clientId: ENV_CONFIG.CLIENT_ID,
                InvoiceNum: String(invoiceNum || Date.now()),
            };

            const response = await apiClient.post(endpoint, payload, { signal });
            return response?.data || response;
        },
    });
};

export const useProcessNmiPayment = () => {
    return useMutation({
        mutationFn: async ({ token, totalAmount, name, email, zipcode, cartItems }, { signal } = {}) => {
            const formattedCardData = transformCartItemsForServer(cartItems);

            const payload = {
                token,
                totolAmt: Number(totalAmount),
                name: String(name || '').trim(),
                email: String(email || '').trim(),
                zipcode: String(zipcode || '').trim(),
                clientId: ENV_CONFIG.CLIENT_ID,
                cart_data: formattedCardData,
            };

            const response = await apiClient.post(ENDPOINTS.NMI_MAKE_PAYMENT, payload, { signal });
            return response?.data || response;
        },
    });
};

const mapItemTypeToCartCategory = (itemType) => {
    const type = String(itemType || 'SERVICE').trim().toUpperCase();
    if (type === 'SPONSORSHIP') return 'sponsorship';
    if (type === 'DONATION') return 'donation';
    if (type === 'EVENT') return 'event';
    if (type === 'SAREE') return 'saree';
    if (type.includes('FACILITY') || type === 'RENTAL' || type === 'RENTALS') return 'facilities';
    return 'services';
};

export const useFinalizeOrder = () => {
    // const queryClient = useQueryClient();
    const clearCart = useCartStore((state) => state.clearCart);
    const user = useAuthStore((state) => state.user);

    return useMutation({
        mutationFn: async (
            {
                status,
                paymentSource,
                acharyaSambhavana = 0,
                generalDonation = 0,
                totalPrice,
                mpiInvNumber,
                transactionId,
                cartItems = [],
                eventDetail = {},
            },
            { signal } = {}
        ) => {
            const { cartCreDate, cartCreTime } = getFormattedCartTimestamp();

            const memberId = user?._id || user?.id || user?.memberId || '';
            const memberName =
                user?.refDataName ||
                `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                'Devotee';
            const prsnEmail = user?.email || '';
            const prsnPhone = user?.phone || '';

            const normalizedData = transformCartItemsForServer(cartItems).map((srvItem, idx) => ({
                ...srvItem,
                serviceAmount: String(srvItem.serviceAmount ?? 0),
                oldServiceAmount: String(srvItem.oldServiceAmount ?? srvItem.serviceAmount ?? 0),
                discountedAmount: Number(srvItem.discountedAmount ?? 0),
                cartCategory: mapItemTypeToCartCategory(cartItems[idx]?.itemType),
            }));

            // Step 1: Record Completed Order via `api/bookingService/addServiceCart`
            const addServiceCartPayload = {
                productId: ENV_CONFIG.PRODUCT_ID,
                clientId: ENV_CONFIG.CLIENT_ID,
                memberId,
                memberName,
                prsnEmail,
                prsnPhone,
                data: normalizedData,
                eventDetail: eventDetail || {},
                // serviceDetail: serviceDetail || {},
                paymentType: 'CREDIT CARD',
                paymentSource,
                etKitchenTIp: '0',
                attemptType: status,
                cartCreDate,
                cartCreTime,
                bankName: '',
                chequeNo: '',
                chequeAmount: '',
                chequeDate: '',
                acharyasanbhavana: Number(acharyaSambhavana || 0),
                generaldonations: Number(generalDonation || 0),
                mpiInvNumber: String(mpiInvNumber),
                totalAmount: Number(totalPrice),
                transactionId: String(transactionId || ''),
                paymentStatus: status,
                source: 'WEBSITE',
                creditCardRemark: '',
            };

            const addToCartResponse = await apiClient.post(
                ENDPOINTS.ADD_TO_CART,
                addServiceCartPayload,
                { signal }
            );
            const unpackedAddToCart = addToCartResponse?.data || addToCartResponse;
            const cartRecord = Array.isArray(unpackedAddToCart)
                ? unpackedAddToCart[0]
                : unpackedAddToCart;

            // Step 2: Finalize Transaction Status & Issue Official Invoice
            const updateStatusPayload = {
                productId: ENV_CONFIG.PRODUCT_ID,
                clientId: ENV_CONFIG.CLIENT_ID,
                _id: cartRecord?._id || cartRecord?.id || '',
                invoiceNo: String(cartRecord?.invoiceNo || mpiInvNumber),
                paymentStatus: status,
                transactionId: transactionId,
            };

            const updateStatusResponse = await apiClient.post(
                ENDPOINTS.UPDATE_TRANSACTION_STATUS,
                updateStatusPayload,
                { signal, pre: false }
            );
            const unpackedStatus = updateStatusResponse?.data || updateStatusResponse;

            return {
                addToCart: unpackedAddToCart,
                transactionStatus: unpackedStatus,
                invoiceNo: unpackedStatus?.envoiceNo || unpackedStatus?.invoiceNo || mpiInvNumber,
            };
        },
        onSuccess: (_, variables) => {
            if (variables.status === 'COMPLETED') {
                if (!variables.skipCartClear) {
                    clearCart();
                }
                // queryClient.invalidateQueries({ queryKey: ['cartSession'] });
                // queryClient.invalidateQueries({ queryKey: ['devoteeBookings'] });
                // queryClient.invalidateQueries({ queryKey: ['cumulativeAmount'] });
                // queryClient.invalidateQueries({ queryKey: ['devoteeDetails'] });
            }
        },
    });
};

export const useFinalizeFacilityOrder = () => {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);

    return useMutation({
        mutationFn: async (
            {
                status = 'COMPLETED',
                acharyaSambhavana = 0,
                generalDonation = 0,
                totalPrice = 0,
                securityDeposit = 0,
                mpiInvNumber = '',
                transactionId = '',
                cartItems = [],
                eventDetail = {},
                serviceDetail = {},
            },
            { signal } = {}
        ) => {
            const { cartCreDate, cartCreTime } = getFormattedCartTimestamp();

            const memberId = user?._id || user?.id || user?.memberId || '';
            const memberName =
                user?.refDataName ||
                `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                'Devotee';
            const prsnEmail = user?.email || '';
            const prsnPhone = user?.phone || '';

            const formattedRentals = (Array.isArray(cartItems) ? cartItems : []).map((item) => {
                const rawQty = Math.max(1, Number(item.quantity || item.qty || 1));
                const originalUnit = Number(
                    item.oldServiceAmount ?? item.originalUnitPrice ?? item.amount ?? 0
                );
                const unitDiscount = Number(item.discountedAmount ?? 0);
                const finalUnit = Number(
                    item.unitPrice !== undefined
                        ? item.unitPrice
                        : Math.max(0, originalUnit - unitDiscount)
                );

                const formattedFinal = finalUnit.toFixed(2);
                const formattedOld = originalUnit.toFixed(2);
                const hasStartDate = Boolean(item.startDate);
                const hasTimeWindow = Boolean(item.startTime || item.endTime);

                return {
                    _id: String(item.id || item._id || ''),
                    ServiceId: String(item.serviceId || item.id || item._id || ''),
                    serviceName: String(item.refDataName || item.title || item.name || ''),
                    serviceCategory: String(item.serviceCategoryTypes || item.category || 'FACILITIES'),
                    serviceType: String(item.serviceTypes || 'RENTALS'),
                    serviceAmount: formattedFinal,
                    costPerDay: formattedFinal,
                    startDate: hasStartDate ? String(item.startDate) : null,
                    qty: String(rawQty),
                    time: null,
                    day: String(item.dayTypes || ''),
                    bookingTypes: String(
                        item.bookingTypes || item.bookingType || item.selectedTierKey || ''
                    ),
                    oldServiceAmount: formattedOld,
                    discountedAmount: unitDiscount,
                    couponCode: '',
                    couponId: '',
                    startTime: hasTimeWindow ? String(item.startTime || item.time || '') : null,
                    endTime: hasTimeWindow ? String(item.endTime || '') : null,
                };
            });

            const addRentalPayload = {
                productId: ENV_CONFIG.PRODUCT_ID,
                clientId: ENV_CONFIG.CLIENT_ID,
                memberId,
                memberName,
                prsnEmail,
                prsnPhone,
                eventDetail: eventDetail || {},
                serviceDetail: serviceDetail || {},
                deliveryDetails: {},
                deliveryTime: '',
                paymentType: 'CREDIT CARD',
                deliveryDate: '',
                delivery: '',
                etKitchenTIp: '',
                pickupTime: '',
                bankName: '',
                chequeNo: '',
                chequeAmount: '',
                chequeDate: '',
                source: 'WEBSITE',
                totalAmount: Number(totalPrice || 0),
                securityDeposit: Number(securityDeposit || 0),
                transactionId: String(transactionId || ''),
                stationName: '',
                stationId: '',
                userId: memberName,
                data: formattedRentals,
                cartCreDate,
                cartCreTime,
                serviceImage: '',
                serviceName: '',
                serviceCategory: '',
                serviceType: '',
                qty: '',
                startTime: '',
                endTime: '',
                uniteType: '',
                costPerUnitType: '',
                serviceAmount: '',
                userName: '',
                beneName: '',
                acharyasanbhavana: Number(acharyaSambhavana || 0),
                generaldonations: Number(generalDonation || 0),
                bookingType: 'BOOKING WITH PAYMENT',
                paymentStatus: status,
                mpiInvNumber: String(mpiInvNumber || ''),
            };

            const response = await apiClient.post(
                ENDPOINTS.ADD_RENTAL_SERVICE_CART,
                addRentalPayload,
                { signal }
            );

            const unpacked = response?.data || response;
            const record = Array.isArray(unpacked?.data)
                ? unpacked.data[0]
                : Array.isArray(unpacked)
                    ? unpacked[0]
                    : unpacked;

            return {
                addToCart: unpacked,
                invoiceNo: record?.invoiceNo || mpiInvNumber,
            };
        },
        onSuccess: (_, variables) => {
            if (variables.status === 'COMPLETED') {
                queryClient.invalidateQueries({ queryKey: ['devoteeBookings'] });
                // queryClient.invalidateQueries({ queryKey: ['cumulativeAmount'] });
                // queryClient.invalidateQueries({ queryKey: ['devoteeDetails'] });
            }
        },
    });
};

export const useRemoveExpiredServices = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ expireServices = [] }, { signal } = {}) => {
            const response = await apiClient.post(
                ENDPOINTS.REMOVE_EXPIRED_SERVICES,
                { expireServices },
                { signal }
            );
            return response?.data || response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cartSession'] });
        },
    });
};

export const useCheckout = () => {
    const checkSaree = useCheckSareeAvailability();
    const addTempCart = useAddServiceCartTemp();
    const processMpi = useProcessMpiPayment();
    const processNmi = useProcessNmiPayment();
    const finalizeOrder = useFinalizeOrder();
    const finalizeFacilityOrder = useFinalizeFacilityOrder();
    const removeExpired = useRemoveExpiredServices();

    const isProcessing =
        checkSaree.isPending ||
        addTempCart.isPending ||
        processMpi.isPending ||
        processNmi.isPending ||
        finalizeOrder.isPending ||
        finalizeFacilityOrder.isPending ||
        removeExpired.isPending;

    return {
        checkSareeAvailability: checkSaree.mutateAsync,
        addServiceCartTemp: addTempCart.mutateAsync,
        processMpiPayment: processMpi.mutateAsync,
        processNmiPayment: processNmi.mutateAsync,
        finalizeOrder: finalizeOrder.mutateAsync,
        finalizeFacilityOrder: finalizeFacilityOrder.mutateAsync,
        removeExpiredServices: removeExpired.mutateAsync,
        isProcessing,
        errors: {
            sareeError: checkSaree.error,
            tempCartError: addTempCart.error,
            mpiError: processMpi.error,
            nmiError: processNmi.error,
            finalizeError: finalizeOrder.error || finalizeFacilityOrder.error,
        },
    };
};

export default useCheckout;

