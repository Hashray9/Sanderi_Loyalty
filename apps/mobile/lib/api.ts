import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

// Custom fetch wrapper that mimics axios API
async function request(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle errors
    if (!response.ok) {
      if (response.status === 401) {
        console.log('Authentication failed');
      }

      const message = data?.error?.message || data?.message || 'An error occurred';
      const error: any = new Error(message);
      error.response = { status: response.status, data };
      throw error;
    }

    // Return axios-like response
    return { data, status: response.status };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      const timeoutError: any = new Error('Request timeout');
      timeoutError.request = {};
      throw timeoutError;
    }

    if (!error.response) {
      error.message = 'Network error. Please check your connection.';
      error.request = {};
    }

    throw error;
  }
}

// Axios-like API interface
export const api = {
  get: (url: string, config?: RequestInit) => request(url, { ...config, method: 'GET' }),
  post: (url: string, data?: any, config?: RequestInit) =>
    request(url, { ...config, method: 'POST', body: JSON.stringify(data) }),
  put: (url: string, data?: any, config?: RequestInit) =>
    request(url, { ...config, method: 'PUT', body: JSON.stringify(data) }),
  delete: (url: string, config?: RequestInit) => request(url, { ...config, method: 'DELETE' }),
  patch: (url: string, data?: any, config?: RequestInit) =>
    request(url, { ...config, method: 'PATCH', body: JSON.stringify(data) }),
};
