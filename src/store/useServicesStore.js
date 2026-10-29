import { create } from 'zustand';

export const useServicesStore = create((set, get) => ({
    selectedCategory: 'IN-TEMPLE',
    searchQuery: '',

    // Per-service lookup tables: serviceId -> value
    selectedDatesMap: {}, // serviceId -> Date[]
    selectedTimeMap: {}, // serviceId -> string ("10:30 AM")
    checkedCategoryMap: {}, // serviceId -> boolean
    categoryQuantitiesMap: {}, // serviceId -> number
    customAmountMap: {}, // serviceId -> number
    selectedDietyMap: {}, // serviceId -> string (Selected Deity Name)

    // Cache of selected service objects for persistent cart calculations
    cartItemsCache: {}, // serviceId -> { id, title, amount, qtyCounterEnabled }

    // Modal Stacking Locks (Rule #3)
    activeModal: null, // null | 'DATE_PICKER' | 'TIME_PICKER' | 'CHECKOUT'
    activeModalServiceId: null,
    activeToast: null, // null | { message, type, timestamp }

    /**
     * Mutex lock ensuring only one modal can exist in the DOM at any given moment.     
     */
    openModal: (modalType, serviceId = null) => {
        const { activeModal } = get();
        if (activeModal !== null) return false; // Prevent modal stacking
        set({ activeModal: modalType, activeModalServiceId: serviceId });
        return true;
    },

    /**
     * Releases active modal mutex lock.
     */
    closeModal: () => {
        set({ activeModal: null, activeModalServiceId: null });
    },

    showToast: (message, type = 'error') => {
        const { activeToast } = get();
        const now = Date.now();
        if (activeToast && activeToast.message === message && now - activeToast.timestamp < 2000) {
            return;
        }
        set({ activeToast: { message, type, timestamp: now } });
    },

    clearToast: () => set({ activeToast: null }),

    setSearchQuery: (query) => set({ searchQuery: String(query || '') }),

    setSelectedCategory: (categoryName) => set({ selectedCategory: String(categoryName || '') }),

    /**
     * Atomically updates checkbox state and maintains cart items cache.
     * Clears transient selections on uncheck to prevent memory bloat.
     */
    toggleCheckbox: (service, isChecked) =>
        set((state) => {
            const serviceKey = service.id;
            const currentQty = state.categoryQuantitiesMap[serviceKey] || 0;

            const nextCheckedMap = { ...state.checkedCategoryMap, [serviceKey]: isChecked };
            const nextQtyMap = {
                ...state.categoryQuantitiesMap,
                [serviceKey]: isChecked ? (currentQty < 1 ? 1 : currentQty) : 0,
            };

            const nextCache = { ...state.cartItemsCache };
            if (isChecked) {
                nextCache[serviceKey] = {
                    id: serviceKey,
                    title: service.title,
                    amount: Number(service.amount || 0),
                    qtyCounterEnabled: Boolean(service.qtyCounterEnabled),
                };
            } else {
                delete nextCache[serviceKey];
            }

            return {
                checkedCategoryMap: nextCheckedMap,
                categoryQuantitiesMap: nextQtyMap,
                cartItemsCache: nextCache,
            };
        }),

    incrementQuantity: (serviceKey) =>
        set((state) => {
            const currentQty = state.categoryQuantitiesMap[serviceKey] || 0;
            return {
                checkedCategoryMap: { ...state.checkedCategoryMap, [serviceKey]: true },
                categoryQuantitiesMap: { ...state.categoryQuantitiesMap, [serviceKey]: currentQty + 1 },
            };
        }),

    decrementQuantity: (serviceKey) =>
        set((state) => {
            const currentQty = state.categoryQuantitiesMap[serviceKey] || 1;
            if (currentQty > 1) {
                return {
                    categoryQuantitiesMap: { ...state.categoryQuantitiesMap, [serviceKey]: currentQty - 1 },
                };
            }
            return state;
        }),

    updateCustomAmount: (serviceKey, value) =>
        set((state) => {
            const parsedAmount = parseFloat(value);
            if (!isNaN(parsedAmount) && parsedAmount > 0) {
                return {
                    customAmountMap: { ...state.customAmountMap, [serviceKey]: parsedAmount },
                };
            }
            return {
                customAmountMap: { ...state.customAmountMap, [serviceKey]: 0.0 },
                checkedCategoryMap: { ...state.checkedCategoryMap, [serviceKey]: false },
            };
        }),

    updateSelectedDates: (serviceKey, dates) =>
        set((state) => ({
            selectedDatesMap: {
                ...state.selectedDatesMap,
                [serviceKey]: Array.isArray(dates) ? dates : [],
            },
        })),

    updateSelectedTime: (serviceKey, time) =>
        set((state) => ({
            selectedTimeMap: {
                ...state.selectedTimeMap,
                [serviceKey]: String(time || ''),
            },
        })),

    updateSelectedDiety: (serviceKey, dietyName) =>
        set((state) => ({
            selectedDietyMap: {
                ...state.selectedDietyMap,
                [serviceKey]: String(dietyName || ''),
            },
        })),

    /**
     * Calculates total active items in cart with defensive fallback.
    */
    getTotalCartCount: () => {
        const { checkedCategoryMap, categoryQuantitiesMap, cartItemsCache } = get();
        let count = 0;

        Object.keys(checkedCategoryMap).forEach((key) => {
            if (checkedCategoryMap[key]) {
                const item = cartItemsCache[key];
                const isQtyEnabled = item?.qtyCounterEnabled;
                count += isQtyEnabled ? Math.max(1, categoryQuantitiesMap[key] || 1) : 1;
            }
        });

        return count;
    },

    /**
     * Calculates total cart dollar value with defensive type casting.
     */
    getTotalCartAmount: () => {
        const { checkedCategoryMap, categoryQuantitiesMap, customAmountMap, cartItemsCache } = get();
        let total = 0.0;

        Object.keys(checkedCategoryMap).forEach((key) => {
            if (checkedCategoryMap[key]) {
                const item = cartItemsCache[key];
                if (item) {
                    const apiAmount = parseFloat(item.amount) || 0.0;
                    const basePrice = apiAmount <= 0 ? (parseFloat(customAmountMap[key]) || 0.0) : apiAmount;
                    const activeQty = item.qtyCounterEnabled ? Math.max(1, categoryQuantitiesMap[key] || 1) : 1;
                    total += basePrice * activeQty;
                }
            }
        });

        return isNaN(total) ? 0.0 : total;
    },

    /**
     * Flushes all state maps and releases mutex locks on module teardown.
     */
    clearStore: () =>
        set({
            selectedCategory: 'IN-TEMPLE',
            searchQuery: '',
            selectedDatesMap: {},
            selectedTimeMap: {},
            selectedDietyMap: {},
            checkedCategoryMap: {},
            categoryQuantitiesMap: {},
            customAmountMap: {},
            cartItemsCache: {},
            activeModal: null,
            activeModalServiceId: null,
            activeToast: null,
        }),
}));


