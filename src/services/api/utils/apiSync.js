import axios from 'axios';
import { httpClient } from '../core/httpClient';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ... existing code ...

export default {
  saveApiConfig,
  getApiConfig,
  deleteApiConfig
}; 