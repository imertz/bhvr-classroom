import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client, unwrapJson } from '../../lib/api';
import type { Enrollment, EnrollmentInput } from 'shared/dist';

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  lists: () => [...enrollmentKeys.all, 'list'] as const,
  list: () => [...enrollmentKeys.lists()] as const,
  details: () => [...enrollmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...enrollmentKeys.details(), id] as const,
};

export function useEnrollments() {
  return useQuery({
    queryKey: enrollmentKeys.list(),
    queryFn: async (): Promise<Enrollment[]> => {
      const res = await unwrapJson<{ data: Enrollment[] }>(client.api.enrollments.$get());
      return res.data;
    },
  });
}

export function useEnrollment(id?: string) {
  return useQuery({
    queryKey: enrollmentKeys.detail(id || ''),
    queryFn: async (): Promise<Enrollment> => {
      const res = await unwrapJson<{ data: Enrollment }>(client.api.enrollments[':id'].$get({ param: { id: id! } }));
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: EnrollmentInput): Promise<Enrollment> => {
      const res = await unwrapJson<{ data: Enrollment }>(client.api.enrollments.$post({ json: data }));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
    },
  });
}

export function useUpdateEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EnrollmentInput> }): Promise<Enrollment> => {
      const res = await unwrapJson<{ data: Enrollment }>(client.api.enrollments[':id'].$put({ param: { id }, json: data }));
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.detail(id) });
    },
  });
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      return unwrapJson(client.api.enrollments[':id'].$delete({ param: { id } }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
    },
  });
}
