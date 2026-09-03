import { Hono } from 'hono'
import { Effect } from 'effect'
import { StudentCreateSchema, StudentInput, makePartial } from 'shared/dist'
import type { Student } from 'shared/dist'
import { effectValidator } from '../middleware/validator'
import { appRuntime } from '../services/AppRuntime'
import { StudentRepo } from '../services/StudentRepo'
import { isConflictError } from '../utils/errors'
import type { AuthVariables } from '../types/auth'

const StudentUpdateSchema = makePartial(StudentInput.fields)

function sanitizeStudent(student: Student, currentUserId?: string, isStaff?: boolean): Student {
  if (isStaff || (currentUserId && currentUserId === student.id)) {
    return student
  }
  return {
    ...student,
    date_of_birth: '••••-••-••',
    email: student.email.replace(/^(.)(.*)(@.*)$/, (_m, first, middle, domain) => `${first}${'*'.repeat(Math.min(middle.length, 5))}${domain}`)
  }
}

export const studentRoutes = new Hono<{ Variables: AuthVariables }>()
  /**
   * List all students
   */
  .get('/', async (c) => {
    const user = c.get('user')
    const isStaff = user?.role === 'teacher' || user?.role === 'admin'

    try {
      const students = await appRuntime.runPromise(
        StudentRepo.use((repo) => repo.findAll())
      )
      const sanitized = students.map((s) => sanitizeStudent(s, user?.id, isStaff))
      return c.json({ data: sanitized, count: sanitized.length })
    } catch (error) {
      console.error('Error listing students:', error)
      return c.json({ error: 'Failed to list students' }, 500)
    }
  })

  /**
   * Get student by ID
   */
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const user = c.get('user')
    const isStaff = user?.role === 'teacher' || user?.role === 'admin'

    try {
      const student = await appRuntime.runPromise(
        StudentRepo.use((repo) => repo.findById(id)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
      if (!student) {
        return c.json({ error: 'Student not found' }, 404)
      }
      return c.json({ data: sanitizeStudent(student, user?.id, isStaff) })
    } catch (error) {
      console.error('Error getting student:', error)
      return c.json({ error: 'Failed to get student' }, 500)
    }
  })

  /**
   * Create new student
   */
  .post('/', effectValidator('json', StudentCreateSchema), async (c) => {
    const data = c.req.valid('json')

    try {
      const student = await appRuntime.runPromise(
        StudentRepo.use((repo) => repo.create(data))
      )
      return c.json({ data: student }, 201)
    } catch (error) {
      if (isConflictError(error)) {
        return c.json({ error: error.message }, 409)
      }
      console.error('Error creating student:', error)
      return c.json({ error: 'Failed to create student' }, 500)
    }
  })

  /**
   * Update student
   */
  .put('/:id', effectValidator('json', StudentUpdateSchema), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    try {
      const student = await appRuntime.runPromise(
        StudentRepo.use((repo) => repo.update(id, data)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
      if (!student) {
        return c.json({ error: 'Student not found' }, 404)
      }
      return c.json({ data: student })
    } catch (error) {
      if (isConflictError(error)) {
        return c.json({ error: error.message }, 409)
      }
      console.error('Error updating student:', error)
      return c.json({ error: 'Failed to update student' }, 500)
    }
  })

  /**
   * Delete student
   */
  .delete('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const deleted = await appRuntime.runPromise(
        StudentRepo.use((repo) => repo.delete(id))
      )
      if (!deleted) {
        return c.json({ error: 'Student not found' }, 404)
      }
      return c.json({ message: 'Student deleted successfully' })
    } catch (error) {
      console.error('Error deleting student:', error)
      return c.json({ error: 'Failed to delete student' }, 500)
    }
  })

  /**
   * Get students for a specific class
   */
  .get('/class/:classId', async (c) => {
    const classId = c.req.param('classId')
    const user = c.get('user')
    const isStaff = user?.role === 'teacher' || user?.role === 'admin'

    try {
      const students = await appRuntime.runPromise(
        StudentRepo.use((repo) => repo.findByClassId(classId))
      )
      const sanitized = students.map((s) => sanitizeStudent(s, user?.id, isStaff))
      return c.json({ data: sanitized, count: sanitized.length })
    } catch (error) {
      console.error('Error getting class students:', error)
      return c.json({ error: 'Failed to get class students' }, 500)
    }
  })
