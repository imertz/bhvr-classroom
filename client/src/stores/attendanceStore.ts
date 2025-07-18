import { create } from 'zustand';
import type { Attendance, AttendanceInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

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
      const response = await fetch(`${SERVER_URL}/attendance`);
      if (!response.ok) {
        throw new Error('Failed to fetch attendances');
      }
      const result = await response.json() as PaginatedData<Attendance>;
      set({ attendances: result.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchAttendance: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/attendance/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attendance');
      }
      const result = await response.json() as { data: Attendance };
      set({ currentAttendance: result.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createAttendance: async (data: AttendanceInput) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create attendance');
      }
      // Refresh the attendances list
      await get().fetchAttendances();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateAttendance: async (id: string, data: Partial<AttendanceInput>) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/attendance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update attendance');
      }
      // Refresh the attendances list
      await get().fetchAttendances();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  deleteAttendance: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/attendance/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete attendance');
      }
      // Refresh the attendances list
      await get().fetchAttendances();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
