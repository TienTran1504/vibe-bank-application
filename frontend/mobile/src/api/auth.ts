import { useMutation } from '@tanstack/react-query';
import { ApiResponse, AuthTokens, LoginRequest, MfaVerifyRequest, RegisterRequest } from '@bankapp/shared';
import { apiClient } from './apiClient';

export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await apiClient.post<ApiResponse<AuthTokens>>('/auth/login', data);
      return res.data.data;
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const res = await apiClient.post<ApiResponse<{ message: string }>>('/auth/register', data);
      return res.data;
    },
  });
}

export function useSendMfa() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<ApiResponse<null>>('/auth/mfa/send', {});
      return res.data;
    },
  });
}

export function useVerifyMfa() {
  return useMutation({
    mutationFn: async (data: MfaVerifyRequest) => {
      const res = await apiClient.post<ApiResponse<AuthTokens>>('/auth/mfa/verify', data);
      return res.data.data;
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout', {});
    },
  });
}
