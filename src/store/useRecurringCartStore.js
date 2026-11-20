/**
 * @file src/store/useRecurringCartStore.js
 * @description Isolated Zustand State Store exclusively for Recurring Donations.
 * Keeps recurring donation items decoupled from the global `useCartStore`,
 * disables quantity counters completely (`qtyCounterEnabled: false`), and computes
 * totals strictly from each item's offering amount.
 *
 * Strict Tech Stack: Modern React JS (Pure ES6+ JavaScript, NO TypeScript).
 * Aligns strictly with Critical Architectural Non-Negotiables #2, #3, and #4.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Sanitizes numeric input and prevents NaN propagation.
 *
 * @param {number|string} value
 * @returns {number}
 */
const safeParseFloat = (value) => {
    if (typeof value === 'number') return Number.isNaN(value) ? 0.0 : Math.max(0, value);
    if (!value) return 0.0;
    const cleaned = String(value).replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0.0 : Math.max(0, parsed);
};

/**
 * Resolves a consistent display name from backend/frontend item fields.
 *
 * @param {Object} itemPayload
 * @param {Object} [existingItem]
 * @returns {string}
 */
const resolveItemDisplayName = (itemPayload = {}, existingItem = null) =>
    itemPayload.title ||
    itemPayload.name ||
    itemPayload.refDataName ||
    itemPayload.serviceName ||
    itemPayload.rawItem?.refDataName ||
    itemPayload.rawItem?.title ||
    existingItem?.title ||
    existingItem?.name ||
    existingItem?.refDataName ||
    '';

/**
 * Computes item count and total offering amount (without quantity multiplier).
 *
 * @param {Array<Object>} items
 * @returns {{ totalCount: number, subtotalAmount: number }}
 */
const calculateRecurringTotals = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return { totalCount: 0, subtotalAmount: 0.0 };
    }

    return items.reduce(
        (acc, item) => {
            const amount = safeParseFloat(item.amount);
            acc.totalCount += 1;
            acc.subtotalAmount += amount;
            return acc;
        },
        { totalCount: 0, subtotalAmount: 0.0 }
    );
};

export const useRecurringCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            totalCount: 0,
            subtotalAmount: 0.0,
            totalAmount: 0.0,
            currencySymbol: '$',

            setCurrencySymbol: (symbol) => {
                if (typeof symbol === 'string' && symbol.trim()) {
                    set({ currencySymbol: symbol.trim() });
                }
            },

            /**
             * Inserts or updates a recurring donation item in the isolated store.
             * Quantity counter is strictly disabled (`qtyCounterEnabled: false`, `quantity: 0`).
             */
            insertItem: (itemPayload) => {
                if (!itemPayload || (!itemPayload.id && !itemPayload._id)) return;

                const targetId = itemPayload.id || itemPayload._id;
                const currentItems = get().items;
                const existingIndex = currentItems.findIndex((item) => (item.id || item._id) === targetId);
                const existingItem = existingIndex > -1 ? currentItems[existingIndex] : null;

                const resolvedName = resolveItemDisplayName(itemPayload, existingItem);
                const normalizedAmount = safeParseFloat(itemPayload.amount);

                let nextItems;
                if (existingIndex > -1) {
                    nextItems = currentItems.map((item, idx) => {
                        if (idx === existingIndex) {
                            return {
                                ...item,
                                ...itemPayload,
                                id: targetId,
                                title: resolvedName,
                                name: resolvedName,
                                refDataName: itemPayload.refDataName || item.refDataName || resolvedName,
                                itemType: 'RECURRING_DONATION',
                                qtyCounterEnabled: false,
                                amount: normalizedAmount,
                                quantity: 0,
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
                            itemType: 'RECURRING_DONATION',
                            qtyCounterEnabled: false,
                            amount: normalizedAmount,
                            quantity: 0,
                        },
                    ];
                }

                const { totalCount, subtotalAmount } = calculateRecurringTotals(nextItems);
                set({
                    items: nextItems,
                    totalCount,
                    subtotalAmount,
                    totalAmount: subtotalAmount,
                });
            },

            addItem: (itemPayload) => get().insertItem(itemPayload),
            upsertItem: (itemPayload) => get().insertItem(itemPayload),

            /**
             * Removes a single recurring donation item by ID.
             */
            removeItem: (itemId) => {
                if (!itemId) return;
                const nextItems = get().items.filter((item) => (item.id || item._id) !== itemId);
                const { totalCount, subtotalAmount } = calculateRecurringTotals(nextItems);
                set({
                    items: nextItems,
                    totalCount,
                    subtotalAmount,
                    totalAmount: subtotalAmount,
                });
            },

            /**
             * Clears all items from the isolated recurring donation store.
             */
            clearRecurringCart: () => {
                set({
                    items: [],
                    totalCount: 0,
                    subtotalAmount: 0.0,
                    totalAmount: 0.0,
                });
            },
        }),
        {
            name: 'htky-recurring-cart-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                items: state.items,
                totalCount: state.totalCount,
                subtotalAmount: state.subtotalAmount,
                totalAmount: state.totalAmount,
                currencySymbol: state.currencySymbol,
            }),
        }
    )
);

export default useRecurringCartStore;

