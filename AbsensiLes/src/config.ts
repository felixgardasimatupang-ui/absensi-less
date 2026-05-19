const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error('EXPO_PUBLIC_API_URL belum dikonfigurasi.');
}

export const API_URL = apiUrl;
