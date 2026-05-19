// [K-03 FIX] Cookie-Only Authentication Store
// Token JWT TIDAK lagi disimpan di state Zustand atau sessionStorage.
// Autentikasi sepenuhnya mengandalkan HttpOnly cookie yang di-set oleh backend,
// sehingga tidak dapat diakses oleh JavaScript dan aman dari serangan XSS.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState } from './types';
import { API_URL } from './config';
import { telemetry } from './utils/telemetry';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      // Menerima hanya data user, TIDAK menerima token
      login: (user) => set({ user }),

      logout: async () => {
        try {
          // Panggil backend untuk invalidasi tokenVersion + hapus HttpOnly cookie
          await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include', // Kirim cookie secara otomatis
          });
        } catch (error) {
          console.error('Server logout request failed (non-critical):', error);
          // Log telemetry for logout failure
          telemetry.logoutFailure(error);
        } finally {
          // Bersihkan state lokal setelah logout
          set({ user: null });
        }
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'absensiles-auth-web',
      storage: createJSONStorage(() => sessionStorage),
      // Hanya persist metadata user (nama, role) untuk UX — bukan token.
      // Sesi login divalidasi ulang oleh cookie HttpOnly pada setiap request API.
      partialize: (state) => ({ user: state.user }),
    }
  )
);
