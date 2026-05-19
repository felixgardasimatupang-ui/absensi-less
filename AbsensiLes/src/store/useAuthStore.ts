import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState } from '../types';
import { API_URL } from '../config';

export const useAuthStore = create<AuthState & {
  isCheckingSession: boolean;
  checkSession: () => Promise<void>;
  setIsCheckingSession: (bool: boolean) => void;
}>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isCheckingSession: false,
      login: (user, token) => set({ user, token }),
      logout: async () => {
        try {
          await axios.post(`${API_URL}/auth/logout`, {}, {
            headers: tokenHeader(get().token),
          });
        } catch (error) {
          console.error('Failed to logout on server:', error);
        } finally {
          set({ user: null, token: null });
        }
      },
      setLoading: (isLoading) => set({ isLoading }),
      setIsCheckingSession: (bool: boolean) => set({ isCheckingSession: bool }),
      checkSession: async () => {
        const { token } = get();
        set({ isCheckingSession: true });
        if (!token) {
          set({ user: null, isCheckingSession: false });
          return;
        }
        try {
          const response = await axios.get(`${API_URL}/auth/me`, {
            headers: tokenHeader(token),
          });
          // Assuming the response is { user: { ... } }
          if (response.data && response.data.user) {
            set({ user: response.data.user, isCheckingSession: false });
          } else {
            set({ user: null, token: null, isCheckingSession: false });
          }
        } catch (error) {
          console.error('Session check failed:', error);
          set({ user: null, token: null, isCheckingSession: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

function tokenHeader(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
