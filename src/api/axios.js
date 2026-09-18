import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const API = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('softy_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('softy_token');
    }
    return Promise.reject(err);
  }
);

export default API;
