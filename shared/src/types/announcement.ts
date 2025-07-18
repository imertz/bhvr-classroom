// shared/src/types/announcement.ts
import { z } from 'zod'

/**
 * Main announcement interface
 */
export interface Announcement {
  id: string
  class_id: string
  teacher_id: string
  title: string
  content: string
  created_at: string
  expires_at: string | null
}

/**
 * Input type for creating/updating
 */
export type AnnouncementInput = Omit<Announcement, 'id' | 'created_at'>

/**
 * Zod schema for validation
 */
export const AnnouncementSchema = z.object({
  class_id: z.string(),
  teacher_id: z.string(),
  title: z.string(),
  content: z.string(),
  // Accept ISO-like datetime strings with minutes and optional seconds (e.g., YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS)
  expires_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/, { message: 'Invalid datetime' }).nullable().default(null),
})

/**
 * Response types
 */
export interface AnnouncementListResponse {
  data: Announcement[]
  count: number
}

export interface AnnouncementResponse {
  data: Announcement
}
