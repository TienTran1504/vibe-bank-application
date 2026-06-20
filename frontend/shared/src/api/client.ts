import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export interface ApiClientOptions {
  baseURL: string;
  getAccessToken?: () => string | null;
  getRefreshToken?: () => string | null;
  onTokenRefreshed?: (tokens: { accessToken: string; refreshToken: string }) => void;
  onAuthFailed?: () => void;
}

export function createApiClient(options: ApiClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL: options.baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = options.getAccessToken?.();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry && options.getRefreshToken) {
        originalRequest._retry = true;
        try {
          const refreshToken = options.getRefreshToken();
          if (!refreshToken) throw new Error('No refresh token');

          const response = await axios.post(`${options.baseURL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          options.onTokenRefreshed?.({ accessToken, refreshToken: newRefreshToken });
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return client(originalRequest);
        } catch {
          options.onAuthFailed?.();
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}
