import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const registerUser = (data: { full_name: string; email: string; password: string }) =>
  api.post('/auth/register', data);

export const loginUser = (email: string, password: string) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);
  return axios.post(`${API_BASE_URL}/auth/login`, formData);
};

// Quiz
export const submitQuiz = (data: object) => api.post('/quiz/submit', data);
export const getSkinProfile = () => api.get('/quiz/profile');

// Weather
export const getWeather = (lat: number, lon: number) =>
  api.get(`/weather/current?lat=${lat}&lon=${lon}`);

// Scan
export const analyzeScan = (file: File, lat: number, lon: number) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/scan/analyze?lat=${lat}&lon=${lon}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getScanHistory = () => api.get('/scan/history');

// Recommendation
export const getRecommendation = () => api.get('/recommendation/latest');
export const getProductRecommendations = () => api.get('/recommendation/products');

export default api;