import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({
            userId: null, // Session id / _id of the user
            isAuthenticated: false,
            token: null,
            user: null,

            login: (userData) => {
                if (!userData) return;
                const extractedId = userData._id;
                set({
                    userId: extractedId, // Storing _id to track active session
                    isAuthenticated: Boolean(extractedId),
                    token: userData.token || null,
                    user: {
                        id: extractedId,
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || '',
                        name: userData.refDataName || '',
                        email: userData.email || '',
                        phone: userData.phone || '',
                        countryCode: userData.contryCode || '',
                    }
                });
            },

            updateUserProfile: (profileData) => {
                set((state) => ({
                    user: { ...state.user, ...profileData }
                }));
            },

            logout: () => {
                set({
                    userId: null,
                    isAuthenticated: false,
                    token: null,
                    user: null,
                });
            },
        }),
        {
            name: 'htky-auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                userId: state.userId,
                isAuthenticated: state.isAuthenticated,
                token: state.token,
                user: state.user
            }),
        }
    )
);




