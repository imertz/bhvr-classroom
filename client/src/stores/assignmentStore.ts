import { create } from 'zustand';
import type { Assignment, AssignmentInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

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
      const response = await fetch(`${SERVER_URL}/assignments`);
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      const result = await response.json() as PaginatedData<Assignment>;
      set({ assignments: result.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchAssignment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/assignments/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch assignment');
      }
      const result = await response.json() as { data: Assignment };
      set({ currentAssignment: result.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createAssignment: async (data: AssignmentInput) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create assignment');
      }
      // Refresh the assignments list
      await get().fetchAssignments();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateAssignment: async (id: string, data: Partial<AssignmentInput>) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update assignment');
      }
      // Refresh the assignments list
      await get().fetchAssignments();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  deleteAssignment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/assignments/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }
      // Refresh the assignments list
      await get().fetchAssignments();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
