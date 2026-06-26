import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiResponse,
  Card,
  CardPaymentRequest,
  CardTransaction,
  CreateVirtualCardRequest,
  FreezeCardRequest,
  PagedResponse,
  SpendingLimitRequest,
} from '@bankapp/shared';
import { apiClient } from './apiClient';

export const cardKeys = {
  all: ['cards'] as const,
  detail: (id: string) => ['cards', id] as const,
  transactions: (id: string) => ['cards', id, 'transactions'] as const,
};

export function useCards() {
  return useQuery({
    queryKey: cardKeys.all,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Card[]>>('/cards');
      return res.data.data;
    },
  });
}

export function useCreateVirtualCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateVirtualCardRequest) => {
      const res = await apiClient.post<ApiResponse<Card>>('/cards/virtual', data);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cardKeys.all }),
  });
}

export function useFreezeCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, freeze }: { cardId: string } & FreezeCardRequest) => {
      const res = await apiClient.put<ApiResponse<Card>>(`/cards/${cardId}/freeze`, { freeze });
      return res.data.data;
    },
    // Optimistic update — flip the cached card status instantly so the toggle
    // moves with the tap instead of waiting for the server round-trip + refetch.
    onMutate: async ({ cardId, freeze }) => {
      await queryClient.cancelQueries({ queryKey: cardKeys.all });
      const previous = queryClient.getQueryData<Card[]>(cardKeys.all);
      queryClient.setQueryData<Card[]>(cardKeys.all, (old) =>
        old?.map((c) =>
          c.id === cardId ? { ...c, status: (freeze ? 'FROZEN' : 'ACTIVE') as Card['status'] } : c,
        ),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(cardKeys.all, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: cardKeys.all }),
  });
}

export function useSetSpendingLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, dailyLimit }: { cardId: string } & SpendingLimitRequest) => {
      const res = await apiClient.put<ApiResponse<Card>>(`/cards/${cardId}/limits`, { dailyLimit });
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cardKeys.all }),
  });
}

export function useCardPay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, merchant, amount, currency }: { cardId: string } & CardPaymentRequest) => {
      // Fresh idempotency key per payment attempt (button is disabled while pending)
      const idempotencyKey = `card-pay-${cardId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const res = await apiClient.post<ApiResponse<CardTransaction>>(
        `/cards/${cardId}/pay`,
        { merchant, amount, currency },
        { headers: { 'X-Idempotency-Key': idempotencyKey } },
      );
      return res.data.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
      queryClient.invalidateQueries({ queryKey: cardKeys.transactions(vars.cardId) });
    },
  });
}

export function useCardTransactions(cardId: string, page = 0, size = 20) {
  return useQuery({
    queryKey: [...cardKeys.transactions(cardId), page, size],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PagedResponse<CardTransaction>>>(
        `/cards/${cardId}/transactions?page=${page}&size=${size}`,
      );
      return res.data.data;
    },
    enabled: !!cardId,
  });
}
