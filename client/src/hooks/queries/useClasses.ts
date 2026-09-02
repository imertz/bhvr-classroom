import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client, unwrapJson } from '../../lib/api';
import type { Class, ClassInput } from 'shared/dist';

export const classKeys = {
  all: ['classes'] as const,
  lists: () => [...classKeys.all, 'list'] as const,
  list: () => [...classKeys.lists()] as const,
  details: () => [...classKeys.all, 'detail'] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
};

export function useClasses() {
  return useQuery({
    queryKey: classKeys.list(),
    queryFn: async (): Promise<Class[]> => {
      const res = await unwrapJson<{ data: Class[] }>(client.api.classes.$get());
      return res.data;
    },
  });
}

export function useClass(id?: string) {
  return useQuery({
    queryKey: classKeys.detail(id || ''),
    queryFn: async (): Promise<Class> => {
      const res = await unwrapJson<{ data: Class }>(client.api.classes[':id'].$get({ param: { id: id! } }));
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ClassInput): Promise<Class> => {
      const res = await unwrapJson<{ data: Class }>(client.api.classes.$post({ json: data }));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClassInput> }): Promise<Class> => {
      const res = await unwrapJson<{ data: Class }>(client.api.classes[':id'].$put({ param: { id }, json: data }));
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
      queryClient.invalidateQueries({ queryKey: classKeys.detail(id) });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      return unwrapJson(client.api.classes[':id'].$delete({ param: { id } }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}
