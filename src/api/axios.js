import axios from 'axios';
import { getAuth } from 'firebase/auth';

// Экземпляр для нашего API с поддержкой credentials
export const apiClient = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Экземпляр для Firebase с поддержкой авторизации
export const firebaseClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем перехватчик для добавления токена авторизации
firebaseClient.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (user) {
    const token = await user.getIdToken();
    // Добавляем токен в URL для Firebase Realtime Database
    const separator = config.url.includes('?') ? '&' : '?';
    config.url = `${config.url}${separator}auth=${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Добавляем обработчик ошибок
const addErrorInterceptor = (client) => {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', error);
      return Promise.reject(error);
    }
  );
};

addErrorInterceptor(apiClient);
addErrorInterceptor(firebaseClient);

export default apiClient; // для обратной совместимости
