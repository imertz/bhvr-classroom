import { create } from 'zustand';
import type { Student, StudentInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

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
      const response = await fetch(`${SERVER_URL}/students`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const result = await response.json() as PaginatedData<Student>;
      set({ students: result.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchStudent: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/students/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch student');
      }
      const result = await response.json() as { data: Student };
      set({ currentStudent: result.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createStudent: async (data: StudentInput) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create student');
      }
      // Refresh the students list
      await get().fetchStudents();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateStudent: async (id: string, data: Partial<StudentInput>) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update student');
      }
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
      const response = await fetch(`${SERVER_URL}/students/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete student');
      }
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
