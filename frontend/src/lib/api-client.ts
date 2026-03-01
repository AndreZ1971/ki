/**
 * Centralized API Client with automatic language header injection
 * 
 * This wrapper ensures all API requests include the user's selected language,
 * so backend KI responses match the UI language.
 */

import i18n from '../i18n';

/**
 * Get current language code for API requests
 */
const getCurrentLanguage = (): string => {
  return i18n.language || 'de';
};

/**
 * Build default headers with language support
 */
const getDefaultHeaders = (): HeadersInit => {
  const lang = getCurrentLanguage();
  return {
    'Content-Type': 'application/json',
    'X-Language': lang, // Backend i18nService reads this
    'Accept-Language': lang, // Fallback
  };
};

/**
 * Enhanced fetch with automatic language headers
 * 
 * Usage:
 * ```typescript
 * import { apiFetch } from '@/lib/api-client';
 * 
 * const response = await apiFetch('/api/products/ai/generate-description', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'Product' })
 * });
 * ```
 */
export const apiFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const headers = {
    ...getDefaultHeaders(),
    ...(options.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Send cookies for session auth
  });
};

/**
 * API client for JSON requests/responses with language support
 * 
 * Usage:
 * ```typescript
 * import { apiClient } from '@/lib/api-client';
 * 
 * const data = await apiClient.post('/api/products/ai/generate-description', {
 *   name: 'Product'
 * });
 * ```
 */
export const apiClient = {
  async get<T = any>(url: string): Promise<T> {
    const response = await apiFetch(url);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await apiFetch(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },

  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await apiFetch(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },

  async delete<T = any>(url: string): Promise<T> {
    const response = await apiFetch(url, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },
};

/**
 * Get current language for manual use
 */
export const getApiLanguage = getCurrentLanguage;
