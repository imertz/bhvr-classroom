/**
 * @file grades.ts
 * @description Handles all grade-related API endpoints
 * 
 * Endpoints:
 * - GET    /grades      - List all grades
 * - GET    /grades/:id  - Get grade by ID
 * - POST   /grades      - Create new grade
 * - PUT    /grades/:id  - Update grade
 * - DELETE /grades/:id  - Delete grade
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { GradeSchema } from 'shared/src/types/grade'
import type { AuthVariables } from '../types/auth'
import {
  createGrade,
  findGradeById,
  findAllGrades,
  findGradesByStudentId,
  updateGrade,
  deleteGrade
} from '../db/database'

export const gradeRoutes = new Hono<{ Variables: AuthVariables }>()
  /**
   * List grades (student-scoped if student, all if teacher/admin)
   */
  .get('/', async (c) => {
    const user = c.get('user')

    try {
      if (user?.role === 'student') {
        const grades = await findGradesByStudentId(user.id)
        return c.json({ data: grades, count: grades.length })
      }

      const grades = await findAllGrades()
      return c.json({ data: grades, count: grades.length })
    } catch (error) {
      console.error('Error listing grades:', error)
      return c.json({ error: 'Failed to list grades' }, 500)
    }
  })

  /**
   * Get grades for a specific student
   */
  .get('/student/:studentId', async (c) => {
    const user = c.get('user')
    const studentId = c.req.param('studentId')

    if (user?.role === 'student' && user.id !== studentId) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    try {
      const grades = await findGradesByStudentId(studentId)
      return c.json({ data: grades, count: grades.length })
    } catch (error) {
      console.error('Error getting student grades:', error)
      return c.json({ error: 'Failed to get student grades' }, 500)
    }
  })

  /**
   * Get grade by ID
   */
  .get('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const grade = await findGradeById(id)
      if (!grade) {
        return c.json({ error: 'Grade not found' }, 404)
      }
      return c.json({ data: grade })
    } catch (error) {
      console.error('Error getting grade:', error)
      return c.json({ error: 'Failed to get grade' }, 500)
    }
  })

  /**
   * Create new grade
   */
  .post('/', zValidator('json', GradeSchema), async (c) => {
    const data = c.req.valid('json')

    try {
      const grade = await createGrade(data)
      return c.json({ data: grade }, 201)
    } catch (error) {
      console.error('Error creating grade:', error)
      return c.json({ error: 'Failed to create grade' }, 500)
    }
  })

  /**
   * Update grade
   */
  .put('/:id', zValidator('json', GradeSchema.partial()), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    try {
      const grade = await updateGrade(id, data)
      if (!grade) {
        return c.json({ error: 'Grade not found' }, 404)
      }
      return c.json({ data: grade })
    } catch (error) {
      console.error('Error updating grade:', error)
      return c.json({ error: 'Failed to update grade' }, 500)
    }
  })

  /**
   * Delete grade
   */
  .delete('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const deleted = await deleteGrade(id)
      if (!deleted) {
        return c.json({ error: 'Grade not found' }, 404)
      }
      return c.json({ message: 'Grade deleted successfully' })
    } catch (error) {
      console.error('Error deleting grade:', error)
      return c.json({ error: 'Failed to delete grade' }, 500)
    }
  })
