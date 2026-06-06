import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

// Mock API interceptor - returns mock data instead of real HTTP calls
api.interceptors.request.use(config => {
  config.headers['X-Mock'] = 'true';
  return config;
});

export default api;

// Simulated async wrapper
export const mockDelay = (ms = 500) => new Promise(r => setTimeout(r, ms));
