import { create } from 'zustand';
import type { Announcement, AnnouncementInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';
import { api } from '../lib/api';

interface AnnouncementStore extends ApiState {
  announcements: Announcement[];
  currentAnnouncement: Announcement | null;

  // Actions
  fetchAnnouncements: () => Promise<void>;
  fetchAnnouncement: (id: string) => Promise<void>;
  createAnnouncement: (data: AnnouncementInput) => Promise<void>;
  updateAnnouncement: (id: string, data: Partial<AnnouncementInput>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useAnnouncementStore = create<AnnouncementStore>((set, get) => ({
  loading: false,
  error: null,
  announcements: [],
  currentAnnouncement: null,

  fetchAnnouncements: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<PaginatedData<Announcement>>('/api/announcements');
      set({ announcements: response.data.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchAnnouncement: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<{ data: Announcement }>(`/api/announcements/${id}`);
      set({ currentAnnouncement: response.data.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createAnnouncement: async (data: AnnouncementInput) => {
    set({ loading: true, error: null });
    try {
      await api.post('/api/announcements', data);
      // Refresh the announcements list
      await get().fetchAnnouncements();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateAnnouncement: async (id: string, data: Partial<AnnouncementInput>) => {
    set({ loading: true, error: null });
    try {
      await api.put(`/api/announcements/${id}`, data);
      // Refresh the announcements list
      await get().fetchAnnouncements();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  deleteAnnouncement: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/announcements/${id}`);
      // Refresh the announcements list
      await get().fetchAnnouncements();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
