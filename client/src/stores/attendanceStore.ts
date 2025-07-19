import { create } from 'zustand';
import type { Attendance, AttendanceInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';
import { api } from '../lib/api';

interface AttendanceStore extends ApiState {
  attendances: Attendance[];
  currentAttendance: Attendance | null;

  // Actions
  fetchAttendances: () => Promise<void>;
  fetchAttendance: (id: string) => Promise<void>;
  createAttendance: (data: AttendanceInput) => Promise<void>;
  updateAttendance: (id: string, data: Partial<AttendanceInput>) => Promise<void>;
  deleteAttendance: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useAttendanceStore = create<AttendanceStore>((set, get) => ({
  loading: false,
  error: null,
  attendances: [],
  currentAttendance: null,

  fetchAttendances: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<PaginatedData<Attendance>>('/api/attendance');
      set({ attendances: response.data.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchAttendance: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<{ data: Attendance }>(`/api/attendance/${id}`);
      set({ currentAttendance: response.data.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createAttendance: async (data: AttendanceInput) => {
    set({ loading: true, error: null });
    try {
      await api.post('/api/attendance', data);
      // Refresh the attendances list
      await get().fetchAttendances();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateAttendance: async (id: string, data: Partial<AttendanceInput>) => {
    set({ loading: true, error: null });
    try {
      await api.put(`/api/attendance/${id}`, data);
      // Refresh the attendances list
      await get().fetchAttendances();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  deleteAttendance: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/attendance/${id}`);
      // Refresh the attendances list
      await get().fetchAttendances();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
