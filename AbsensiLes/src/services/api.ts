import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Backend Node.js lokal (IP disesuaikan dari server Expo)
const API_URL = 'https://2df9f003876952eb-36-74-234-209.serveousercontent.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Otomatis tambahkan token ke setiap request
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

// Response Interceptor: Handle unauthenticated (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto logout jika token expired / tidak valid
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
