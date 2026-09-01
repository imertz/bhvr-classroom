/**
 * @file submissions.ts
 * @description Handles all submission-related API endpoints
 * 
 * Endpoints:
 * - GET    /submissions      - List all submissions
 * - GET    /submissions/:id  - Get submission by ID
 * - POST   /submissions      - Create new submission
 * - PUT    /submissions/:id  - Update submission
 * - DELETE /submissions/:id  - Delete submission
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { SubmissionSchema } from 'shared/src/types/submission'
import {
  createSubmission,
  findSubmissionById,
  findAllSubmissions,
  updateSubmission,
  deleteSubmission
} from '../db/database'

export const submissionRoutes = new Hono()
  /**
   * List all submissions
   */
  .get('/', async (c) => {
    try {
      const submissions = await findAllSubmissions()
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
      const submission = await findSubmissionById(id)
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
  .post('/', zValidator('json', SubmissionSchema), async (c) => {
    const data = c.req.valid('json')

    try {
      const submission = await createSubmission(data)
      return c.json({ data: submission }, 201)
    } catch (error) {
      console.error('Error creating submission:', error)
      return c.json({ error: 'Failed to create submission' }, 500)
    }
  })

  /**
   * Update submission
   */
  .put('/:id', zValidator('json', SubmissionSchema.partial()), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    try {
      const submission = await updateSubmission(id, data)
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
      const deleted = await deleteSubmission(id)
      if (!deleted) {
        return c.json({ error: 'Submission not found' }, 404)
      }
      return c.json({ message: 'Submission deleted successfully' })
    } catch (error) {
      console.error('Error deleting submission:', error)
      return c.json({ error: 'Failed to delete submission' }, 500)
    }
  })
