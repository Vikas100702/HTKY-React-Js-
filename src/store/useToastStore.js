/**
 * @file src/store/useToastStore.js
 * @description Global Zustand Controller for Toast Notifications.
 * Implements "Toast Stacking Locks" (Rule #3) to prevent DOM flooding 
 * and browser freezes during cascading API failures.
 */

import { create } from "zustand";

// Maximum number of toasts allowed on screen at once to prevent DOM flooding
const MAX_TOAST_LIMIT = 3;
// Default auto-dismiss duration in milliseconds
const TOAST_DURATION = 5000;

export const useToastStore = create((set, get) => ({
    toasts: [],

    /**
     * Adds a new toast to the queue. 
     * Enforces the stacking lock by removing the oldest toast if the limit is reached.
     * 
     * @param {Object} toast - The toast payload.
     * @param {string} toast.type - 'success' | 'error' | 'warning' | 'info'
     * @param {string} toast.message - The message to display.
     */
    addToast: ({ type = "info", message }) => {
        const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

        set((state) => {
            // Rule #3: Toast Stacking Lock Implementation
            const activeToasts = state.toasts.length >= MAX_TOAST_LIMIT
                ? state.toasts.slice(1) // Drop the oldest toast
                : state.toasts;

            return {
                toasts: [...activeToasts, { id, type, message }],
            };
        });

        // Auto-dismiss safely
        setTimeout(() => {
            get().removeToast(id);
        }, TOAST_DURATION);
    },

    /**
     * Removes a specific toast by its ID.
     * 
     * @param {string} id - The unique identifier of the toast to remove.
     */
    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
    },

    /**
     * Clears all active toasts immediately (useful on route changes).
     */
    clearAllToasts: () => {
        set({ toasts: [] });
    },
}));