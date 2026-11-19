import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const safeParseFloat = (value) => {
    if (typeof value === 'number') return isNaN(value) ? 0.0 : Math.max(0, value);
    if (!value) return 0.0;
    const cleaned = String(value).replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0.0 : Math.max(0, parsed);
};

/**
 * Resolves whether quantity counter is enabled from backend item flags
 * (`qtyCounterEnabled` boolean or `qtyCounter` "YES"/"NO" across
 * Services, Donations, and Sponsorships).
 */
const resolveQtyCounterEnabled = (itemPayload = {}, existingItem = null) => {
    if (typeof itemPayload.qtyCounterEnabled === 'boolean') {
        return itemPayload.qtyCounterEnabled;
    }
    if (typeof itemPayload.rawItem?.qtyCounterEnabled === 'boolean') {
        return itemPayload.rawItem.qtyCounterEnabled;
    }

    const rawFlag =
        itemPayload.qtyCounter ??
        itemPayload.rawItem?.qtyCounter ??
        existingItem?.qtyCounter ??
        existingItem?.rawItem?.qtyCounter;

    if (rawFlag !== undefined && rawFlag !== null && String(rawFlag).trim() !== '') {
        return String(rawFlag).trim().toUpperCase() === 'YES';
    }

    if (typeof existingItem?.qtyCounterEnabled === 'boolean') {
        return existingItem.qtyCounterEnabled;
    }

    return false;
};

const resolveItemDisplayName = (itemPayload = {}, existingItem = null) => {
    return (
        itemPayload.title ||
        itemPayload.name ||
        itemPayload.refDataName ||
        itemPayload.serviceName ||
        itemPayload.rawItem?.refDataName ||
        itemPayload.rawItem?.title ||
        itemPayload.rawItem?.serviceName ||
        existingItem?.title ||
        existingItem?.name ||
        existingItem?.refDataName ||
        ''
    );
};

/**
 * Resolves normalized itemType ('DONATION' | 'SPONSORSHIP' | 'SERVICE' | etc.)
 * from explicit `itemType` or `serviceCategoryTypes`.
 */
const resolveNormalizedItemType = (itemPayload = {}, existingItem = null) => {
    if (itemPayload.itemType && String(itemPayload.itemType).trim()) {
        return String(itemPayload.itemType).trim().toUpperCase();
    }
    const catType = String(
        itemPayload.serviceCategoryTypes ||
        itemPayload.rawItem?.serviceCategoryTypes ||
        existingItem?.serviceCategoryTypes ||
        ''
    ).toUpperCase();

    if (catType.includes('SPONSOR')) return 'SPONSORSHIP';
    if (catType.includes('DONATION')) return 'GENERAL DONATIONss';
    if (existingItem?.itemType) return String(existingItem.itemType).trim().toUpperCase();
    return 'SERVICE';
};

/**
 * Computes line-item quantity and base subtotal.
 */
const calculateCartSubtotal = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return { totalCount: 0, subtotalAmount: 0.0 };
    }

    return items.reduce(
        (acc, item) => {
            const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
            const unitPrice = safeParseFloat(item.amount);

            acc.totalCount += qty;
            acc.subtotalAmount += unitPrice * qty;
            return acc;
        },
        { totalCount: 0, subtotalAmount: 0.0 }
    );
};

