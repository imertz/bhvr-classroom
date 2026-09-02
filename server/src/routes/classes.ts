import { Hono } from 'hono'
import { Effect } from 'effect'
import { ClassSchema, ClassInput, makePartial } from 'shared/dist'
import type { AuthVariables } from '../types/auth'
import { effectValidator } from '../middleware/validator'
import { appRuntime } from '../services/AppRuntime'
import { ClassRepo } from '../services/ClassRepo'

const ClassUpdateSchema = makePartial(ClassInput.fields)

export const classRoutes = new Hono<{ Variables: AuthVariables }>()
  /**
   * List classes (student-scoped if student, all otherwise)
   */
  .get('/', async (c) => {
    const user = c.get('user')

    try {
      if (user?.role === 'student') {
        const classes = await appRuntime.runPromise(
          ClassRepo.use((repo) => repo.findByStudentId(user.id))
        )
        return c.json({ data: classes, count: classes.length })
      }

      const classes = await appRuntime.runPromise(
        ClassRepo.use((repo) => repo.findAll())
      )
      return c.json({ data: classes, count: classes.length })
    } catch (error) {
      console.error('Error listing classes:', error)
      return c.json({ error: 'Failed to list classes' }, 500)
    }
  })

  /**
   * Get classes for a specific student
   */
  .get('/student/:studentId', async (c) => {
    const studentId = c.req.param('studentId')

    try {
      const classes = await appRuntime.runPromise(
        ClassRepo.use((repo) => repo.findByStudentId(studentId))
      )
      return c.json({ data: classes, count: classes.length })
    } catch (error) {
      console.error('Error getting student classes:', error)
      return c.json({ error: 'Failed to get student classes' }, 500)
    }
  })

  /**
   * Get complete class details by ID
   */
  .get('/:id/details', async (c) => {
    const id = c.req.param('id')

    try {
      const details = await appRuntime.runPromise(
        ClassRepo.use((repo) => repo.getDetails(id)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
      if (!details) {
        return c.json({ error: 'Class not found' }, 404)
      }
      return c.json({ data: details })
    } catch (error) {
      console.error('Error getting class details:', error)
      return c.json({ error: 'Failed to get class details' }, 500)
    }
  })

  /**
   * Get class by ID
   */
  .get('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const class_ = await appRuntime.runPromise(
        ClassRepo.use((repo) => repo.findById(id)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
      if (!class_) {
        return c.json({ error: 'Class not found' }, 404)
      }
      return c.json({ data: class_ })
    } catch (error) {
      console.error('Error getting class:', error)
      return c.json({ error: 'Failed to get class' }, 500)
    }
  })

  /**
   * Create new class
   */
  .post('/', effectValidator('json', ClassSchema), async (c) => {
    const data = c.req.valid('json')

    try {
      const class_ = await appRuntime.runPromise(
        ClassRepo.use((repo) => repo.create(data))
      )
      return c.json({ data: class_ }, 201)
    } catch (error) {
      console.error('Error creating class:', error)
      return c.json({ error: 'Failed to create class' }, 500)
    }
  })

  /**
   * Update class
   */
  .put('/:id', effectValidator('json', ClassUpdateSchema), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    try {
      const class_ = await appRuntime.runPromise(
        ClassRepo.use((repo) => repo.update(id, data)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
      if (!class_) {
        return c.json({ error: 'Class not found' }, 404)
      }
      return c.json({ data: class_ })
    } catch (error) {
      console.error('Error updating class:', error)
      return c.json({ error: 'Failed to update class' }, 500)
    }
  })

  /**
   * Delete class
   */
  .delete('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const deleted = await appRuntime.runPromise(
        ClassRepo.use((repo) => repo.delete(id))
      )
      if (!deleted) {
        return c.json({ error: 'Class not found' }, 404)
      }
      return c.json({ message: 'Class deleted successfully' })
    } catch (error) {
      console.error('Error deleting class:', error)
      return c.json({ error: 'Failed to delete class' }, 500)
    }
  })
