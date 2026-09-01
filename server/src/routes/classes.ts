/**
 * @file classes.ts
 * @description Handles all class-related API endpoints
 * 
 * Endpoints:
 * - GET    /classes      - List all classes
 * - GET    /classes/:id  - Get class by ID
 * - POST   /classes      - Create new class
 * - PUT    /classes/:id  - Update class
 * - DELETE /classes/:id  - Delete class
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { ClassSchema } from 'shared/src/types/class'
import type { AuthVariables } from '../types/auth'
import {
  createClass,
  findClassById,
  findAllClasses,
  findClassesByStudentId,
  updateClass,
  deleteClass
} from '../db/database'

export const classRoutes = new Hono<{ Variables: AuthVariables }>()
  /**
   * List classes (student-scoped if student, all otherwise)
   */
  .get('/', async (c) => {
    const user = c.get('user')

    try {
      if (user?.role === 'student') {
        const classes = await findClassesByStudentId(user.id)
        return c.json({ data: classes, count: classes.length })
      }

      const classes = await findAllClasses()
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
      const classes = await findClassesByStudentId(studentId)
      return c.json({ data: classes, count: classes.length })
    } catch (error) {
      console.error('Error getting student classes:', error)
      return c.json({ error: 'Failed to get student classes' }, 500)
    }
  })

  /**
   * Get class by ID
   */
  .get('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const class_ = await findClassById(id)
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
  .post('/', zValidator('json', ClassSchema), async (c) => {
    const data = c.req.valid('json')

    try {
      const class_ = await createClass(data)
      return c.json({ data: class_ }, 201)
    } catch (error) {
      console.error('Error creating class:', error)
      return c.json({ error: 'Failed to create class' }, 500)
    }
  })

  /**
   * Update class
   */
  .put('/:id', zValidator('json', ClassSchema.partial()), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    try {
      const class_ = await updateClass(id, data)
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
      const deleted = await deleteClass(id)
      if (!deleted) {
        return c.json({ error: 'Class not found' }, 404)
      }
      return c.json({ message: 'Class deleted successfully' })
    } catch (error) {
      console.error('Error deleting class:', error)
      return c.json({ error: 'Failed to delete class' }, 500)
    }
  })
