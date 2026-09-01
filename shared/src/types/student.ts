// shared/src/types/student.ts
import { z } from 'zod'

/**
 * Main student interface
 */
export interface Student {
  id: string
  email: string
  first_name: string
  last_name: string
  date_of_birth: string
  grade_level: number
  role?: 'student'
  password_hash?: string | null
  created_at: string
  updated_at: string
}

/**
 * Input type for creating/updating
 */
export type StudentInput = Omit<Student, 'id' | 'created_at' | 'updated_at'> & {
  password?: string;
}

/**
 * Zod schema for validation
 */
export const StudentSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}(?:T.*)?$/, { message: 'Invalid date format' }),
  grade_level: z.number().int(),
  password: z.string().min(8).optional(),
})

/**
 * Response types
 */
export interface StudentListResponse {
  data: Student[]
  count: number
}

export interface StudentResponse {
  data: Student
}
