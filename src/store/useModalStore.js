import { create } from 'zustand';

const logModalEvent = (action, modalId, payload = {}) => {
    const event = {
        timestamp: new Date().toISOString(),
        module: 'HTKY_MODAL_STORE',
        action,
        modalId,
        payload
    };

    if (action === 'BLOCKED') {
        console.warn(`[HTKY_STORE][MODAL_MUTEX_BLOCKED]`, event);
    } else {
        console.log(`[HTKY_STORE][MODAL_${action}]`, event);
    }
};

export const useModalStore = create((set, get) => ({
    activeModal: null,
    modalPayload: null,

    openModal: (modalId, payload = null) => {
        if (!modalId || typeof modalId !== "string") return false;

        const { activeModal } = get();

        if (activeModal && activeModal !== modalId) {
            logModalEvent('BLOCKED', modalId, { currentlyActive: activeModal });
            return false;
        }

        logModalEvent('OPEN', modalId, payload);
        set({ activeModal: modalId, modalPayload: payload });
        return true;
    },

    closeModal: () => {
        const { activeModal } = get();
        if(activeModal) {
            logModalEvent('CLOSE', activeModal);
            set({ activeModal: null, modalPayload: null });
        }
    },
    closeSpecificModal: (modalId) => {
        const { activeModal } = get();
        if (activeModal === modalId) {
            logModalEvent('CLOSE_SPECIFIC', modalId);
            set({ activeModal: null, modalPayload: null });
        }
    }
}));

