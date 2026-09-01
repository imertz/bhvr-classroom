import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client, unwrapJson } from '../../lib/api';
import type { Attendance, AttendanceInput } from 'shared/dist';

export const attendanceKeys = {
  all: ['attendance'] as const,
  lists: () => [...attendanceKeys.all, 'list'] as const,
  list: () => [...attendanceKeys.lists()] as const,
  details: () => [...attendanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...attendanceKeys.details(), id] as const,
};

export function useAttendanceRecords() {
  return useQuery({
    queryKey: attendanceKeys.list(),
    queryFn: async (): Promise<Attendance[]> => {
      const res = await unwrapJson(client.api.attendance.$get());
      return res.data as Attendance[];
    },
  });
}

export function useAttendanceRecord(id?: string) {
  return useQuery({
    queryKey: attendanceKeys.detail(id || ''),
    queryFn: async (): Promise<Attendance> => {
      const res = await unwrapJson(client.api.attendance[':id'].$get({ param: { id: id! } }));
      return res.data as Attendance;
    },
    enabled: Boolean(id),
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AttendanceInput): Promise<Attendance> => {
      const res = await unwrapJson(client.api.attendance.$post({ json: data }));
      return res.data as Attendance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AttendanceInput> }): Promise<Attendance> => {
      const res = await unwrapJson(client.api.attendance[':id'].$put({ param: { id }, json: data }));
      return res.data as Attendance;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.detail(id) });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      return unwrapJson(client.api.attendance[':id'].$delete({ param: { id } }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}
