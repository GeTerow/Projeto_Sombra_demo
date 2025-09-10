import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log('Sessão expirada ou inválida. A redirecionar para o login...');
      
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export default api;