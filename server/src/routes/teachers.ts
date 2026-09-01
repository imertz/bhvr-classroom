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
import { zValidator } from '@hono/zod-validator'
import { TeacherSchema } from 'shared/src/types/teacher'
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
  .get('/', async (c) => {
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
  .get('/:id', async (c) => {
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
  .post('/', zValidator('json', TeacherSchema), async (c) => {
    const data = c.req.valid('json')

    try {
      const teacher = await createTeacher(data)
      return c.json({ data: teacher }, 201)
    } catch (error) {
      console.error('Error creating teacher:', error)
      return c.json({ error: 'Failed to create teacher' }, 500)
    }
  })

  /**
   * Update teacher
   */
  .put('/:id', zValidator('json', TeacherSchema.partial()), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    try {
      const teacher = await updateTeacher(id, data)
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
  .delete('/:id', async (c) => {
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
