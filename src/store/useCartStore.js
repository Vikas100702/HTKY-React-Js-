// import { create } from 'zustand';

// const safeParseFloat = (value) => {
//     if (typeof value === 'number') return isNaN(value) ? 0.0 : Math.max(0, value);
//     if (!value) return 0.0;
//     const cleaned = String(value).replace(/[^0-9.]/g, '');
//     const parsed = parseFloat(cleaned);
//     return isNaN(parsed) ? 0.0 : Math.max(0, parsed);
// };

// const calculateCartTotal = (items) => {
//     if (!Array.isArray(items) || items.length === 0) return { totalCount: 0, totalAmount: 0.0 };

//     return items.reduce(
//         (acc, item) => {
//             const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
//             const unitPrice = safeParseFloat(item.amount);

//             acc.totalCount += qty;
//             acc.totalAmount += unitPrice * qty;
//             return acc;
//         },
//         {
//             totalCount: 0,
//             totalAmount: 0.0
//         }
//     );
// };

// export const useCartStore = create((set, get) => ({
//     // CART ENTITY STATE
//     items: [], // Array of CartItem
//     totalCount: 0,
//     totalAmount: 0.0,
//     currencySymbol: '$',

//     // MODAL & TOAST MUTEX STACKING LOCKS
//     activeModal: null, // null | 'DATE_PICKER' | 'TIME_PICKER' | 'SLOT_MODAL'
//     activeModalItemId: null,
//     activeToast: null, // null | { message: string, type: 'warning'|'error'|'success', timestamp: number }

//     acquireModalLock: (modalType, itemId = null) => {
//         const { activeModal } = get();
//         if (activeModal !== null) return false;
//         set({ activeModal: modalType, activeModalItemId: itemId });
//         return true;
//     },

//     releaseModalLock: () => {
//         set({ activeModal: null, activeModalItemId: null });
//     },

//     showToast: (message, type = 'error') => {
//         const { activeToast } = get();
//         const now = Date.now();
//         if (activeToast && activeToast.message === message && now - activeToast.timestamp < 2000) {
//             return;
//         }
//         set({ activeToast: { message: String(message || ''), type, timestamp: now } });
//     },

//     clearToast: () => set({ activeToast: null }),

//     setCurrencySymbol: (symbol) => {
//         if (typeof symbol === 'string' && symbol.trim()) {
//             set({ currencySymbol: symbol.trim() });
//         }
//     },
    
//     insertItem: (itemPayload) => {
//         if (!itemPayload || !itemPayload.id) return;

//         const currentItems = get().items;
//         const existingIndex = currentItems.findIndex((item) => item.id === itemPayload.id);

//         const normalizedQuantity = Math.max(1, parseInt(itemPayload.quantity, 10) || 1);
//         const normalizedAmount = safeParseFloat(itemPayload.amount);

//         let nextItems;
//         if (existingIndex > -1) {
//             nextItems = currentItems.map((item, idx) => {
//                 if (idx === existingIndex) {
//                     return {
//                         ...item,
//                         ...itemPayload,
//                         amount: normalizedAmount,
//                         quantity: itemPayload.quantity !== undefined ? normalizedQuantity : item.quantity,
//                     };
//                 }
//                 return item;
//             });
//         } else {
//             nextItems = [
//                 ...currentItems,
//                 {
//                     ...itemPayload,
//                     amount: normalizedAmount,
//                     quantity: normalizedQuantity,
//                     itemType: itemPayload.itemType || 'SERVICE',
//                 },
//             ];
//         }

//         const { totalCount, totalAmount } = calculateCartTotal(nextItems);
//         set({ items: nextItems, totalCount, totalAmount });
//     },

//     // Backward-compatibility aliases to prevent any component from crashing
//     addItem: (itemPayload) => get().insertItem(itemPayload),
//     upsertItem: (itemPayload) => get().insertItem(itemPayload),

//     removeItem: (itemId) => {
//         if (!itemId) return;
//         const currentItems = get().items;
//         const nextItems = currentItems.filter((item) => item.id !== itemId);
//         const { totalCount, totalAmount } = calculateCartTotal(nextItems);
//         set({ items: nextItems, totalCount, totalAmount });
//     },

//     updateQuantity: (itemId, quantity) => {
//         if (!itemId) return;
//         const nextQty = Math.max(1, parseInt(quantity, 10) || 1);
//         const currentItems = get().items;

//         const nextItems = currentItems.map((item) => {
//             if (item.id === itemId) {
//                 return { ...item, quantity: nextQty };
//             }
//             return item;
//         });

//         const { totalCount, totalAmount } = calculateCartTotal(nextItems);
//         set({ items: nextItems, totalCount, totalAmount });
//     },

//     updateCustomAmount: (itemId, amount) => {
//         if (!itemId) return;
//         const parsedAmt = safeParseFloat(amount);
//         const currentItems = get().items;

//         const nextItems = currentItems.map((item) => {
//             if (item.id === itemId) {
//                 return { ...item, amount: parsedAmt };
//             }
//             return item;
//         });

//         const { totalCount, totalAmount } = calculateCartTotal(nextItems);
//         set({ items: nextItems, totalCount, totalAmount });
//     },

//     clearCart: () => {
//         set({ items: [], totalCount: 0, totalAmount: 0.0 });
//     },
// }));

import { create } from 'zustand';

const safeParseFloat = (value) => {
    if (typeof value === 'number') return isNaN(value) ? 0.0 : Math.max(0, value);
    if (!value) return 0.0;
    const cleaned = String(value).replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0.0 : Math.max(0, parsed);
};

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

export const useCartStore = create((set, get) => ({
    // CART ENTITY STATE 
    items: [],
    totalCount: 0,
    subtotalAmount: 0.0,
    currencySymbol: '$',

    //  CHECKOUT DONATION ADDONS 
    acharyaSambhavana: 0.0,
    generalDonation: 0.0,
    grandTotalAmount: 0.0,

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

    insertItem: (itemPayload) => {
        if (!itemPayload || (!itemPayload.id && !itemPayload._id)) return;

        const targetId = itemPayload.id || itemPayload._id;
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((item) => (item.id || item._id) === targetId);

        const normalizedQuantity = Math.max(1, parseInt(itemPayload.quantity, 10) || 1);
        const normalizedAmount = safeParseFloat(itemPayload.amount);

        let nextItems;
        if (existingIndex > -1) {
            nextItems = currentItems.map((item, idx) => {
                if (idx === existingIndex) {
                    return {
                        ...item,
                        ...itemPayload,
                        id: targetId,
                        amount: normalizedAmount,
                        quantity: itemPayload.quantity !== undefined ? normalizedQuantity : item.quantity,
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
                    amount: normalizedAmount,
                    quantity: normalizedQuantity,
                    itemType: itemPayload.itemType || 'SERVICE',
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
            totalAmount: grandTotalAmount, // Backward compatibility alias
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
            const itemName = String(item.name || item.serviceName || '').toLowerCase();
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
                return { ...item, quantity: nextQty };
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
}));

