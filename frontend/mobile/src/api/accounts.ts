import { useMutation, useQuery } from '@tanstack/react-query';
import { ApiResponse, BankAccount, CreateAccountRequest } from '@bankapp/shared';
import { apiClient } from './apiClient';

export const accountKeys = {
  all: ['accounts'] as const,
  detail: (id: string) => ['accounts', id] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<BankAccount[]>>('/accounts');
      return res.data.data;
    },
  });
}

export function useAccount(accountId: string) {
  return useQuery({
    queryKey: accountKeys.detail(accountId),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<BankAccount>>(`/accounts/${accountId}`);
      return res.data.data;
    },
    enabled: !!accountId,
  });
}

export function useCreateAccount() {
  return useMutation({
    mutationFn: async (data: CreateAccountRequest) => {
      // Backend field is `accountType`; shared type uses `type`
      const res = await apiClient.post<ApiResponse<BankAccount>>('/accounts', {
        accountType: data.type,
        currency: data.currency,
      });
      return res.data.data;
    },
  });
}

export function useTopUp() {
  return useMutation({
    mutationFn: async ({ accountId, amount }: { accountId: string; amount: number }) => {
      const res = await apiClient.post<ApiResponse<BankAccount>>(
        `/accounts/${accountId}/top-up`,
        { amount },
      );
      return res.data.data;
    },
  });
}

export function useLookupAccount(accountNumber: string) {
  return useQuery({
    queryKey: ['accounts', 'lookup', accountNumber],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<BankAccount>>(
        `/accounts/lookup?accountNumber=${encodeURIComponent(accountNumber)}`
      );
      return res.data.data;
    },
    enabled: accountNumber.length > 0,
    retry: false,
  });
}
