import { create } from 'zustand';
import type { Enrollment, EnrollmentInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

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
      const response = await fetch(`${SERVER_URL}/enrollments`);
      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }
      const result = await response.json() as PaginatedData<Enrollment>;
      set({ enrollments: result.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchEnrollment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/enrollments/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch enrollment');
      }
      const result = await response.json() as { data: Enrollment };
      set({ currentEnrollment: result.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createEnrollment: async (data: EnrollmentInput) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create enrollment');
      }
      // Refresh the enrollments list
      await get().fetchEnrollments();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateEnrollment: async (id: string, data: Partial<EnrollmentInput>) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/enrollments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update enrollment');
      }
      // Refresh the enrollments list
      await get().fetchEnrollments();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  deleteEnrollment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/enrollments/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete enrollment');
      }
      // Refresh the enrollments list
      await get().fetchEnrollments();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
