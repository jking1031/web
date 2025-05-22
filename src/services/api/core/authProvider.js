import axios from 'axios';
import { httpClient } from './httpClient';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const authProvider = {
  login: async ({ username, password }) => {
    const response = await apiClient.post('/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      return Promise.resolve();
    }
    return Promise.reject();
  },
  
  logout: () => {
    localStorage.removeItem('token');
    return Promise.resolve();
  },
  
  checkAuth: () => {
    const token = localStorage.getItem('token');
    return token ? Promise.resolve() : Promise.reject();
  },
  
  getPermissions: () => Promise.resolve()
};

export default authProvider; 