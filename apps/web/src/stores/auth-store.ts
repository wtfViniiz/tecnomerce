import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/constants/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

interface AuthTokenResponse {
  accessToken: string;
  session: {
    id: string;
    chainId: string;
    expiresAt: string;
    deviceName: string | null;
  };
}

interface MeResponse {
  user: User;
  session: {
    id: string;
    chainId: string;
    expiresAt: string;
    deviceName: string | null;
  };
  permissions: string[];
  flags: {
    twoFaEnabled: boolean;
    isTwoFactorVerified: boolean;
    stepUpActive: boolean;
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<AuthTokenResponse>(ENDPOINTS.auth.login, {
        email,
        password,
      });

      const data = response.data;
      if (data?.accessToken) {
        apiClient.setAccessToken(data.accessToken);
        await get().fetchMe();
        return true;
      }

      set({ error: 'Resposta invalida do servidor', isLoading: false });
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<AuthTokenResponse>(ENDPOINTS.auth.register, {
        name,
        email,
        password,
      });

      const data = response.data;
      if (data?.accessToken) {
        apiClient.setAccessToken(data.accessToken);
        await get().fetchMe();
        return true;
      }

      set({ error: 'Resposta invalida do servidor', isLoading: false });
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await apiClient.post(ENDPOINTS.auth.logout);
    } catch {
      // Ignore logout errors, clear local state anyway
    } finally {
      apiClient.setAccessToken(null);
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get<MeResponse>(ENDPOINTS.auth.me);
      if (response.data?.user) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
