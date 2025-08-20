import axios from 'axios';
import { API_URL } from '../../config';

const api = axios.create({
  baseURL: API_URL,
});

// Adiciona um interceptador para incluir o token em todas as requisições
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
  // Para respostas de sucesso, não faz nada, apenas as retorna
  (response) => {
    return response;
  },
  // Para respostas de erro, executa esta função
  (error) => {
    // Verifica se o erro tem uma resposta do servidor e um status code
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log('Sessão expirada ou inválida. A redirecionar para o login...');
      
      // 1. Limpa os dados de autenticação do armazenamento local
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // 2. Redireciona o utilizador para a página de login
      // A forma mais robusta é forçar um recarregamento da página.
      // A lógica no App.tsx irá então renderizar a LoginPage.
      window.location.href = '/';
    }
    
    // Para todos os outros erros (ex: 500, 404), rejeita a promessa
    // para que possam ser tratados pelo código que fez a chamada.
    return Promise.reject(error);
  }
);

export default api;