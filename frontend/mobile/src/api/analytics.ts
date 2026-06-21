import { useQuery } from '@tanstack/react-query';
import { ApiResponse, SpendSummary } from '@bankapp/shared';
import { apiClient } from './apiClient';

export const analyticsKeys = {
  all: ['analytics'] as const,
  currentMonth: ['analytics', 'current-month'] as const,
};

export function useCurrentMonthSpend() {
  return useQuery({
    queryKey: analyticsKeys.currentMonth,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<SpendSummary>>('/analytics/spend/current-month');
      return res.data.data;
    },
  });
}

export function useSpendHistory() {
  return useQuery({
    queryKey: analyticsKeys.all,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<SpendSummary[]>>('/analytics/spend');
      return res.data.data;
    },
  });
}
