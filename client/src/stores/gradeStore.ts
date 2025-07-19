import { create } from 'zustand';
import type { Grade, GradeInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';
import { api } from '../lib/api';

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
      const response = await api.get<PaginatedData<Grade>>('/api/grades');
      set({ grades: response.data.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchGrade: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<{ data: Grade }>(`/api/grades/${id}`);
      set({ currentGrade: response.data.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createGrade: async (data: GradeInput) => {
    set({ loading: true, error: null });
    try {
      await api.post('/api/grades', data);
      // Refresh the grades list
      await get().fetchGrades();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateGrade: async (id: string, data: Partial<GradeInput>) => {
    set({ loading: true, error: null });
    try {
      await api.put(`/api/grades/${id}`, data);
      // Refresh the grades list
      await get().fetchGrades();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  deleteGrade: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/grades/${id}`);
      // Refresh the grades list
      await get().fetchGrades();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
