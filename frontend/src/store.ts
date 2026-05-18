import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState } from './types';
import axios from 'axios';
import { API_URL } from './config';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      login: (user, token) => set({ user, token }),
      logout: async () => {
        try {
          await axios.post(`${API_URL}/auth/logout`, {}, {
            withCredentials: true,
            headers: tokenHeader(useAuthStore.getState().token),
          });
        } catch (error) {
          console.error('Failed to logout on server:', error);
        } finally {
          set({ user: null, token: null });
        }
      },
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'absensiles-auth-web',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }), // PROTEKSI XSS: Jangan simpan JWT di localStorage!
    }
  )
);

function tokenHeader(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
