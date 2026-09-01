import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client, unwrapJson } from '../../lib/api';
import type { Student, StudentInput } from 'shared/dist';

export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: () => [...studentKeys.lists()] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};

export function useStudents() {
  return useQuery({
    queryKey: studentKeys.list(),
    queryFn: async (): Promise<Student[]> => {
      const res = await unwrapJson(client.api.students.$get());
      return res.data as Student[];
    },
  });
}

export function useStudent(id?: string) {
  return useQuery({
    queryKey: studentKeys.detail(id || ''),
    queryFn: async (): Promise<Student> => {
      const res = await unwrapJson(client.api.students[':id'].$get({ param: { id: id! } }));
      return res.data as Student;
    },
    enabled: Boolean(id),
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: StudentInput): Promise<Student> => {
      const res = await unwrapJson(client.api.students.$post({ json: data }));
      return res.data as Student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StudentInput> }): Promise<Student> => {
      const res = await unwrapJson(client.api.students[':id'].$put({ param: { id }, json: data }));
      return res.data as Student;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(id) });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      return unwrapJson(client.api.students[':id'].$delete({ param: { id } }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
  });
}
