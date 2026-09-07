// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  // Perhatikan perbedaan cara panggil env di Vite
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: 'application/json',
  },
});

// -----------------------------------------------------------------------------
// REQUEST INTERCEPTOR (Pasang Token Otomatis)
// -----------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    // Ambil token dari LocalStorage
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If sending FormData, let the browser set Content-Type (including boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// -----------------------------------------------------------------------------
// RESPONSE INTERCEPTOR (Handle Token Expired)
// -----------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Jika backend menolak token (401 Unauthorized)
    if (error.response?.status === 401) {
      // Hapus token yang sudah tidak valid
      localStorage.removeItem('token');

      // Opsional: Redirect ke halaman login
      // Karena ini file JS biasa (bukan komponen), kita pakai cara native:
      window.location.href = '/';
    }
    return Promise.reject(error);
  },
);

export default api;
