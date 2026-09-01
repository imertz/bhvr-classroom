import { create } from 'zustand';
import type { Teacher, TeacherInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';
import { api } from '../lib/api';
import { getErrorMessage } from '../lib/errorUtils';

interface TeacherStore extends ApiState {
  teachers: Teacher[];
  currentTeacher: Teacher | null;

  // Actions
  fetchTeachers: () => Promise<void>;
  fetchTeacher: (id: string) => Promise<void>;
  createTeacher: (data: TeacherInput) => Promise<void>;
  updateTeacher: (id: string, data: Partial<TeacherInput>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTeacherStore = create<TeacherStore>((set, get) => ({
  loading: false,
  error: null,
  teachers: [],
  currentTeacher: null,

  fetchTeachers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<PaginatedData<Teacher>>('/api/teachers');
      set({ teachers: response.data.data, loading: false });
    } catch (error) {
      set({ error: getErrorMessage(error, 'Failed to fetch teachers'), loading: false });
    }
  },

  fetchTeacher: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<{ data: Teacher }>(`/api/teachers/${id}`);
      set({ currentTeacher: response.data.data, loading: false });
    } catch (error) {
      set({ error: getErrorMessage(error, 'Failed to fetch teacher'), loading: false });
    }
  },

  createTeacher: async (data: TeacherInput) => {
    set({ loading: true, error: null });
    try {
      await api.post('/api/teachers', data);
      // Refresh the teachers list
      await get().fetchTeachers();
    } catch (error) {
      set({ error: getErrorMessage(error, 'Failed to create teacher'), loading: false });
    }
  },

  updateTeacher: async (id: string, data: Partial<TeacherInput>) => {
    set({ loading: true, error: null });
    try {
      await api.put(`/api/teachers/${id}`, data);
      // Refresh the teachers list and current teacher if it's the one being updated
      await get().fetchTeachers();
      if (get().currentTeacher?.id === id) {
        await get().fetchTeacher(id);
      }
    } catch (error) {
      set({ error: getErrorMessage(error, 'Failed to update teacher'), loading: false });
    }
  },

  deleteTeacher: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/teachers/${id}`);
      // Remove from local state and clear current teacher if it was deleted
      const { teachers, currentTeacher } = get();
      set({
        teachers: teachers.filter(t => t.id !== id),
        currentTeacher: currentTeacher?.id === id ? null : currentTeacher,
        loading: false
      });
    } catch (error) {
      set({ error: getErrorMessage(error, 'Failed to delete teacher'), loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