export const useCartStore = create(
    persist((set, get) => ({
        // ================= CART ENTITY STATE =================
        items: [],
        totalCount: 0,
        subtotalAmount: 0.0,
        currencySymbol: '$',

        // ================= CHECKOUT DONATION ADDONS =================
        acharyaSambhavana: 0.0,
        generalDonation: 0.0,
        grandTotalAmount: 0.0,

        // ================= MUTEX STACKING LOCKS =================
        activeModal: null, // null | 'DATE_PICKER' | 'TIME_PICKER' | 'SLOT_MODAL'
        activeModalItemId: null,
        activeToast: null, // null | { message: string, type: 'warning'|'error'|'success', timestamp: number }

        acquireModalLock: (modalType, itemId = null) => {
            const { activeModal } = get();
            if (activeModal !== null) return false;
            set({ activeModal: modalType, activeModalItemId: itemId });
            return true;
        },

        releaseModalLock: () => {
            set({ activeModal: null, activeModalItemId: null });
        },

        showToast: (message, type = 'error') => {
            const { activeToast } = get();
            const now = Date.now();
            if (activeToast && activeToast.message === message && now - activeToast.timestamp < 2000) {
                return;
            }
            set({ activeToast: { message: String(message || ''), type, timestamp: now } });
        },

        clearToast: () => set({ activeToast: null }),

        setCurrencySymbol: (symbol) => {
            if (typeof symbol === 'string' && symbol.trim()) {
                set({ currencySymbol: symbol.trim() });
            }
        },

        setAcharyaSambhavana: (amount) => {
            const parsed = safeParseFloat(amount);
            const { subtotalAmount, generalDonation } = get();
            const grandTotal = subtotalAmount + parsed + generalDonation;
            set({ acharyaSambhavana: parsed, grandTotalAmount: grandTotal });
        },

        setGeneralDonation: (amount) => {
            const parsed = safeParseFloat(amount);
            const { subtotalAmount, acharyaSambhavana } = get();
            const grandTotal = subtotalAmount + acharyaSambhavana + parsed;
            set({ generalDonation: parsed, grandTotalAmount: grandTotal });
        },

        /**
         * Inserts or updates an item in the cart, normalizing display name,
         * `itemType`, and `qtyCounterEnabled` across all offering modules.
         */
        insertItem: (itemPayload) => {
            if (!itemPayload || (!itemPayload.id && !itemPayload._id)) return;

            const targetId = itemPayload.id || itemPayload._id;
            const currentItems = get().items;
            const existingIndex = currentItems.findIndex((item) => (item.id || item._id) === targetId);
            const existingItem = existingIndex > -1 ? currentItems[existingIndex] : null;

            const qtyCounterEnabled = resolveQtyCounterEnabled(itemPayload, existingItem);
            const resolvedName = resolveItemDisplayName(itemPayload, existingItem);
            const resolvedItemType = resolveNormalizedItemType(itemPayload, existingItem);
            const rawQty = Math.max(1, parseInt(itemPayload.quantity, 10) || 1);
            const normalizedQuantity = qtyCounterEnabled ? rawQty : 1;
            const normalizedAmount = safeParseFloat(itemPayload.amount);

            let nextItems;
            if (existingIndex > -1) {
                nextItems = currentItems.map((item, idx) => {
                    if (idx === existingIndex) {
                        const updatedQty = qtyCounterEnabled
                            ? (itemPayload.quantity !== undefined ? normalizedQuantity : item.quantity)
                            : 1;
                        return {
                            ...item,
                            ...itemPayload,
                            id: targetId,
                            title: resolvedName,
                            name: resolvedName,
                            refDataName: itemPayload.refDataName || item.refDataName || resolvedName,
                            itemType: resolvedItemType,
                            qtyCounterEnabled,
                            amount: normalizedAmount,
                            quantity: updatedQty,
                        };
                    }
                    return item;
                });
            } else {
                nextItems = [
                    ...currentItems,
                    {
                        ...itemPayload,
                        id: targetId,
                        title: resolvedName,
                        name: resolvedName,
                        refDataName: itemPayload.refDataName || resolvedName,
                        itemType: resolvedItemType,
                        qtyCounterEnabled,
                        amount: normalizedAmount,
                        quantity: normalizedQuantity,
                    },
                ];
            }

            const { totalCount, subtotalAmount } = calculateCartSubtotal(nextItems);
            const { acharyaSambhavana, generalDonation } = get();
            const grandTotalAmount = subtotalAmount + acharyaSambhavana + generalDonation;

            set({
                items: nextItems,
                totalCount,
                subtotalAmount,
                grandTotalAmount,
                totalAmount: grandTotalAmount,
            });
        },

        addItem: (itemPayload) => get().insertItem(itemPayload),
        upsertItem: (itemPayload) => get().insertItem(itemPayload),

        removeItem: (itemId) => {
            if (!itemId) return;
            const currentItems = get().items;
            const nextItems = currentItems.filter((item) => (item.id || item._id) !== itemId);

            const { totalCount, subtotalAmount } = calculateCartSubtotal(nextItems);
            const { acharyaSambhavana, generalDonation } = get();
            const grandTotalAmount = subtotalAmount + acharyaSambhavana + generalDonation;

            set({
                items: nextItems,
                totalCount,
                subtotalAmount,
                grandTotalAmount,
                totalAmount: grandTotalAmount,
            });
        },

        removeExpiredItems: (expiredList) => {
            if (!Array.isArray(expiredList) || expiredList.length === 0) return;

            const expiredIdentifiers = new Set(
                expiredList.map((exp) => String(exp._id || exp.id || exp.serviceId || exp.serviceName).toLowerCase())
            );

            const currentItems = get().items;
            const nextItems = currentItems.filter((item) => {
                const itemId = String(item.id || item._id || '').toLowerCase();
                const itemName = String(item.name || item.title || item.serviceName || '').toLowerCase();
                return !expiredIdentifiers.has(itemId) && !expiredIdentifiers.has(itemName);
            });

            const { totalCount, subtotalAmount } = calculateCartSubtotal(nextItems);
            const { acharyaSambhavana, generalDonation } = get();
            const grandTotalAmount = subtotalAmount + acharyaSambhavana + generalDonation;

            set({
                items: nextItems,
                totalCount,
                subtotalAmount,
                grandTotalAmount,
                totalAmount: grandTotalAmount,
            });
        },

        updateQuantity: (itemId, quantity) => {
            if (!itemId) return;
            const nextQty = Math.max(1, parseInt(quantity, 10) || 1);
            const currentItems = get().items;

            const nextItems = currentItems.map((item) => {
                if ((item.id || item._id) === itemId) {
                    const isCounterAllowed = resolveQtyCounterEnabled(item);
                    return { ...item, quantity: isCounterAllowed ? nextQty : 1 };
                }
                return item;
            });

            const { totalCount, subtotalAmount } = calculateCartSubtotal(nextItems);
            const { acharyaSambhavana, generalDonation } = get();
            const grandTotalAmount = subtotalAmount + acharyaSambhavana + generalDonation;

            set({
                items: nextItems,
                totalCount,
                subtotalAmount,
                grandTotalAmount,
                totalAmount: grandTotalAmount,
            });
        },

        clearCart: () => {
            set({
                items: [],
                totalCount: 0,
                subtotalAmount: 0.0,
                acharyaSambhavana: 0.0,
                generalDonation: 0.0,
                grandTotalAmount: 0.0,
                totalAmount: 0.0,
            });
        },
    }),
        {
            name: "htky-cart-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                items: state.items,
                totalCount: state.totalCount,
                subtotalAmount: state.subtotalAmount,
                currencySymbol: state.currencySymbol,
                acharyaSambhavana: state.acharyaSambhavana,
                generalDonation: state.generalDonation,
                grandTotalAmount: state.grandTotalAmount,
                totalAmount: state.totalAmount
            }),
        }
    ));
