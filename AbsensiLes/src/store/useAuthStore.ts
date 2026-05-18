import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState } from '../types';
import { API_URL } from '../config';

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
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

function tokenHeader(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
