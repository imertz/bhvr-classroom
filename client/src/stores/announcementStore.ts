import { create } from 'zustand';
import type { Announcement, AnnouncementInput } from 'shared/dist';
import type { ApiState, PaginatedData } from './types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

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
      const response = await fetch(`${SERVER_URL}/announcements`);
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }
      const result = await response.json() as PaginatedData<Announcement>;
      set({ announcements: result.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  fetchAnnouncement: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/announcements/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch announcement');
      }
      const result = await response.json() as { data: Announcement };
      set({ currentAnnouncement: result.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  createAnnouncement: async (data: AnnouncementInput) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create announcement');
      }
      // Refresh the announcements list
      await get().fetchAnnouncements();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateAnnouncement: async (id: string, data: Partial<AnnouncementInput>) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update announcement');
      }
      // Refresh the announcements list
      await get().fetchAnnouncements();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  deleteAnnouncement: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${SERVER_URL}/announcements/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }
      // Refresh the announcements list
      await get().fetchAnnouncements();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
