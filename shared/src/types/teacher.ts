// shared/src/types/teacher.ts
import { z } from 'zod'

/**
 * Main teacher interface
 */
export interface Teacher {
  id: string
  email: string
  password_hash: string
  first_name: string
  last_name: string
  created_at: string
  updated_at: string
}

/**
 * Input type for creating/updating
 */
export type TeacherInput = Omit<Teacher, 'id' | 'created_at' | 'updated_at' | 'password_hash'> & { password?: string }

/**
 * Zod schema for validation
 */
export const TeacherSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string(),
  last_name: z.string(),
})

/**
 * Response types
 */
export interface TeacherListResponse {
  data: Teacher[]
  count: number
}

export interface TeacherResponse {
  data: Teacher
}
