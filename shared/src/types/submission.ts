// shared/src/types/submission.ts
import { z } from 'zod'

/**
 * Main submission interface
 */
export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  submitted_at: string
  content?: string | null // JSON string
  status?: 'submitted' | 'graded' | 'returned'
}

/**
 * Input type for creating/updating
 */
export type SubmissionInput = Omit<Submission, 'id' | 'submitted_at'>

/**
 * Zod schema for validation
 */
export const SubmissionSchema = z.object({
  assignment_id: z.string(),
  student_id: z.string(),
  content: z.string().optional().nullable(),
  status: z.enum(['submitted', 'graded', 'returned']).optional(),
})

/**
 * Response types
 */
export interface SubmissionListResponse {
  data: Submission[]
  count: number
}

export interface SubmissionResponse {
  data: Submission
}
