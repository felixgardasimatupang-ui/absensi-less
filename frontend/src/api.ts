// [K-03 FIX] Cookie-Only API Client
// Semua request menggunakan `withCredentials: true` sehingga browser secara otomatis
// mengirimkan HttpOnly cookie pada setiap request. Tidak ada Authorization header manual.

import axios from 'axios';
import { useAuthStore } from './store';
import toast from 'react-hot-toast';
import { API_URL } from './config';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Browser mengirim HttpOnly cookie secara otomatis
  headers: {
    'Content-Type': 'application/json',
  },
});

// [K-03 FIX] Request Interceptor: TIDAK lagi menyuntikkan Authorization header secara manual.
// Autentikasi ditangani sepenuhnya oleh HttpOnly cookie yang dikirim browser.
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Auto-logout saat sesi berakhir (HTTP 401) + tampil toast error global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    const errorMessage = error.response?.data?.error || error.message || 'Terjadi kesalahan pada sistem.';

    if (status === 401) {
      // Cookie sudah invalid/expired — bersihkan state user di frontend
      useAuthStore.getState().logout();
      toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
    } else if (status !== undefined) {
      // Tampilkan error spesifik dari API untuk status error lainnya
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default api;
