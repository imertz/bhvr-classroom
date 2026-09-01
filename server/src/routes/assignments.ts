/**
 * @file assignments.ts
 * @description Handles all assignment-related API endpoints
 * 
 * Endpoints:
 * - GET    /assignments      - List all assignments
 * - GET    /assignments/:id  - Get assignment by ID
 * - POST   /assignments      - Create new assignment
 * - PUT    /assignments/:id  - Update assignment
 * - DELETE /assignments/:id  - Delete assignment
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { AssignmentSchema, type AssignmentInput } from 'shared/src/types/assignment'
import {
  createAssignment,
  findAssignmentById,
  findAllAssignments,
  updateAssignment,
  deleteAssignment
} from '../db/database'

export const assignmentRoutes = new Hono()
  /**
   * List all assignments
   */
  .get('/', async (c) => {
    try {
      const assignments = await findAllAssignments()
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
      const assignment = await findAssignmentById(id)
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
  .post('/', zValidator('json', AssignmentSchema), async (c) => {
    const data = c.req.valid('json')

    try {
      // map description to string|null
      const input: AssignmentInput = {
        ...data,
        description: data.description ?? null,
      }
      const assignment = await createAssignment(input)
      return c.json({ data: assignment }, 201)
    } catch (error) {
      console.error('Error creating assignment:', error)
      return c.json({ error: 'Failed to create assignment' }, 500)
    }
  })

  /**
   * Update assignment
   */
  .put('/:id', zValidator('json', AssignmentSchema.partial()), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    try {
      // build a Partial<AssignmentInput>, mapping description only if present
      const updateData: Partial<AssignmentInput> = { ...data }
      if ('description' in data) {
        updateData.description = data.description ?? null
      }
      const assignment = await updateAssignment(id, updateData)
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
      const deleted = await deleteAssignment(id)
      if (!deleted) {
        return c.json({ error: 'Assignment not found' }, 404)
      }
      return c.json({ message: 'Assignment deleted successfully' })
    } catch (error) {
      console.error('Error deleting assignment:', error)
      return c.json({ error: 'Failed to delete assignment' }, 500)
    }
  })
