import { create } from 'zustand';
import type { Assignment, AssignmentInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';
import { api } from '../lib/api';

interface AssignmentStore extends ApiState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;

  // Actions
  fetchAssignments: () => Promise<void>;
  fetchAssignment: (id: string) => Promise<void>;
  createAssignment: (data: AssignmentInput) => Promise<void>;
  updateAssignment: (id: string, data: Partial<AssignmentInput>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  loading: false,
  error: null,
  assignments: [],
  currentAssignment: null,

  fetchAssignments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<PaginatedData<Assignment>>('/api/assignments');
      set({ assignments: response.data.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchAssignment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<{ data: Assignment }>(`/api/assignments/${id}`);
      set({ currentAssignment: response.data.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createAssignment: async (data: AssignmentInput) => {
    set({ loading: true, error: null });
    try {
      await api.post('/api/assignments', data);
      // Refresh the assignments list
      await get().fetchAssignments();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateAssignment: async (id: string, data: Partial<AssignmentInput>) => {
    set({ loading: true, error: null });
    try {
      await api.put(`/api/assignments/${id}`, data);
      // Refresh the assignments list
      await get().fetchAssignments();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  deleteAssignment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/assignments/${id}`);
      // Refresh the assignments list
      await get().fetchAssignments();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
