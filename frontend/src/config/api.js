import axios from 'axios';

const api = axios.create({
  // baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  baseURL: import.meta.env.VITE_API_URL || 'https://api.climatesolutions.ai/api',
  withCredentials: true,
});

console.log('🔧 API configured with baseURL:', api.defaults.baseURL);

export default api;
