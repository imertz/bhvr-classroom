/**
 * @file students.ts
 * @description Handles all student-related API endpoints
 * 
 * Endpoints:
 * - GET    /students      - List all students
 * - GET    /students/:id  - Get student by ID
 * - POST   /students      - Create new student
 * - PUT    /students/:id  - Update student
 * - DELETE /students/:id  - Delete student
 */

import { Hono } from 'hono'
import { StudentSchema, type Student, type StudentInput } from 'shared/src/types/student'
import {
  createStudent,
  findStudentById,
  findAllStudents,
  updateStudent,
  deleteStudent
} from '../db/database'

export const studentRoutes = new Hono()

/**
 * List all students
 */
studentRoutes.get('/', async (c) => {
  try {
    const students = await findAllStudents()
    return c.json({ data: students, count: students.length })
  } catch (error) {
    console.error('Error listing students:', error)
    return c.json({ error: 'Failed to list students' }, 500)
  }
})

/**
 * Get student by ID
 */
studentRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const student = await findStudentById(id)
    if (!student) {
      return c.json({ error: 'Student not found' }, 404)
    }
    return c.json({ data: student })
  } catch (error) {
    console.error('Error getting student:', error)
    return c.json({ error: 'Failed to get student' }, 500)
  }
})

/**
 * Create new student
 */
studentRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const result = StudentSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 400)
  }

  try {
    const student = await createStudent(result.data)
    return c.json({ data: student }, 201)
  } catch (error) {
    console.error('Error creating student:', error)
    return c.json({ error: 'Failed to create student' }, 500)
  }
})

/**
 * Update student
 */
studentRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const result = StudentSchema.partial().safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 400)
  }

  try {
    const student = await updateStudent(id, result.data)
    if (!student) {
      return c.json({ error: 'Student not found' }, 404)
    }
    return c.json({ data: student })
  } catch (error) {
    console.error('Error updating student:', error)
    return c.json({ error: 'Failed to update student' }, 500)
  }
})

/**
 * Delete student
 */
studentRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const deleted = await deleteStudent(id)
    if (!deleted) {
      return c.json({ error: 'Student not found' }, 404)
    }
    return c.json({ message: 'Student deleted successfully' })
  } catch (error) {
    console.error('Error deleting student:', error)
    return c.json({ error: 'Failed to delete student' }, 500)
  }
})
