import { Hono } from 'hono'
import { Effect } from 'effect'
import { TeacherCreateSchema, TeacherInput, makePartial } from 'shared/dist'
import { effectValidator } from '../middleware/validator'
import { appRuntime } from '../services/AppRuntime'
import { TeacherRepo } from '../services/TeacherRepo'
import { isConflictError } from '../utils/errors'
import type { AuthVariables } from '../types/auth'

const TeacherUpdateSchema = makePartial(TeacherInput.fields)

export const teacherRoutes = new Hono<{ Variables: AuthVariables }>()
  /**
   * List all teachers
   */
  .get('/', async (c) => {
    try {
      const teachers = await appRuntime.runPromise(
        TeacherRepo.use((repo) => repo.findAll())
      )
      return c.json({ data: teachers, count: teachers.length })
    } catch (error) {
      console.error('Error listing teachers:', error)
      return c.json({ error: 'Failed to list teachers' }, 500)
    }
  })

  /**
   * Get teacher by ID
   */
  .get('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const teacher = await appRuntime.runPromise(
        TeacherRepo.use((repo) => repo.findById(id)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
      if (!teacher) {
        return c.json({ error: 'Teacher not found' }, 404)
      }
      return c.json({ data: teacher })
    } catch (error) {
      console.error('Error getting teacher:', error)
      return c.json({ error: 'Failed to get teacher' }, 500)
    }
  })

  /**
   * Create new teacher
   */
  .post('/', effectValidator('json', TeacherCreateSchema), async (c) => {
    const data = c.req.valid('json')

    try {
      const teacher = await appRuntime.runPromise(
        TeacherRepo.use((repo) => repo.create(data))
      )
      return c.json({ data: teacher }, 201)
    } catch (error) {
      if (isConflictError(error)) {
        return c.json({ error: error.message }, 409)
      }
      console.error('Error creating teacher:', error)
      return c.json({ error: 'Failed to create teacher' }, 500)
    }
  })

  /**
   * Update teacher
   */
  .put('/:id', effectValidator('json', TeacherUpdateSchema), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    try {
      const teacher = await appRuntime.runPromise(
        TeacherRepo.use((repo) => repo.update(id, data)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
      if (!teacher) {
        return c.json({ error: 'Teacher not found' }, 404)
      }
      return c.json({ data: teacher })
    } catch (error) {
      if (isConflictError(error)) {
        return c.json({ error: error.message }, 409)
      }
      console.error('Error updating teacher:', error)
      return c.json({ error: 'Failed to update teacher' }, 500)
    }
  })

  /**
   * Delete teacher
   */
  .delete('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const deleted = await appRuntime.runPromise(
        TeacherRepo.use((repo) => repo.delete(id))
      )
      if (!deleted) {
        return c.json({ error: 'Teacher not found' }, 404)
      }
      return c.json({ message: 'Teacher deleted successfully' })
    } catch (error) {
      console.error('Error deleting teacher:', error)
      return c.json({ error: 'Failed to delete teacher' }, 500)
    }
  })
