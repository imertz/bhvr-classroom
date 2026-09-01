import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client, unwrapJson } from '../../lib/api';
import type { Grade, GradeInput } from 'shared/dist';

export const gradeKeys = {
  all: ['grades'] as const,
  lists: () => [...gradeKeys.all, 'list'] as const,
  list: () => [...gradeKeys.lists()] as const,
  details: () => [...gradeKeys.all, 'detail'] as const,
  detail: (id: string) => [...gradeKeys.details(), id] as const,
};

export function useGrades() {
  return useQuery({
    queryKey: gradeKeys.list(),
    queryFn: async (): Promise<Grade[]> => {
      const res = await unwrapJson(client.api.grades.$get());
      return res.data as Grade[];
    },
  });
}

export function useGrade(id?: string) {
  return useQuery({
    queryKey: gradeKeys.detail(id || ''),
    queryFn: async (): Promise<Grade> => {
      const res = await unwrapJson(client.api.grades[':id'].$get({ param: { id: id! } }));
      return res.data as Grade;
    },
    enabled: Boolean(id),
  });
}

export function useCreateGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GradeInput): Promise<Grade> => {
      const res = await unwrapJson(client.api.grades.$post({ json: data }));
      return res.data as Grade;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.all });
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GradeInput> }): Promise<Grade> => {
      const res = await unwrapJson(client.api.grades[':id'].$put({ param: { id }, json: data }));
      return res.data as Grade;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.all });
      queryClient.invalidateQueries({ queryKey: gradeKeys.detail(id) });
    },
  });
}

export function useDeleteGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      return unwrapJson(client.api.grades[':id'].$delete({ param: { id } }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.all });
    },
  });
}
