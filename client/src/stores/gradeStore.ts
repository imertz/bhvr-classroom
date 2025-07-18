import { create } from 'zustand';
import type { Grade, GradeInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

interface GradeStore extends ApiState {
  grades: Grade[];
  currentGrade: Grade | null;

  // Actions
  fetchGrades: () => Promise<void>;
  fetchGrade: (id: string) => Promise<void>;
  createGrade: (data: GradeInput) => Promise<void>;
  updateGrade: (id: string, data: Partial<GradeInput>) => Promise<void>;
  deleteGrade: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useGradeStore = create<GradeStore>((set, get) => ({
  loading: false,
  error: null,
  grades: [],
  currentGrade: null,

  fetchGrades: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/grades`);
      if (!response.ok) {
        throw new Error('Failed to fetch grades');
      }
      const result = await response.json() as PaginatedData<Grade>;
      set({ grades: result.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchGrade: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/grades/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch grade');
      }
      const result = await response.json() as { data: Grade };
      set({ currentGrade: result.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createGrade: async (data: GradeInput) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create grade');
      }
      // Refresh the grades list
      await get().fetchGrades();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateGrade: async (id: string, data: Partial<GradeInput>) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/grades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update grade');
      }
      // Refresh the grades list
      await get().fetchGrades();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  deleteGrade: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/grades/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete grade');
      }
      // Refresh the grades list
      await get().fetchGrades();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
