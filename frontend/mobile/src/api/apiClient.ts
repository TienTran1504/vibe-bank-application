import { Platform } from 'react-native';
import { createApiClient } from '@bankapp/shared';
import { useAuthStore } from '../store/authStore';

const BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8080/api/v1'
    : 'http://localhost:8080/api/v1';

export const apiClient = createApiClient({
  baseURL: BASE_URL,
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  onTokenRefreshed: (tokens) => {
    useAuthStore.getState().setTokens(tokens);
  },
  onAuthFailed: () => {
    useAuthStore.getState().logout();
  },
});
