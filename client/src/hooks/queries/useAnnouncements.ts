import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client, unwrapJson } from '../../lib/api';
import type { Announcement, AnnouncementInput } from 'shared/dist';

export const announcementKeys = {
  all: ['announcements'] as const,
  lists: () => [...announcementKeys.all, 'list'] as const,
  list: () => [...announcementKeys.lists()] as const,
  details: () => [...announcementKeys.all, 'detail'] as const,
  detail: (id: string) => [...announcementKeys.details(), id] as const,
};

export function useAnnouncements() {
  return useQuery({
    queryKey: announcementKeys.list(),
    queryFn: async (): Promise<Announcement[]> => {
      const res = await unwrapJson(client.api.announcements.$get());
      return res.data as Announcement[];
    },
  });
}

export function useAnnouncement(id?: string) {
  return useQuery({
    queryKey: announcementKeys.detail(id || ''),
    queryFn: async (): Promise<Announcement> => {
      const res = await unwrapJson(client.api.announcements[':id'].$get({ param: { id: id! } }));
      return res.data as Announcement;
    },
    enabled: Boolean(id),
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AnnouncementInput): Promise<Announcement> => {
      const res = await unwrapJson(client.api.announcements.$post({ json: data }));
      return res.data as Announcement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AnnouncementInput> }): Promise<Announcement> => {
      const res = await unwrapJson(client.api.announcements[':id'].$put({ param: { id }, json: data }));
      return res.data as Announcement;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all });
      queryClient.invalidateQueries({ queryKey: announcementKeys.detail(id) });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      return unwrapJson(client.api.announcements[':id'].$delete({ param: { id } }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
}
