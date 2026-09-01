/**
 * @file attendance.ts
 * @description Handles all attendance-related API endpoints
 * 
 * Endpoints:
 * - GET    /attendance      - List all attendance records
 * - GET    /attendance/:id  - Get attendance record by ID
 * - POST   /attendance      - Create new attendance record
 * - PUT    /attendance/:id  - Update attendance record
 * - DELETE /attendance/:id  - Delete attendance record
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { AttendanceSchema } from 'shared/src/types/attendance'
import type { AuthVariables } from '../types/auth'
import {
  createAttendance,
  findAttendanceById,
  findAllAttendances,
  findAttendancesByStudentId,
  updateAttendance,
  deleteAttendance
} from '../db/database'

export const attendanceRoutes = new Hono<{ Variables: AuthVariables }>()
  /**
   * List attendance records (student-scoped if student, all if teacher/admin)
   */
  .get('/', async (c) => {
    const user = c.get('user')

    try {
      if (user?.role === 'student') {
        const attendances = await findAttendancesByStudentId(user.id)
        return c.json({ data: attendances, count: attendances.length })
      }

      const attendances = await findAllAttendances()
      return c.json({ data: attendances, count: attendances.length })
    } catch (error) {
      console.error('Error listing attendance records:', error)
      return c.json({ error: 'Failed to list attendance records' }, 500)
    }
  })

  /**
   * Get attendance records for a specific student
   */
  .get('/student/:studentId', async (c) => {
    const user = c.get('user')
    const studentId = c.req.param('studentId')

    if (user?.role === 'student' && user.id !== studentId) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    try {
      const attendances = await findAttendancesByStudentId(studentId)
      return c.json({ data: attendances, count: attendances.length })
    } catch (error) {
      console.error('Error getting student attendance:', error)
      return c.json({ error: 'Failed to get student attendance' }, 500)
    }
  })

  /**
   * Get attendance record by ID
   */
  .get('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const attendance = await findAttendanceById(id)
      if (!attendance) {
        return c.json({ error: 'Attendance record not found' }, 404)
      }
      return c.json({ data: attendance })
    } catch (error) {
      console.error('Error getting attendance record:', error)
      return c.json({ error: 'Failed to get attendance record' }, 500)
    }
  })

  /**
   * Create new attendance record
   */
  .post('/', zValidator('json', AttendanceSchema), async (c) => {
    const data = c.req.valid('json')

    try {
      const attendance = await createAttendance(data)
      return c.json({ data: attendance }, 201)
    } catch (error) {
      console.error('Error creating attendance record:', error)
      return c.json({ error: 'Failed to create attendance record' }, 500)
    }
  })

  /**
   * Update attendance record
   */
  .put('/:id', zValidator('json', AttendanceSchema.partial()), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    try {
      const attendance = await updateAttendance(id, data)
      if (!attendance) {
        return c.json({ error: 'Attendance record not found' }, 404)
      }
      return c.json({ data: attendance })
    } catch (error) {
      console.error('Error updating attendance record:', error)
      return c.json({ error: 'Failed to update attendance record' }, 500)
    }
  })

  /**
   * Delete attendance record
   */
  .delete('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const deleted = await deleteAttendance(id)
      if (!deleted) {
        return c.json({ error: 'Attendance record not found' }, 404)
      }
      return c.json({ message: 'Attendance record deleted successfully' })
    } catch (error) {
      console.error('Error deleting attendance record:', error)
      return c.json({ error: 'Failed to delete attendance record' }, 500)
    }
  })
