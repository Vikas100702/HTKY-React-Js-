import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../constants/apiConstants';
import { useAuthStore } from '../../../store/useAuthStore';
import { useCartStore } from '../../../store/useCartStore';



const transformCartItemsForServer = (items) => {
    if (!Array.isArray(items)) return [];

    const now = new Date();
    const cartCreDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const cartCreTime = `${String(hours % 12 || 12).padStart(2, '0')}:${minutes} ${ampm}`;

    return items.map(item => ({
        _id: item.id || '',
        ServiceId: item.id || '',
        serviceName: item.refDataName || '',
        serviceCategory: item.serviceCategoryTypes || '',
        serviceType: item.serviceTypes || '',
        serviceAmount: Number(item.amount || 0),
        startDate: item.startDate || '',
        qty: Number(item.quantity || 1),
        time: item.time || item.startTime || '',
        bookingType: item.bookingType || '',
        serviceAddress: item.serviceAddress || '',
        day: item?.dayTypes || '',
        cartCreDate,
        cartCreTime,
        isServicePaid: item.isServicePaid ? 1 : 0,
        serviceDesc: item.description || '',
        serviceOccurrencesNo: item.occurrences || 1,
        oldServiceAmount: Number(item.oldServiceAmount || item.amount || 0),
        discountedAmount: Number(item.discountedAmount || 0),
        fullPackage: item.fullPackage ? 1 : 0,
        BookingLimitPerDay: Number(item.bookingLimitPerDay || item.BookingLimitPerDay || 0),
    }));
};

export const useCheckSareeAvailability = () => {
    return useMutation({
        mutationFn: async ({ name = 'saree' } = {}, { signal }) => {
            const response = await apiClient.post(
                ENDPOINTS.CHECK_SAREE_AVAILABILITY,
                { name },
                { signal }
            );
            return response;
        },
    });
};

export const useAddServiceCartTemp = () => {
    const user = useAuthStore((state) => state.user);

    return useMutation({
        mutationFn: async ({ invoiceNum, totalAmount, cartItems, eventDetail = {}, serviceDetail = {} }, { signal }) => {
            const formattedCardData = transformCartItemsForServer(cartItems);

            const now = new Date();
            const cartCreDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
            const hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const cartCreTime = `${String(hours % 12 || 12).padStart(2, '0')}:${minutes} ${ampm}`;

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
                paymentSource: 'WEBSITE_ONLINE',
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

            return response;
        },
    });
};

export const useProcessMpiPayment = () => {
    return useMutation({
        mutationFn: async ({ token, totalAmount, name, address, zipcode, cartItems, isTest = false }, { signal }) => {
            const endpoint = isTest ? ENDPOINTS.MPI_PAY_NOW_TEST : ENDPOINTS.MPI_PAY_NOW;
            const formattedCardData = transformCartItemsForServer(cartItems);

            const payload = {
                token,
                totolAmt: Number(totalAmount),
                name: String(name || '').trim(),
                address: String(address || '').trim(),
                zipcode: String(zipcode || '').trim(),
                cart_data: formattedCardData,
            };

            const response = await apiClient.post(endpoint, payload, { signal });
            return response;
        },
    });
};

export const useProcessNmiPayment = () => {
    return useMutation({
        mutationFn: async ({ token, totalAmount, name, email, zipcode, cartItems }, { signal }) => {
            const formattedCardData = transformCartItemsForServer(cartItems);

            const payload = {
                token,
                totolAmt: Number(totalAmount),
                name: String(name || '').trim(),
                email: String(email || '').trim(),
                zipcode: String(zipcode || '').trim(),
                cart_data: formattedCardData,
            };

            const response = await apiClient.post(ENDPOINTS.NMI_MAKE_PAYMENT, payload, { signal });
            return response;
        },
    });
};

export const useFinalizeOrder = () => {
    const queryClient = useQueryClient();
    const clearCart = useCartStore((state) => state.clearCart);

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
                paymentDescription,
                cartItems = [],
            },
            { signal }
        ) => {
            const serviceItems = cartItems.filter((i) => !i.itemType || i.itemType === 'SERVICE');
            const sponsorItems = cartItems.filter((i) => i.itemType === 'SPONSORSHIP');
            const eventItems = cartItems.filter((i) => i.itemType === 'EVENT');
            const sareeItems = cartItems.filter((i) => i.itemType === 'SAREE');
            const donationItems = cartItems.filter((i) => i.itemType === 'DONATION');

            // Step 1: Record Order in AddToCart
            const addToCartPayload = {
                status,
                paymentSource,
                acharya_sambhavana: Number(acharyaSambhavana),
                general_donation: Number(generalDonation),
                totalPrice: Number(totalPrice),
                mpiInvNumber: String(mpiInvNumber),
                transaction_id: transactionId,
                service_cart_items: serviceItems,
                sponser_cart_items: sponsorItems,
                event_cart_items: eventItems,
                saree_cart_items: sareeItems,
                donation_cart_items: donationItems,
            };

            const addToCartResponse = await apiClient.post(
                ENDPOINTS.ADD_TO_CART,
                addToCartPayload,
                { signal }
            );

            // Step 2: Finalize Transaction Status & Issue Official Invoice
            const updateStatusPayload = {
                status,
                transaction_id: transactionId,
                paymentDescription,
            };

            const updateStatusResponse = await apiClient.post(
                ENDPOINTS.UPDATE_TRANSACTION_STATUS,
                updateStatusPayload,
                { signal }
            );

            return {
                addToCart: addToCartResponse,
                transactionStatus: updateStatusResponse,
                invoiceNo: updateStatusResponse?.envoiceNo || updateStatusResponse?.invoiceNo || mpiInvNumber,
            };
        },
        onSuccess: (data, variables) => {
            if (variables.status === 'COMPLETED') {
                clearCart();
                queryClient.invalidateQueries({ queryKey: ['cartSession'] });
                queryClient.invalidateQueries({ queryKey: ['devoteeBookings'] });
            }
        },
    });
};

export const useRemoveExpiredServices = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ expireServices = [] }, { signal }) => {
            const response = await apiClient.post(
                ENDPOINTS.REMOVE_EXPIRED_SERVICES,
                { expireServices },
                { signal }
            );
            return response;
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
    const removeExpired = useRemoveExpiredServices();

    const isProcessing =
        checkSaree.isPending ||
        addTempCart.isPending ||
        processMpi.isPending ||
        processNmi.isPending ||
        finalizeOrder.isPending ||
        removeExpired.isPending;

    return {
        checkSareeAvailability: checkSaree.mutateAsync,
        addServiceCartTemp: addTempCart.mutateAsync,
        processMpiPayment: processMpi.mutateAsync,
        processNmiPayment: processNmi.mutateAsync,
        finalizeOrder: finalizeOrder.mutateAsync,
        removeExpiredServices: removeExpired.mutateAsync,
        isProcessing,
        errors: {
            sareeError: checkSaree.error,
            tempCartError: addTempCart.error,
            mpiError: processMpi.error,
            nmiError: processNmi.error,
            finalizeError: finalizeOrder.error,
        },
    };
};

export default useCheckout;
