import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client, unwrapJson } from '../../lib/api';
import type { Assignment, AssignmentInput } from 'shared/dist';

export const assignmentKeys = {
  all: ['assignments'] as const,
  lists: () => [...assignmentKeys.all, 'list'] as const,
  list: () => [...assignmentKeys.lists()] as const,
  details: () => [...assignmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...assignmentKeys.details(), id] as const,
};

export function useAssignments() {
  return useQuery({
    queryKey: assignmentKeys.list(),
    queryFn: async (): Promise<Assignment[]> => {
      const res = await unwrapJson(client.api.assignments.$get());
      return res.data as Assignment[];
    },
  });
}

export function useAssignment(id?: string) {
  return useQuery({
    queryKey: assignmentKeys.detail(id || ''),
    queryFn: async (): Promise<Assignment> => {
      const res = await unwrapJson(client.api.assignments[':id'].$get({ param: { id: id! } }));
      return res.data as Assignment;
    },
    enabled: Boolean(id),
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AssignmentInput): Promise<Assignment> => {
      const res = await unwrapJson(client.api.assignments.$post({ json: data }));
      return res.data as Assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AssignmentInput> }): Promise<Assignment> => {
      const res = await unwrapJson(client.api.assignments[':id'].$put({ param: { id }, json: data }));
      return res.data as Assignment;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.detail(id) });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      return unwrapJson(client.api.assignments[':id'].$delete({ param: { id } }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
    },
  });
}
