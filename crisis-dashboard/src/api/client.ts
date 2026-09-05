// Centralized API Client with JWT Bearer Token Injection & 401 Interception

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export const TOKEN_STORAGE_KEY = 'nhrm_access_token';
export const USER_STORAGE_KEY = 'nhrm_current_user';

let onUnauthorizedCallback: (() => void) | null = null;

export function registerUnauthorizedHandler(callback: () => void) {
  onUnauthorizedCallback = callback;
}

export interface ApiError {
  status: number;
  message: string;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  const headers = new Headers(options.headers || {});

  // Attach Authorization header if token exists
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set default JSON Content-Type if sending body
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      throw {
        status: 401,
        message: 'Session expired or unauthorized. Please sign in to verify official credentials.',
      } as ApiError;
    }

    if (!response.ok) {
      let errorMessage = `Server error (Status ${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson?.detail) {
          errorMessage = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {
        // Response wasn't JSON
      }

      throw {
        status: response.status,
        message: errorMessage,
      } as ApiError;
    }

    // Return JSON or empty object if 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error: any) {
    if (error && typeof error === 'object' && 'status' in error) {
      throw error;
    }
    // Network or connection failure
    throw {
      status: 0,
      message: 'Unable to connect to the National Health Resource server. Please ensure the backend service is running locally on port 8000.',
    } as ApiError;
  }
}
