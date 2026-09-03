import { Hono } from 'hono'
import { Effect } from 'effect'
import { SubmissionSchema, SubmissionInput, makePartial } from 'shared/dist'
import type { AuthVariables } from '../types/auth'
import { effectValidator } from '../middleware/validator'
import { appRuntime } from '../services/AppRuntime'
import { SubmissionRepo } from '../services/SubmissionRepo'
import { isConflictError } from '../utils/errors'

const SubmissionUpdateSchema = makePartial(SubmissionInput.fields)

export const submissionRoutes = new Hono<{ Variables: AuthVariables }>()
  /**
   * List all submissions
   */
  .get('/', async (c) => {
    const user = c.get('user')

    try {
      if (user?.role === 'student') {
        const submissions = await appRuntime.runPromise(
          SubmissionRepo.use((repo) => repo.findByStudentId(user.id))
        )
        return c.json({ data: submissions, count: submissions.length })
      }

      const submissions = await appRuntime.runPromise(
        SubmissionRepo.use((repo) => repo.findAll())
      )
      return c.json({ data: submissions, count: submissions.length })
    } catch (error) {
      console.error('Error listing submissions:', error)
      return c.json({ error: 'Failed to list submissions' }, 500)
    }
  })

  /**
   * Get submission by ID
   */
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const user = c.get('user')

    try {
      const submission = await appRuntime.runPromise(
        SubmissionRepo.use((repo) => repo.findById(id)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
      if (!submission) {
        return c.json({ error: 'Submission not found' }, 404)
      }
      if (user?.role === 'student' && submission.student_id !== user.id) {
        return c.json({ error: 'Forbidden: You cannot access other students\' submissions' }, 403)
      }
      return c.json({ data: submission })
    } catch (error) {
      console.error('Error getting submission:', error)
      return c.json({ error: 'Failed to get submission' }, 500)
    }
  })

  /**
   * Create new submission
   */
  .post('/', effectValidator('json', SubmissionSchema), async (c) => {
    const rawData = c.req.valid('json')
    const user = c.get('user')

    const studentId = user?.role === 'student' ? user.id : (rawData.student_id || user?.id || '')
    const data: SubmissionInput = {
      ...rawData,
      student_id: studentId,
      status: user?.role === 'student' ? 'submitted' : (rawData.status || 'submitted'),
    }

    try {
      const submission = await appRuntime.runPromise(
        SubmissionRepo.use((repo) => repo.create(data))
      )
      return c.json({ data: submission }, 201)
    } catch (error) {
      if (isConflictError(error)) {
        return c.json({ error: error.message }, 409)
      }
      console.error('Error creating submission:', error)
      return c.json({ error: 'Failed to create submission' }, 500)
    }
  })

  /**
   * Update submission
   */
  .put('/:id', effectValidator('json', SubmissionUpdateSchema), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')
    const user = c.get('user')

    try {
      const existing = await appRuntime.runPromise(
        SubmissionRepo.use((repo) => repo.findById(id)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
      if (!existing) {
        return c.json({ error: 'Submission not found' }, 404)
      }
      if (user?.role === 'student') {
        if (existing.student_id !== user.id) {
          return c.json({ error: 'Forbidden: You can only edit your own submissions' }, 403)
        }
        if (existing.status === 'graded') {
          return c.json({ error: 'Forbidden: Cannot edit an already graded submission' }, 403)
        }
        if (data.student_id && data.student_id !== user.id) {
          return c.json({ error: 'Forbidden: You cannot transfer submission ownership' }, 403)
        }
        if (data.status && data.status !== existing.status) {
          return c.json({ error: 'Forbidden: Students cannot alter submission status' }, 403)
        }
      }

      const submission = await appRuntime.runPromise(
        SubmissionRepo.use((repo) => repo.update(id, data)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
      if (!submission) {
        return c.json({ error: 'Submission not found' }, 404)
      }
      return c.json({ data: submission })
    } catch (error) {
      if (isConflictError(error)) {
        return c.json({ error: error.message }, 409)
      }
      console.error('Error updating submission:', error)
      return c.json({ error: 'Failed to update submission' }, 500)
    }
  })

  /**
   * Delete submission
   */
  .delete('/:id', async (c) => {
    const id = c.req.param('id')
    const user = c.get('user')

    try {
      const existing = await appRuntime.runPromise(
        SubmissionRepo.use((repo) => repo.findById(id)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
      if (!existing) {
        return c.json({ error: 'Submission not found' }, 404)
      }
      if (user?.role === 'student') {
        if (existing.student_id !== user.id) {
          return c.json({ error: 'Forbidden: You can only delete your own submissions' }, 403)
        }
        if (existing.status === 'graded') {
          return c.json({ error: 'Forbidden: Cannot delete an already graded submission' }, 403)
        }
      }

      const deleted = await appRuntime.runPromise(
        SubmissionRepo.use((repo) => repo.delete(id))
      )
      if (!deleted) {
        return c.json({ error: 'Submission not found' }, 404)
      }
      return c.json({ message: 'Submission deleted successfully' })
    } catch (error) {
      console.error('Error deleting submission:', error)
      return c.json({ error: 'Failed to delete submission' }, 500)
    }
  })
