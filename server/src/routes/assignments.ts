import { Hono } from 'hono'
import { Effect } from 'effect'
import { AssignmentSchema, AssignmentInput, makePartial } from 'shared/dist'
import { effectValidator } from '../middleware/validator'
import { appRuntime } from '../services/AppRuntime'
import { AssignmentRepo } from '../services/AssignmentRepo'

import type { AuthVariables } from '../types/auth'

const AssignmentUpdateSchema = makePartial(AssignmentInput.fields)

export const assignmentRoutes = new Hono<{ Variables: AuthVariables }>()
  /**
   * List all assignments
   */
  .get('/', async (c) => {
    const user = c.get('user')

    try {
      if (user?.role === 'student') {
        const assignments = await appRuntime.runPromise(
          AssignmentRepo.use((repo) => repo.findByStudentId(user.id))
        )
        return c.json({ data: assignments, count: assignments.length })
      }

      const assignments = await appRuntime.runPromise(
        AssignmentRepo.use((repo) => repo.findAll())
      )
      return c.json({ data: assignments, count: assignments.length })
    } catch (error) {
      console.error('Error listing assignments:', error)
      return c.json({ error: 'Failed to list assignments' }, 500)
    }
  })

  /**
   * Get assignment by ID
   */
  .get('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const assignment = await appRuntime.runPromise(
        AssignmentRepo.use((repo) => repo.findById(id)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
      if (!assignment) {
        return c.json({ error: 'Assignment not found' }, 404)
      }
      return c.json({ data: assignment })
    } catch (error) {
      console.error('Error getting assignment:', error)
      return c.json({ error: 'Failed to get assignment' }, 500)
    }
  })

  /**
   * Create new assignment
   */
  .post('/', effectValidator('json', AssignmentSchema), async (c) => {
    const data = c.req.valid('json')

    try {
      const assignment = await appRuntime.runPromise(
        AssignmentRepo.use((repo) => repo.create({
          ...data,
          description: data.description ?? null
        }))
      )
      return c.json({ data: assignment }, 201)
    } catch (error) {
      console.error('Error creating assignment:', error)
      return c.json({ error: 'Failed to create assignment' }, 500)
    }
  })

  /**
   * Update assignment
   */
  .put('/:id', effectValidator('json', AssignmentUpdateSchema), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    try {
      const assignment = await appRuntime.runPromise(
        AssignmentRepo.use((repo) => repo.update(id, data)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
      if (!assignment) {
        return c.json({ error: 'Assignment not found' }, 404)
      }
      return c.json({ data: assignment })
    } catch (error) {
      console.error('Error updating assignment:', error)
      return c.json({ error: 'Failed to update assignment' }, 500)
    }
  })

  /**
   * Delete assignment
   */
  .delete('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const deleted = await appRuntime.runPromise(
        AssignmentRepo.use((repo) => repo.delete(id))
      )
      if (!deleted) {
        return c.json({ error: 'Assignment not found' }, 404)
      }
      return c.json({ message: 'Assignment deleted successfully' })
    } catch (error) {
      console.error('Error deleting assignment:', error)
      return c.json({ error: 'Failed to delete assignment' }, 500)
    }
  })
