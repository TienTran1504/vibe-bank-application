import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'bankapp_access_token';
const REFRESH_TOKEN_KEY = 'bankapp_refresh_token';
const USER_ID_KEY = 'bankapp_user_id';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;

  initialize: () => Promise<void>;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
  setUserId: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
}

function decodeJwtUserId(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(decoded) as { sub?: string };
    return parsed.sub ?? null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  userId: null,
  isAuthenticated: false,
  isInitializing: true,

  initialize: async () => {
    try {
      const [accessToken, refreshToken, userId] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.getItemAsync(USER_ID_KEY),
      ]);

      if (accessToken && refreshToken) {
        set({
          accessToken,
          refreshToken,
          userId: userId ?? decodeJwtUserId(accessToken),
          isAuthenticated: true,
        });
      }
    } finally {
      set({ isInitializing: false });
    }
  },

  setTokens: async ({ accessToken, refreshToken }) => {
    const userId = decodeJwtUserId(accessToken);
    set({ accessToken, refreshToken, userId, isAuthenticated: true });
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
      userId ? SecureStore.setItemAsync(USER_ID_KEY, userId) : Promise.resolve(),
    ]);
  },

  setUserId: async (userId) => {
    set({ userId });
    await SecureStore.setItemAsync(USER_ID_KEY, userId);
  },

  logout: async () => {
    set({ accessToken: null, refreshToken: null, userId: null, isAuthenticated: false });
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_ID_KEY),
    ]);
  },
}));
