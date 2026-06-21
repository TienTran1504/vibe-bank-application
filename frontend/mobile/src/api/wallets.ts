import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiResponse,
  PagedResponse,
  Wallet,
  WalletTransaction,
  WalletTopUpRequest,
  WalletWithdrawRequest,
} from '@bankapp/shared';
import { apiClient } from './apiClient';

export const walletKeys = {
  me: ['wallet', 'me'] as const,
  transactions: ['wallet', 'transactions'] as const,
};

export function useWallet() {
  return useQuery({
    queryKey: walletKeys.me,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Wallet>>('/wallets/me');
      return res.data.data;
    },
  });
}

export function useWalletTransactions(page = 0, size = 20) {
  return useQuery({
    queryKey: [...walletKeys.transactions, page, size],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PagedResponse<WalletTransaction>>>(
        `/wallets/transactions?page=${page}&size=${size}`,
      );
      return res.data.data;
    },
  });
}

export function useWalletTopUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: WalletTopUpRequest) => {
      const res = await apiClient.post<ApiResponse<Wallet>>('/wallets/top-up', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.me });
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions });
    },
  });
}

export function useWalletWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: WalletWithdrawRequest) => {
      const res = await apiClient.post<ApiResponse<Wallet>>('/wallets/withdraw', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.me });
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions });
    },
  });
}
