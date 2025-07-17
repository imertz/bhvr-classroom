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
import { ClassSchema, type Class, type ClassInput } from 'shared/src/types/class'
import {
  createClass,
  findClassById,
  findAllClasses,
  updateClass,
  deleteClass
} from '../db/database'

export const classRoutes = new Hono()

/**
 * List all classes
 */
classRoutes.get('/', async (c) => {
  try {
    const classes = await findAllClasses()
    return c.json({ data: classes, count: classes.length })
  } catch (error) {
    console.error('Error listing classes:', error)
    return c.json({ error: 'Failed to list classes' }, 500)
  }
})

/**
 * Get class by ID
 */
classRoutes.get('/:id', async (c) => {
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
classRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const result = ClassSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 400)
  }

  try {
    const class_ = await createClass(result.data)
    return c.json({ data: class_ }, 201)
  } catch (error) {
    console.error('Error creating class:', error)
    return c.json({ error: 'Failed to create class' }, 500)
  }
})

/**
 * Update class
 */
classRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const result = ClassSchema.partial().safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 400)
  }

  try {
    const class_ = await updateClass(id, result.data)
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
classRoutes.delete('/:id', async (c) => {
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
