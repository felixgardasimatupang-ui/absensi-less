import axios from 'axios';
import { useAuthStore } from './store';
import toast from 'react-hot-toast';
import { API_URL } from './config';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add JWT token to every request automatically
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Auto-logout on 401 unauthenticated response and global error toaster
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    const errorMessage = error.response?.data?.error || error.message || 'Terjadi kesalahan pada sistem.';

    if (status === 401) {
      useAuthStore.getState().logout();
      toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
    } else {
      // Display global visual toast notification for any API errors
      toast.error(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

export default api;
