import axios from 'axios';

// Axios instance with credentials (cookies) sent automatically
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global response interceptor: unwrap data or throw readable errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred.';

    // Redirect to login on 401 (skip initial /auth/me check and public auth pages)
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/me') &&
      !['/login', '/register'].includes(window.location.pathname)
    ) {
      window.location.href = '/login';
    }

    return Promise.reject(new Error(message));
  }
);

export default api;

