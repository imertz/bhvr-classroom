import { Hono } from 'hono'
import { Effect } from 'effect'
import { SubmissionSchema, SubmissionInput, makePartial } from 'shared/dist'
import { effectValidator } from '../middleware/validator'
import { appRuntime } from '../services/AppRuntime'
import { SubmissionRepo } from '../services/SubmissionRepo'

const SubmissionUpdateSchema = makePartial(SubmissionInput.fields)

export const submissionRoutes = new Hono()
  /**
   * List all submissions
   */
  .get('/', async (c) => {
    try {
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

    try {
      const submission = await appRuntime.runPromise(
        SubmissionRepo.use((repo) => repo.findById(id)).pipe(
          Effect.catchTag('NotFoundError', () => Effect.succeed(null))
        )
      )
      if (!submission) {
        return c.json({ error: 'Submission not found' }, 404)
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
    const data = c.req.valid('json')

    try {
      const submission = await appRuntime.runPromise(
        SubmissionRepo.use((repo) => repo.create(data))
      )
      return c.json({ data: submission }, 201)
    } catch (error) {
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

    try {
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
      console.error('Error updating submission:', error)
      return c.json({ error: 'Failed to update submission' }, 500)
    }
  })

  /**
   * Delete submission
   */
  .delete('/:id', async (c) => {
    const id = c.req.param('id')

    try {
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
