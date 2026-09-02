// shared/src/types/teacher.ts
import { z } from 'zod'

/**
 * Main teacher interface
 */
export interface Teacher {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'teacher' | 'admin'
  created_at: string
  updated_at: string
}

export type TeacherInput = Omit<Teacher, 'id' | 'created_at' | 'updated_at' | 'role'> & {
  role?: 'teacher' | 'admin';
  password?: string;
}

/**
 * Zod schema for validation
 */
export const TeacherSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.enum(['teacher', 'admin']).default('teacher'),
})

/**
 * Teacher registration schema
 */
export const TeacherRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
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
