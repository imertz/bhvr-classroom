// shared/src/types/assignment.ts
import { z } from 'zod'

/**
 * Main assignment interface
 */
export interface Assignment {
  id: string
  class_id: string
  title: string
  description: string | null
  type: 'homework' | 'quiz' | 'test' | 'project'
  points_possible: number
  due_date: string
  created_at: string
  updated_at: string
}

/**
 * Input type for creating/updating
 */
export type AssignmentInput = Omit<Assignment, 'id' | 'created_at' | 'updated_at'>

/**
 * Zod schema for validation
 */
export const AssignmentSchema = z.object({
  class_id: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  type: z.enum(['homework', 'quiz', 'test', 'project']),
  points_possible: z.number().int(),
  // Accept ISO-like datetime strings with minutes and optional seconds (e.g., YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS)
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/, { message: 'Invalid datetime' }),
})

/**
 * Response types
 */
export interface AssignmentListResponse {
  data: Assignment[]
  count: number
}

export interface AssignmentResponse {
  data: Assignment
}
