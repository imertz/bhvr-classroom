import { create } from 'zustand';
import type { Enrollment, EnrollmentInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';
import { api } from '../lib/api';

interface EnrollmentStore extends ApiState {
  enrollments: Enrollment[];
  currentEnrollment: Enrollment | null;

  // Actions
  fetchEnrollments: () => Promise<void>;
  fetchEnrollment: (id: string) => Promise<void>;
  createEnrollment: (data: EnrollmentInput) => Promise<void>;
  updateEnrollment: (id: string, data: Partial<EnrollmentInput>) => Promise<void>;
  deleteEnrollment: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useEnrollmentStore = create<EnrollmentStore>((set, get) => ({
  loading: false,
  error: null,
  enrollments: [],
  currentEnrollment: null,

  fetchEnrollments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<PaginatedData<Enrollment>>('/api/enrollments');
      set({ enrollments: response.data.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchEnrollment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<{ data: Enrollment }>(`/api/enrollments/${id}`);
      set({ currentEnrollment: response.data.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createEnrollment: async (data: EnrollmentInput) => {
    set({ loading: true, error: null });
    try {
      await api.post('/api/enrollments', data);
      // Refresh the enrollments list
      await get().fetchEnrollments();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateEnrollment: async (id: string, data: Partial<EnrollmentInput>) => {
    set({ loading: true, error: null });
    try {
      await api.put(`/api/enrollments/${id}`, data);
      // Refresh the enrollments list
      await get().fetchEnrollments();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  deleteEnrollment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/enrollments/${id}`);
      // Refresh the enrollments list
      await get().fetchEnrollments();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
