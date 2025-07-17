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
import { SubmissionSchema, type Submission, type SubmissionInput } from 'shared/src/types/submission'
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
submissionRoutes.get('/', async (c) => {
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
submissionRoutes.get('/:id', async (c) => {
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
submissionRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const result = SubmissionSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 400)
  }

  try {
    const submission = await createSubmission(result.data)
    return c.json({ data: submission }, 201)
  } catch (error) {
    console.error('Error creating submission:', error)
    return c.json({ error: 'Failed to create submission' }, 500)
  }
})

/**
 * Update submission
 */
submissionRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const result = SubmissionSchema.partial().safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 400)
  }

  try {
    const submission = await updateSubmission(id, result.data)
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
submissionRoutes.delete('/:id', async (c) => {
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
