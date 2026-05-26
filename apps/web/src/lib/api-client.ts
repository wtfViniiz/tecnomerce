import { API_URL, ENDPOINTS } from '@/constants/api';
import type { ApiResponse } from '@/types/api';

class ApiClient {
  private guestToken: string | null = null;
  private accessToken: string | null = null;

  setGuestToken(token: string) {
    this.guestToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('guest_token', token);
    }
  }

  getGuestToken(): string | null {
    if (this.guestToken) return this.guestToken;
    if (typeof window !== 'undefined') {
      this.guestToken = localStorage.getItem('guest_token');
    }
    return this.guestToken;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        document.cookie = `access_token=${token}; path=/; max-age=3600; SameSite=Strict`;
      } else {
        document.cookie = 'access_token=; path=/; max-age=0';
      }
    }
  }

  getAccessToken(): string | null {
    if (this.accessToken) return this.accessToken;
    if (typeof window !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
      this.accessToken = match ? match[1] : null;
    }
    return this.accessToken;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const accessToken = this.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const guestToken = this.getGuestToken();
    if (guestToken) {
      headers['x-guest-token'] = guestToken;
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_URL}${endpoint}`;
    const headers = {
      ...this.getHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      this.setAccessToken(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new ApiError(
        'Sessao expirada. Faca login novamente.',
        'UNAUTHORIZED',
        401
      );
    }

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error?.message || 'Request failed',
        data.error?.code || 'UNKNOWN_ERROR',
        response.status,
        data.error?.details
      );
    }

    return data;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient();
