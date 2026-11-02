import { create } from 'zustand';

const safeParseFloat = (value) => {
    if (typeof value === 'number') return isNaN(value) ? 0.0 : Math.max(0, value);
    if (!value) return 0.0;
    const cleaned = String(value).replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0.0 : Math.max(0, parsed);
};

const calculateCartTotal = (items) => {
    if (!Array.isArray(items) || items.length === 0) return { totalCount: 0, totalAmount: 0.0 };

    return items.reduce(
        (acc, item) => {
            const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
            const unitPrice = safeParseFloat(item.amount);

            acc.totalCount += qty;
            acc.totalAmount += unitPrice * qty;
            return acc;
        },
        {
            totalCount: 0,
            totalAmount: 0.0
        }
    );
};

export const useCartStore = create((set, get) => ({
    // CART ENTITY STATE
    items: [], // Array of CartItem
    totalCount: 0,
    totalAmount: 0.0,
    currencySymbol: '$',

    // MODAL & TOAST MUTEX STACKING LOCKS
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
    
    insertItem: (itemPayload) => {
        if (!itemPayload || !itemPayload.id) return;

        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((item) => item.id === itemPayload.id);

        const normalizedQuantity = Math.max(1, parseInt(itemPayload.quantity, 10) || 1);
        const normalizedAmount = safeParseFloat(itemPayload.amount);

        let nextItems;
        if (existingIndex > -1) {
            nextItems = currentItems.map((item, idx) => {
                if (idx === existingIndex) {
                    return {
                        ...item,
                        ...itemPayload,
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
                    amount: normalizedAmount,
                    quantity: normalizedQuantity,
                    itemType: itemPayload.itemType || 'SERVICE',
                },
            ];
        }

        const { totalCount, totalAmount } = calculateCartTotal(nextItems);
        set({ items: nextItems, totalCount, totalAmount });
    },

    // Backward-compatibility aliases to prevent any component from crashing
    addItem: (itemPayload) => get().insertItem(itemPayload),
    upsertItem: (itemPayload) => get().insertItem(itemPayload),

    removeItem: (itemId) => {
        if (!itemId) return;
        const currentItems = get().items;
        const nextItems = currentItems.filter((item) => item.id !== itemId);
        const { totalCount, totalAmount } = calculateCartTotal(nextItems);
        set({ items: nextItems, totalCount, totalAmount });
    },

    updateQuantity: (itemId, quantity) => {
        if (!itemId) return;
        const nextQty = Math.max(1, parseInt(quantity, 10) || 1);
        const currentItems = get().items;

        const nextItems = currentItems.map((item) => {
            if (item.id === itemId) {
                return { ...item, quantity: nextQty };
            }
            return item;
        });

        const { totalCount, totalAmount } = calculateCartTotal(nextItems);
        set({ items: nextItems, totalCount, totalAmount });
    },

    updateCustomAmount: (itemId, amount) => {
        if (!itemId) return;
        const parsedAmt = safeParseFloat(amount);
        const currentItems = get().items;

        const nextItems = currentItems.map((item) => {
            if (item.id === itemId) {
                return { ...item, amount: parsedAmt };
            }
            return item;
        });

        const { totalCount, totalAmount } = calculateCartTotal(nextItems);
        set({ items: nextItems, totalCount, totalAmount });
    },

    clearCart: () => {
        set({ items: [], totalCount: 0, totalAmount: 0.0 });
    },
}));
