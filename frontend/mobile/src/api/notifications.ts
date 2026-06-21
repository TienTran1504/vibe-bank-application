import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiResponse, AppNotification, PagedResponse, UnreadCountResponse } from '@bankapp/shared';
import { apiClient } from './apiClient';

export const notifKeys = {
  all: ['notifications'] as const,
  unread: ['notifications', 'unread-count'] as const,
};

export function useNotifications(page = 0, size = 20) {
  return useQuery({
    queryKey: [...notifKeys.all, page, size],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PagedResponse<AppNotification>>>(
        `/notifications?page=${page}&size=${size}`,
      );
      return res.data.data;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notifKeys.unread,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<UnreadCountResponse>>('/notifications/unread-count');
      return res.data.data.unreadCount;
    },
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.put(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notifKeys.all });
      queryClient.invalidateQueries({ queryKey: notifKeys.unread });
    },
  });
}
