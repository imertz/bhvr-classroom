// shared/src/types/enrollment.ts
import { z } from 'zod'

/**
 * Main enrollment interface
 */
export interface Enrollment {
  id: string
  student_id: string
  class_id: string
  enrolled_at: string
  status: 'active' | 'dropped' | 'completed'
}

/**
 * Input type for creating/updating
 */
export type EnrollmentInput = Omit<Enrollment, 'id' | 'enrolled_at' | 'status'> & {
  status?: 'active' | 'dropped' | 'completed';
}

/**
 * Zod schema for validation
 */
export const EnrollmentSchema = z.object({
  student_id: z.string(),
  class_id: z.string(),
  status: z.enum(['active', 'dropped', 'completed']).optional(),
})

/**
 * Response types
 */
export interface EnrollmentListResponse {
  data: Enrollment[]
  count: number
}

export interface EnrollmentResponse {
  data: Enrollment
}
