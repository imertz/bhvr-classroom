/**
 * @file teachers.ts
 * @description Handles all teacher-related API endpoints
 * 
 * Endpoints:
 * - GET    /teachers      - List all teachers
 * - GET    /teachers/:id  - Get teacher by ID
 * - POST   /teachers      - Create new teacher
 * - PUT    /teachers/:id  - Update teacher
 * - DELETE /teachers/:id  - Delete teacher
 */

import { Hono } from 'hono'
import { TeacherSchema, type Teacher, type TeacherInput } from 'shared/src/types/teacher'
import {
  createTeacher,
  findTeacherById,
  findAllTeachers,
  updateTeacher,
  deleteTeacher
} from '../db/database'

export const teacherRoutes = new Hono()

/**
 * List all teachers
 */
teacherRoutes.get('/', async (c) => {
  try {
    const teachers = await findAllTeachers()
    return c.json({ data: teachers, count: teachers.length })
  } catch (error) {
    console.error('Error listing teachers:', error)
    return c.json({ error: 'Failed to list teachers' }, 500)
  }
})

/**
 * Get teacher by ID
 */
teacherRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const teacher = await findTeacherById(id)
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
teacherRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const result = TeacherSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 400)
  }

  try {
    const teacher = await createTeacher(result.data)
    return c.json({ data: teacher }, 201)
  } catch (error) {
    console.error('Error creating teacher:', error)
    return c.json({ error: 'Failed to create teacher' }, 500)
  }
})

/**
 * Update teacher
 */
teacherRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const result = TeacherSchema.partial().safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 400)
  }

  try {
    const teacher = await updateTeacher(id, result.data)
    if (!teacher) {
      return c.json({ error: 'Teacher not found' }, 404)
    }
    return c.json({ data: teacher })
  } catch (error) {
    console.error('Error updating teacher:', error)
    return c.json({ error: 'Failed to update teacher' }, 500)
  }
})

/**
 * Delete teacher
 */
teacherRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const deleted = await deleteTeacher(id)
    if (!deleted) {
      return c.json({ error: 'Teacher not found' }, 404)
    }
    return c.json({ message: 'Teacher deleted successfully' })
  } catch (error) {
    console.error('Error deleting teacher:', error)
    return c.json({ error: 'Failed to delete teacher' }, 500)
  }
})
