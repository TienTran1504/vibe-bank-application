import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiResponse,
  Card,
  CreateVirtualCardRequest,
  FreezeCardRequest,
  SpendingLimitRequest,
} from '@bankapp/shared';
import { apiClient } from './apiClient';

export const cardKeys = {
  all: ['cards'] as const,
  detail: (id: string) => ['cards', id] as const,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cardKeys.all }),
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
