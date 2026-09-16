import { create } from 'zustand';

const logStoreEvent = (action, payload = {}) => {
    const event = {
        timestamp: new Date().toISOString(),
        module: 'HTKY_CART_STORE',
        action,
        payload
    };
    console.log(`[HTKY_STORE][${action}]`, event);
};

const calculateCartTotals = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return { totalCount: 0, totalAmount: 0 };
    }

    return items.reduce(
        (acc, item) => {
            const quantity = Math.max(parseInt(item.quantity, 10) || 1, 1);
            const rawPrice = parseFloat(item.amount) || 0;

            acc.totalCount += quantity;
            acc.totalAmount += rawPrice * quantity;
            return acc;
        },
        { totalCount: 0, totalAmount: 0 }
    );
};

export const useCartStore = create((set, get) => ({
    items: [],
    totalCount: 0,
    totalAmount: 0,
    currencySymbol: '$',

    setCurrencySymbol: (symbol) => {
        if (!symbol || typeof symbol !== 'string') return;
        set({ currencySymbol: symbol });
    },

    addItem: (itemPayload) => {
        if (!itemPayload || !itemPayload.id) return;

        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((i) => i.id === itemPayload.id);

        let updatedItems;
        if (existingIndex > -1) {
            updatedItems = currentItems.map((item, idx) => {
                if (idx === existingIndex) {
                    return {
                        ...item,
                        ...itemPayload,
                        quantity: itemPayload.quantity ?? item.quantity ?? 1
                    };
                }
                return item;
            });
        } else {
            updatedItems = [
                ...currentItems,
                {
                    ...itemPayload,
                    quantity: Math.max(parseInt(itemPayload.quantity, 10) || 1, 1)
                }
            ];
        }

        const { totalCount, totalAmount } = calculateCartTotals(updatedItems);

        logStoreEvent('ADD_ITEM', {
            itemId: itemPayload.id,
            name: itemPayload.refDataName,
            totalCount,
            totalAmount
        });

        set({
            items: updatedItems,
            totalCount,
            totalAmount
        });
    },

    removeItem: (itemId) => {
        if (!itemId) return;

        const currentItems = get().items;
        const updatedItems = currentItems.filter((item) => item.id !== itemId);
        const { totalCount, totalAmount } = calculateCartTotals(updatedItems);

        logStoreEvent('REMOVE_ITEM', { itemId, totalCount, totalAmount });

        set({
            items: updatedItems,
            totalCount,
            totalAmount
        });
    },

    updateQuantity: (itemId, quantity) => {
        if (!itemId) return;
        const safeQty = Math.max(parseInt(quantity, 10) || 1, 1);

        const currentItems = get().items;
        const updatedItems = currentItems.map((item) => {
            if (item.id === itemId) {
                return { ...item, quantity: safeQty };
            }
            return item;
        });

        const { totalCount, totalAmount } = calculateCartTotals(updatedItems);

        set({
            items: updatedItems,
            totalCount,
            totalAmount
        });
    },

    clearCart: () => {
        logStoreEvent('CLEAR_CART');
        set({
            items: [],
            totalCount: 0,
            totalAmount: 0
        });
    },

    activeModalLock: null,

    acquireModalLock: (modalId) => {
        const currentLock = get().activeModalLock;
        if (currentLock && currentLock !== modalId) {
            logStoreEvent('MUTEX_LOCK_BLOCKED', { requested: modalId, heldBy: currentLock });
            return false;
        }

        set({ activeModalLock: modalId });
        logStoreEvent('MUTEX_LOCK_ACQUIRED', { modalId });
        return true;
    },

    releaseModalLock: (modalId) => {
        const currentLock = get().activeModalLock;
        if (currentLock === modalId) {
            set({ activeModalLock: null });
            logStoreEvent('MUTEX_LOCK_RELEASED', { modalId });
        }
    }
}));

