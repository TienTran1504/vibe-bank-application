import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse, UserProfile, UpdateProfileRequest } from '@bankapp/shared';
import { apiClient } from './apiClient';

export const userKeys = {
  me: ['users', 'me'] as const,
};

export function useMyProfile() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<UserProfile>>('/users/me');
      return res.data.data;
    },
    retry: 1,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const res = await apiClient.put<ApiResponse<UserProfile>>('/users/me', data);
      return res.data.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(userKeys.me, updated);
    },
  });
}
