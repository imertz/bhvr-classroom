import { Hono } from 'hono'
import { Effect } from 'effect'
import { AttendanceSchema, AttendanceInput, makePartial } from 'shared/dist'
import type { AuthVariables } from '../types/auth'
import { effectValidator } from '../middleware/validator'
import { appRuntime } from '../services/AppRuntime'
import { AttendanceRepo } from '../services/AttendanceRepo'

const AttendanceUpdateSchema = makePartial(AttendanceInput.fields)

export const attendanceRoutes = new Hono<{ Variables: AuthVariables }>()
  /**
   * List attendance records (student-scoped if student, all if teacher/admin)
   */
  .get('/', async (c) => {
    const user = c.get('user')

    try {
      if (user?.role === 'student') {
        const attendances = await appRuntime.runPromise(
          AttendanceRepo.use((repo) => repo.findByStudentId(user.id))
        )
        return c.json({ data: attendances, count: attendances.length })
      }

      const attendances = await appRuntime.runPromise(
        AttendanceRepo.use((repo) => repo.findAll())
      )
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
      const attendances = await appRuntime.runPromise(
        AttendanceRepo.use((repo) => repo.findByStudentId(studentId))
      )
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
      const attendance = await appRuntime.runPromise(
        AttendanceRepo.use((repo) => repo.findById(id)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
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
  .post('/', effectValidator('json', AttendanceSchema), async (c) => {
    const data = c.req.valid('json')

    try {
      const attendance = await appRuntime.runPromise(
        AttendanceRepo.use((repo) => repo.create(data))
      )
      return c.json({ data: attendance }, 201)
    } catch (error) {
      console.error('Error creating attendance record:', error)
      return c.json({ error: 'Failed to create attendance record' }, 500)
    }
  })

  /**
   * Update attendance record
   */
  .put('/:id', effectValidator('json', AttendanceUpdateSchema), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    try {
      const attendance = await appRuntime.runPromise(
        AttendanceRepo.use((repo) => repo.update(id, data)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
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
      const deleted = await appRuntime.runPromise(
        AttendanceRepo.use((repo) => repo.delete(id))
      )
      if (!deleted) {
        return c.json({ error: 'Attendance record not found' }, 404)
      }
      return c.json({ message: 'Attendance record deleted successfully' })
    } catch (error) {
      console.error('Error deleting attendance record:', error)
      return c.json({ error: 'Failed to delete attendance record' }, 500)
    }
  })
