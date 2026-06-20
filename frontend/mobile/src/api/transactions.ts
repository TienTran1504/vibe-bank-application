import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiResponse, PagedResponse, Transaction, TransferRequest, TransferResponse } from '@bankapp/shared';
import { apiClient } from './apiClient';
import { accountKeys } from './accounts';

export const txKeys = {
  all: (page = 0, size = 20) => ['transactions', page, size] as const,
  detail: (id: string) => ['transactions', id] as const,
};

export function useTransactions(page = 0, size = 20) {
  return useQuery({
    queryKey: txKeys.all(page, size),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PagedResponse<Transaction>>>(
        `/transactions?page=${page}&size=${size}`
      );
      return res.data.data;
    },
  });
}

export function useTransaction(transactionId: string) {
  return useQuery({
    queryKey: txKeys.detail(transactionId),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Transaction>>(`/transactions/${transactionId}`);
      return res.data.data;
    },
    enabled: !!transactionId,
  });
}

function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function useTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TransferRequest) => {
      const idempotencyKey = data.idempotencyKey ?? randomUUID();
      const { idempotencyKey: _ik, ...body } = data;
      const res = await apiClient.post<ApiResponse<TransferResponse>>('/transactions/transfer', body, {
        headers: { 'X-Idempotency-Key': idempotencyKey },
      });
      return res.data.data;
    },
    onSuccess: () => {
      // Refresh balances and transaction list after a successful transfer
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: txKeys.all() });
    },
  });
}
