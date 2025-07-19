import { create } from 'zustand';
import type { Student, StudentInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';
import { api } from '../lib/api';

interface StudentStore extends ApiState {
  students: Student[];
  currentStudent: Student | null;

  // Actions
  fetchStudents: () => Promise<void>;
  fetchStudent: (id: string) => Promise<void>;
  createStudent: (data: StudentInput) => Promise<void>;
  updateStudent: (id: string, data: Partial<StudentInput>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useStudentStore = create<StudentStore>((set, get) => ({
  loading: false,
  error: null,
  students: [],
  currentStudent: null,

  fetchStudents: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<PaginatedData<Student>>('/api/students');
      set({ students: response.data.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchStudent: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<{ data: Student }>(`/api/students/${id}`);
      set({ currentStudent: response.data.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createStudent: async (data: StudentInput) => {
    set({ loading: true, error: null });
    try {
      await api.post('/api/students', data);
      // Refresh the students list
      await get().fetchStudents();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateStudent: async (id: string, data: Partial<StudentInput>) => {
    set({ loading: true, error: null });
    try {
      await api.put(`/api/students/${id}`, data);
      // Refresh the students list and current student if it's the one being updated
      await get().fetchStudents();
      if (get().currentStudent?.id === id) {
        await get().fetchStudent(id);
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  deleteStudent: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/students/${id}`);
      // Remove from local state and clear current student if it was deleted
      const { students, currentStudent } = get();
      set({
        students: students.filter(s => s.id !== id),
        currentStudent: currentStudent?.id === id ? null : currentStudent,
        loading: false
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
