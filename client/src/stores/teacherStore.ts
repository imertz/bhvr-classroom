import { create } from 'zustand';
import type { Teacher, TeacherInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

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
      const response = await fetch(`${SERVER_URL}/teachers`);
      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }
      const result = await response.json() as PaginatedData<Teacher>;
      set({ teachers: result.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchTeacher: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/teachers/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch teacher');
      }
      const result = await response.json() as { data: Teacher };
      set({ currentTeacher: result.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createTeacher: async (data: TeacherInput) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create teacher');
      }
      // Refresh the teachers list
      await get().fetchTeachers();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateTeacher: async (id: string, data: Partial<TeacherInput>) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update teacher');
      }
      // Refresh the teachers list and current teacher if it's the one being updated
      await get().fetchTeachers();
      if (get().currentTeacher?.id === id) {
        await get().fetchTeacher(id);
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  deleteTeacher: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/teachers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete teacher');
      }
      // Remove from local state and clear current teacher if it was deleted
      const { teachers, currentTeacher } = get();
      set({
        teachers: teachers.filter(t => t.id !== id),
        currentTeacher: currentTeacher?.id === id ? null : currentTeacher,
        loading: false
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
