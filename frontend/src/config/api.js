import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true,
});

console.log('🔧 API configured with baseURL:', api.defaults.baseURL);

export default api;
