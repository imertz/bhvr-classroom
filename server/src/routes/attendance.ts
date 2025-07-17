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
import { AttendanceSchema, type Attendance, type AttendanceInput } from 'shared/src/types/attendance'
import {
  createAttendance,
  findAttendanceById,
  findAllAttendances,
  updateAttendance,
  deleteAttendance
} from '../db/database'

export const attendanceRoutes = new Hono()

/**
 * List all attendance records
 */
attendanceRoutes.get('/', async (c) => {
  try {
    const attendances = await findAllAttendances()
    return c.json({ data: attendances, count: attendances.length })
  } catch (error) {
    console.error('Error listing attendance records:', error)
    return c.json({ error: 'Failed to list attendance records' }, 500)
  }
})

/**
 * Get attendance record by ID
 */
attendanceRoutes.get('/:id', async (c) => {
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
attendanceRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const result = AttendanceSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 400)
  }

  try {
    const attendance = await createAttendance(result.data)
    return c.json({ data: attendance }, 201)
  } catch (error) {
    console.error('Error creating attendance record:', error)
    return c.json({ error: 'Failed to create attendance record' }, 500)
  }
})

/**
 * Update attendance record
 */
attendanceRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const result = AttendanceSchema.partial().safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 400)
  }

  try {
    const attendance = await updateAttendance(id, result.data)
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
attendanceRoutes.delete('/:id', async (c) => {
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
