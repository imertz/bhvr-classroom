/**
 * @file enrollments.ts
 * @description Handles all enrollment-related API endpoints
 * 
 * Endpoints:
 * - GET    /enrollments      - List all enrollments
 * - GET    /enrollments/:id  - Get enrollment by ID
 * - POST   /enrollments      - Create new enrollment
 * - PUT    /enrollments/:id  - Update enrollment
 * - DELETE /enrollments/:id  - Delete enrollment
 */

import { Hono } from 'hono'
import { EnrollmentSchema, type Enrollment, type EnrollmentInput } from 'shared/src/types/enrollment'
import type { AuthVariables } from '../types/auth'
import {
  createEnrollment,
  findEnrollmentById,
  findAllEnrollments,
  findEnrollmentsByStudentId,
  updateEnrollment,
  deleteEnrollment
} from '../db/database'

export const enrollmentRoutes = new Hono<{ Variables: AuthVariables }>()

/**
 * List enrollments (student-scoped if student, all otherwise)
 */
enrollmentRoutes.get('/', async (c) => {
  const user = c.get('user')

  try {
    if (user?.role === 'student') {
      const enrollments = await findEnrollmentsByStudentId(user.id)
      return c.json({ data: enrollments, count: enrollments.length })
    }

    const enrollments = await findAllEnrollments()
    return c.json({ data: enrollments, count: enrollments.length })
  } catch (error) {
    console.error('Error listing enrollments:', error)
    return c.json({ error: 'Failed to list enrollments' }, 500)
  }
})

/**
 * Get enrollments for a specific student
 */
enrollmentRoutes.get('/student/:studentId', async (c) => {
  const studentId = c.req.param('studentId')

  try {
    const enrollments = await findEnrollmentsByStudentId(studentId)
    return c.json({ data: enrollments, count: enrollments.length })
  } catch (error) {
    console.error('Error getting student enrollments:', error)
    return c.json({ error: 'Failed to get student enrollments' }, 500)
  }
})

/**
 * Get enrollment by ID
 */
enrollmentRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const enrollment = await findEnrollmentById(id)
    if (!enrollment) {
      return c.json({ error: 'Enrollment not found' }, 404)
    }
    return c.json({ data: enrollment })
  } catch (error) {
    console.error('Error getting enrollment:', error)
    return c.json({ error: 'Failed to get enrollment' }, 500)
  }
})

/**
 * Create new enrollment
 */
enrollmentRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const result = EnrollmentSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 400)
  }

  try {
    const enrollment = await createEnrollment(result.data)
    return c.json({ data: enrollment }, 201)
  } catch (error) {
    console.error('Error creating enrollment:', error)
    return c.json({ error: 'Failed to create enrollment' }, 500)
  }
})

/**
 * Update enrollment
 */
enrollmentRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const result = EnrollmentSchema.partial().safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 400)
  }

  try {
    const enrollment = await updateEnrollment(id, result.data)
    if (!enrollment) {
      return c.json({ error: 'Enrollment not found' }, 404)
    }
    return c.json({ data: enrollment })
  } catch (error) {
    console.error('Error updating enrollment:', error)
    return c.json({ error: 'Failed to update enrollment' }, 500)
  }
})

/**
 * Delete enrollment
 */
enrollmentRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const deleted = await deleteEnrollment(id)
    if (!deleted) {
      return c.json({ error: 'Enrollment not found' }, 404)
    }
    return c.json({ message: 'Enrollment deleted successfully' })
  } catch (error) {
    console.error('Error deleting enrollment:', error)
    return c.json({ error: 'Failed to delete enrollment' }, 500)
  }
})
