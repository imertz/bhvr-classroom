import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client, unwrapJson } from '../../lib/api';
import type { Teacher, TeacherInput } from 'shared/dist';

export const teacherKeys = {
  all: ['teachers'] as const,
  lists: () => [...teacherKeys.all, 'list'] as const,
  list: () => [...teacherKeys.lists()] as const,
  details: () => [...teacherKeys.all, 'detail'] as const,
  detail: (id: string) => [...teacherKeys.details(), id] as const,
};

export function useTeachers() {
  return useQuery({
    queryKey: teacherKeys.list(),
    queryFn: async (): Promise<Teacher[]> => {
      const res = await unwrapJson<{ data: Teacher[] }>(client.api.teachers.$get());
      return res.data;
    },
  });
}

export function useTeacher(id?: string) {
  return useQuery({
    queryKey: teacherKeys.detail(id || ''),
    queryFn: async (): Promise<Teacher> => {
      const res = await unwrapJson<{ data: Teacher }>(client.api.teachers[':id'].$get({ param: { id: id! } }));
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TeacherInput): Promise<Teacher> => {
      const res = await unwrapJson<{ data: Teacher }>(client.api.teachers.$post({ json: data }));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all });
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TeacherInput> }): Promise<Teacher> => {
      const res = await unwrapJson<{ data: Teacher }>(client.api.teachers[':id'].$put({ param: { id }, json: data }));
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all });
      queryClient.invalidateQueries({ queryKey: teacherKeys.detail(id) });
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      return unwrapJson(client.api.teachers[':id'].$delete({ param: { id } }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all });
    },
  });
}
