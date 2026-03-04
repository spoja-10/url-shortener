import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const shortenUrl = (data) => api.post('/urls', data);
export const getAllUrls = (page = 1, limit = 10) => api.get(`/urls?page=${page}&limit=${limit}`);
export const getUrlStats = (shortCode) => api.get(`/urls/${shortCode}`);
export const deleteUrl = (shortCode) => api.delete(`/urls/${shortCode}`);

export default api;
