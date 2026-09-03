import { Hono } from 'hono'
import { Effect } from 'effect'
import { GradeSchema, GradeInput, makePartial } from 'shared/dist'
import type { AuthVariables } from '../types/auth'
import { effectValidator } from '../middleware/validator'
import { appRuntime } from '../services/AppRuntime'
import { GradeRepo } from '../services/GradeRepo'
import { SubmissionRepo } from '../services/SubmissionRepo'
import { isConflictError } from '../utils/errors'

const GradeUpdateSchema = makePartial(GradeInput.fields)

export const gradeRoutes = new Hono<{ Variables: AuthVariables }>()
  /**
   * List grades (student-scoped if student, all if teacher/admin)
   */
  .get('/', async (c) => {
    const user = c.get('user')

    try {
      if (user?.role === 'student') {
        const grades = await appRuntime.runPromise(
          GradeRepo.use((repo) => repo.findByStudentId(user.id))
        )
        return c.json({ data: grades, count: grades.length })
      }

      const grades = await appRuntime.runPromise(
        GradeRepo.use((repo) => repo.findAll())
      )
      return c.json({ data: grades, count: grades.length })
    } catch (error) {
      console.error('Error listing grades:', error)
      return c.json({ error: 'Failed to list grades' }, 500)
    }
  })

  /**
   * Get grades for a specific student
   */
  .get('/student/:studentId', async (c) => {
    const user = c.get('user')
    const studentId = c.req.param('studentId')

    if (user?.role === 'student' && user.id !== studentId) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    try {
      const grades = await appRuntime.runPromise(
        GradeRepo.use((repo) => repo.findByStudentId(studentId))
      )
      return c.json({ data: grades, count: grades.length })
    } catch (error) {
      console.error('Error getting student grades:', error)
      return c.json({ error: 'Failed to get student grades' }, 500)
    }
  })

  /**
   * Get grade by ID
   */
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const user = c.get('user')

    try {
      const grade = await appRuntime.runPromise(
        GradeRepo.use((repo) => repo.findById(id)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
      if (!grade) {
        return c.json({ error: 'Grade not found' }, 404)
      }
      if (user?.role === 'student') {
        const submission = await appRuntime.runPromise(
          SubmissionRepo.use((repo) => repo.findByIdOrNull(grade.submission_id))
        )
        if (submission && submission.student_id !== user.id) {
          return c.json({ error: 'Forbidden: You cannot access other students\' grades' }, 403)
        }
      }
      return c.json({ data: grade })
    } catch (error) {
      console.error('Error getting grade:', error)
      return c.json({ error: 'Failed to get grade' }, 500)
    }
  })

  /**
   * Create new grade
   */
  .post('/', effectValidator('json', GradeSchema), async (c) => {
    const data = c.req.valid('json')
    const user = c.get('user')

    const gradedBy = user?.role === 'teacher' ? user.id : (data.graded_by || user?.id || '')
    const gradeData: GradeInput = { ...data, graded_by: gradedBy }

    try {
      const grade = await appRuntime.runPromise(
        GradeRepo.use((repo) => repo.create(gradeData))
      )
      return c.json({ data: grade }, 201)
    } catch (error) {
      if (isConflictError(error)) {
        return c.json({ error: error.message }, 409)
      }
      console.error('Error creating grade:', error)
      return c.json({ error: 'Failed to create grade' }, 500)
    }
  })

  /**
   * Update grade
   */
  .put('/:id', effectValidator('json', GradeUpdateSchema), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    try {
      const grade = await appRuntime.runPromise(
        GradeRepo.use((repo) => repo.update(id, data)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
      if (!grade) {
        return c.json({ error: 'Grade not found' }, 404)
      }
      return c.json({ data: grade })
    } catch (error) {
      if (isConflictError(error)) {
        return c.json({ error: error.message }, 409)
      }
      console.error('Error updating grade:', error)
      return c.json({ error: 'Failed to update grade' }, 500)
    }
  })

  /**
   * Delete grade
   */
  .delete('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const deleted = await appRuntime.runPromise(
        GradeRepo.use((repo) => repo.delete(id))
      )
      if (!deleted) {
        return c.json({ error: 'Grade not found' }, 404)
      }
      return c.json({ message: 'Grade deleted successfully' })
    } catch (error) {
      console.error('Error deleting grade:', error)
      return c.json({ error: 'Failed to delete grade' }, 500)
    }
  })
