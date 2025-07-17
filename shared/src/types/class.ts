// shared/src/types/class.ts
import { z } from 'zod'

/**
 * Main class interface
 */
export interface Class {
  id: string
  name: string
  subject: string
  teacher_id: string
  room_number?: string | null
  schedule?: string | null // JSON string
  created_at: string
  updated_at: string
}

/**
 * Input type for creating/updating
 */
export type ClassInput = Omit<Class, 'id' | 'created_at' | 'updated_at'>

/**
 * Zod schema for validation
 */
export const ClassSchema = z.object({
  name: z.string(),
  subject: z.string(),
  teacher_id: z.string(),
  room_number: z.string().optional().nullable(),
  schedule: z.string().optional().nullable(),
})

/**
 * Response types
 */
export interface ClassListResponse {
  data: Class[]
  count: number
}

export interface ClassResponse {
  data: Class
}
