// shared/src/types/attendance.ts
import { z } from 'zod'

/**
 * Main attendance interface
 */
export interface Attendance {
  id: string
  student_id: string
  class_id: string
  date: string
  status: 'present' | 'absent' | 'tardy' | 'excused'
  notes: string | null
  recorded_at: string
}

/**
 * Input type for creating/updating
 */
export type AttendanceInput = Omit<Attendance, 'id' | 'recorded_at'>

/**
 * Zod schema for validation
 */
export const AttendanceSchema = z.object({
  student_id: z.string(),
  class_id: z.string(),
  date: z.string().datetime(),
  status: z.enum(['present', 'absent', 'tardy', 'excused']),
  notes: z.string().optional().nullable(),
})

/**
 * Response types
 */
export interface AttendanceListResponse {
  data: Attendance[]
  count: number
}

export interface AttendanceResponse {
  data: Attendance
}
