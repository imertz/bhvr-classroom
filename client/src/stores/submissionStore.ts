import { create } from 'zustand';
import type { Submission, SubmissionInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

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
      const response = await fetch(`${SERVER_URL}/submissions`);
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      const result = await response.json() as PaginatedData<Submission>;
      set({ submissions: result.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchSubmission: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/submissions/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch submission');
      }
      const result = await response.json() as { data: Submission };
      set({ currentSubmission: result.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createSubmission: async (data: SubmissionInput) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create submission');
      }
      // Refresh the submissions list
      await get().fetchSubmissions();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateSubmission: async (id: string, data: Partial<SubmissionInput>) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/submissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update submission');
      }
      // Refresh the submissions list
      await get().fetchSubmissions();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  deleteSubmission: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/submissions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete submission');
      }
      // Refresh the submissions list
      await get().fetchSubmissions();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
