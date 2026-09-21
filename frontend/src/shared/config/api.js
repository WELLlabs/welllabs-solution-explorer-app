import axios from 'axios';

export const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Beta environment
    if (host === 'beta.climatesolutions.ai') {
      return 'https://betaapi.climatesolutions.ai/api';
    }
    // Production environment
    if (host === 'climatesolutions.ai' || host === 'blr.climatesolutions.ai') {
      return 'https://api.climatesolutions.ai/api';
    }
    // Local development
    if (host === 'localhost' || host === '127.0.0.1') {
      return import.meta.env.VITE_API_URL || '/api';
    }
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'https://api.climatesolutions.ai/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;