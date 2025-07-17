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
  created_at: string
  updated_at: string
}

/**
 * Input type for creating/updating
 */
export type StudentInput = Omit<Student, 'id' | 'created_at' | 'updated_at'>

/**
 * Zod schema for validation
 */
export const StudentSchema = z.object({
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  date_of_birth: z.string().datetime(),
  grade_level: z.number().int(),
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
