import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client, unwrapJson } from '../../lib/api';
import type { Submission, SubmissionInput } from 'shared/dist';

export const submissionKeys = {
  all: ['submissions'] as const,
  lists: () => [...submissionKeys.all, 'list'] as const,
  list: () => [...submissionKeys.lists()] as const,
  details: () => [...submissionKeys.all, 'detail'] as const,
  detail: (id: string) => [...submissionKeys.details(), id] as const,
};

export function useSubmissions() {
  return useQuery({
    queryKey: submissionKeys.list(),
    queryFn: async (): Promise<Submission[]> => {
      const res = await unwrapJson(client.api.submissions.$get());
      return res.data as Submission[];
    },
  });
}

export function useSubmission(id?: string) {
  return useQuery({
    queryKey: submissionKeys.detail(id || ''),
    queryFn: async (): Promise<Submission> => {
      const res = await unwrapJson(client.api.submissions[':id'].$get({ param: { id: id! } }));
      return res.data as Submission;
    },
    enabled: Boolean(id),
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SubmissionInput): Promise<Submission> => {
      const res = await unwrapJson(client.api.submissions.$post({ json: data }));
      return res.data as Submission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
    },
  });
}

export function useUpdateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SubmissionInput> }): Promise<Submission> => {
      const res = await unwrapJson(client.api.submissions[':id'].$put({ param: { id }, json: data }));
      return res.data as Submission;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
      queryClient.invalidateQueries({ queryKey: submissionKeys.detail(id) });
    },
  });
}

export function useDeleteSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      return unwrapJson(client.api.submissions[':id'].$delete({ param: { id } }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
    },
  });
}
