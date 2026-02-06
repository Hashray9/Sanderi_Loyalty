import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Handle token expiration
      if (status === 401) {
        // Token expired or invalid - could trigger logout here
        console.log('Authentication failed');
      }

      // Extract error message
      const message = data?.error?.message || 'An error occurred';
      error.message = message;
    } else if (error.request) {
      // Network error
      error.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);
