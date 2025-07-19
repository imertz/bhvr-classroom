import { create } from 'zustand';
import type { Class, ClassInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';
import { api } from '../lib/api';

interface ClassStore extends ApiState {
  classes: Class[];
  currentClass: Class | null;

  // Actions
  fetchClasses: () => Promise<void>;
  fetchClass: (id: string) => Promise<void>;
  createClass: (data: ClassInput) => Promise<void>;
  updateClass: (id: string, data: Partial<ClassInput>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useClassStore = create<ClassStore>((set, get) => ({
  loading: false,
  error: null,
  classes: [],
  currentClass: null,

  fetchClasses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<PaginatedData<Class>>('/api/classes');
      set({ classes: response.data.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchClass: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<{ data: Class }>(`/api/classes/${id}`);
      set({ currentClass: response.data.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createClass: async (data: ClassInput) => {
    set({ loading: true, error: null });
    try {
      await api.post('/api/classes', data);
      // Refresh the classes list
      await get().fetchClasses();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateClass: async (id: string, data: Partial<ClassInput>) => {
    set({ loading: true, error: null });
    try {
      await api.put(`/api/classes/${id}`, data);
      // Refresh the classes list and current class if it's the one being updated
      await get().fetchClasses();
      if (get().currentClass?.id === id) {
        await get().fetchClass(id);
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  deleteClass: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/classes/${id}`);
      // Remove from local state and clear current class if it was deleted
      const { classes, currentClass } = get();
      set({
        classes: classes.filter(c => c.id !== id),
        currentClass: currentClass?.id === id ? null : currentClass,
        loading: false
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
