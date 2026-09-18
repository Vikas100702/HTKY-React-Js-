import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set) => ({
            isAuthenticated: false,
            token: null,
            user: null,
            devoteeId: null,

            login: (userData) => {
                if (!userData) return;
                set({
                    isAuthenticated: true,
                    token: userData.token || null,
                    devoteeId: userData._id || null,
                    user: {
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
                    isAuthenticated: false,
                    token: null,
                    user: null,
                    devoteeId: null,
                });
            },
        }),
        {
            name: 'htky-auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                token: state.token,
                devoteeId: state.devoteeId,
                user: state.user
            }),
        }
    )
);

