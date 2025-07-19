import { create } from 'zustand';
import type { Submission, SubmissionInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';
import { api } from '../lib/api';

interface SubmissionStore extends ApiState {
  submissions: Submission[];
  currentSubmission: Submission | null;

  // Actions
  fetchSubmissions: () => Promise<void>;
  fetchSubmission: (id: string) => Promise<void>;
  createSubmission: (data: SubmissionInput) => Promise<void>;
  updateSubmission: (id: string, data: Partial<SubmissionInput>) => Promise<void>;
  deleteSubmission: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useSubmissionStore = create<SubmissionStore>((set, get) => ({
  loading: false,
  error: null,
  submissions: [],
  currentSubmission: null,

  fetchSubmissions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<PaginatedData<Submission>>('/api/submissions');
      set({ submissions: response.data.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchSubmission: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<{ data: Submission }>(`/api/submissions/${id}`);
      set({ currentSubmission: response.data.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createSubmission: async (data: SubmissionInput) => {
    set({ loading: true, error: null });
    try {
      await api.post('/api/submissions', data);
      // Refresh the submissions list
      await get().fetchSubmissions();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateSubmission: async (id: string, data: Partial<SubmissionInput>) => {
    set({ loading: true, error: null });
    try {
      await api.put(`/api/submissions/${id}`, data);
      // Refresh the submissions list
      await get().fetchSubmissions();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  deleteSubmission: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/submissions/${id}`);
      // Refresh the submissions list
      await get().fetchSubmissions();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
