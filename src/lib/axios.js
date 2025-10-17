import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api',
  withCredentials: true,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to ensure fresh auth
api.interceptors.request.use(
  (config) => {
    // Ensure credentials are always sent
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't auto-redirect on 401, let the component handle it
    // This allows for better user experience and error messages
    if (error.response?.status === 401) {
      console.warn('⚠️ Unauthorized request - session may have expired');
      // Clear localStorage user data if session is invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
