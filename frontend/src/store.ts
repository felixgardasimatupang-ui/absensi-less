import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState } from './types';
import axios from 'axios';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      login: (user, token) => set({ user, token }),
      logout: async () => {
        try {
          // Clear HttpOnly cookie on the backend, using direct axios to avoid circular dependency
          await axios.post('http://localhost:3000/api/auth/logout', {}, { withCredentials: true });
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
