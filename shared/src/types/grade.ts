// shared/src/types/grade.ts
import { z } from 'zod'

/**
 * Main grade interface
 */
export interface Grade {
  id: string
  submission_id: string
  points_earned: number
  feedback?: string | null
  graded_at: string
  graded_by: string
}

/**
 * Input type for creating/updating
 */
export type GradeInput = Omit<Grade, 'id' | 'graded_at'>

/**
 * Zod schema for validation
 */
export const GradeSchema = z.object({
  submission_id: z.string(),
  points_earned: z.number().int(),
  feedback: z.string().optional().nullable(),
  graded_by: z.string(),
})

/**
 * Response types
 */
export interface GradeListResponse {
  data: Grade[]
  count: number
}

export interface GradeResponse {
  data: Grade
}
