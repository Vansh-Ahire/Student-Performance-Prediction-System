import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const response = await axios.post(`${baseUrl}/api/token/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          });
          localStorage.setItem('access_token', response.data.access_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
          return api(originalRequest);
        } catch (e) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;