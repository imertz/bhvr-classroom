import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { z } from 'zod'
import type { AuthVariables, AuthUser, RefreshTokenPayload } from '../types/auth'
import { findTeacherByEmail, findStudentByEmail, storeRefreshToken, findRefreshTokenById, revokeRefreshToken, findTeacherById, findStudentById, createTeacher } from '../db/database'
import { TeacherRegistrationSchema } from 'shared/src/types/teacher'
import { generateAccessToken, generateRefreshToken } from '../utils/jwt'
import { AUTH_CONFIG } from '../config/auth'
import { randomUUID } from 'crypto'
import { verify } from 'hono/jwt'
import { authMiddleware } from '../middleware/auth'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export const authRoutes = new Hono<{ Variables: AuthVariables }>()

// Teacher login
authRoutes.post('/teacher/login', async (c) => {
  const body = await c.req.json()
  const { email, password } = LoginSchema.parse(body)

  // Find teacher
  const teacher = await findTeacherByEmail(email)
  if (!teacher || !teacher.password_hash) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  // Verify password using Bun's password API
  const isValid = await Bun.password.verify(password, teacher.password_hash)
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  // Generate tokens
  const user: AuthUser = {
    id: teacher.id,
    email: teacher.email,
    role: teacher.role || 'teacher',
    userType: 'teacher'
  }

  const accessToken = await generateAccessToken(user)
  const refreshTokenId = randomUUID()
  const refreshToken = await generateRefreshToken(teacher.id, 'teacher', refreshTokenId)

  // Store refresh token (hashed)
  const hashedRefreshToken = await Bun.password.hash(refreshToken)
  await storeRefreshToken({
    id: refreshTokenId,
    user_id: teacher.id,
    user_type: 'teacher',
    token_hash: hashedRefreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  })

  // Set refresh token as httpOnly cookie
  setCookie(c, 'refresh_token', refreshToken, AUTH_CONFIG.COOKIE_OPTIONS)

  return c.json({
    user: {
      id: teacher.id,
      email: teacher.email,
      firstName: teacher.first_name,
      lastName: teacher.last_name,
      role: teacher.role || 'teacher'
    },
    accessToken
  })
})

// Refresh token endpoint
authRoutes.post('/refresh', async (c) => {
  const refreshToken = getCookie(c, 'refresh_token')
  if (!refreshToken) {
    return c.json({ error: 'No refresh token provided' }, 401)
  }

  try {
    // Verify refresh token
    const payload = await verify(refreshToken, AUTH_CONFIG.REFRESH_TOKEN_SECRET) as RefreshTokenPayload

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type')
    }

    // Check if token exists and is valid
    const storedToken = await findRefreshTokenById(payload.tokenId)
    if (!storedToken || storedToken.revoked_at) {
      throw new Error('Token revoked or not found')
    }

    // Verify the token hash
    const isValidToken = await Bun.password.verify(refreshToken, storedToken.token_hash)
    if (!isValidToken) {
      throw new Error('Invalid token')
    }

    // Get user
    let user: AuthUser
    if (payload.userType === 'teacher') {
      const teacher = await findTeacherById(payload.userId)
      if (!teacher) throw new Error('User not found')
      user = {
        id: teacher.id,
        email: teacher.email,
        role: teacher.role || 'teacher',
        userType: 'teacher'
      }
    } else {
      const student = await findStudentById(payload.userId)
      if (!student) throw new Error('User not found')
      user = {
        id: student.id,
        email: student.email,
        role: 'student',
        userType: 'student'
      }
    }

    // Generate new access token
    const accessToken = await generateAccessToken(user)

    return c.json({ accessToken, user })
  } catch (error) {
    return c.json({ error: 'Invalid refresh token' }, 401)
  }
})

// Get current user
authRoutes.get('/me', authMiddleware, async (c) => {
  const user = c.get('user')

  if (user.userType === 'teacher') {
    const teacher = await findTeacherById(user.id)
    if (!teacher) return c.json({ error: 'Teacher not found' }, 404)
    return c.json({
      user: {
        id: teacher.id,
        email: teacher.email,
        firstName: teacher.first_name,
        lastName: teacher.last_name,
        role: teacher.role || 'teacher'
      }
    })
  } else {
    const student = await findStudentById(user.id)
    if (!student) return c.json({ error: 'Student not found' }, 404)
    return c.json({
      user: {
        id: student.id,
        email: student.email,
        firstName: student.first_name,
        lastName: student.last_name,
        role: 'student',
        gradeLevel: student.grade_level
      }
    })
  }
})

// Teacher registration
authRoutes.post('/teacher/register', async (c) => {
  try {
    const body = await c.req.json()
    const registrationData = TeacherRegistrationSchema.parse(body)

    // Check if teacher already exists
    const existingTeacher = await findTeacherByEmail(registrationData.email)
    if (existingTeacher) {
      return c.json({ error: 'Email already exists' }, 409)
    }

    // Create teacher
    const teacher = await createTeacher({
      ...registrationData,
      role: 'teacher'
    } as any)

    // Generate tokens for auto-login
    const user: AuthUser = {
      id: teacher.id,
      email: teacher.email,
      role: 'teacher',
      userType: 'teacher'
    }

    const accessToken = await generateAccessToken(user)
    const refreshTokenId = randomUUID()
    const refreshToken = await generateRefreshToken(teacher.id, 'teacher', refreshTokenId)

    // Store refresh token (hashed)
    const hashedRefreshToken = await Bun.password.hash(refreshToken)
    await storeRefreshToken({
      id: refreshTokenId,
      user_id: teacher.id,
      user_type: 'teacher',
      token_hash: hashedRefreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })

    // Set refresh token as httpOnly cookie
    setCookie(c, 'refresh_token', refreshToken, AUTH_CONFIG.COOKIE_OPTIONS)

    return c.json({
      user: {
        id: teacher.id,
        email: teacher.email,
        firstName: teacher.first_name,
        lastName: teacher.last_name,
        role: 'teacher'
      },
      accessToken
    }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: error.errors }, 400)
    }
    console.error('Registration error:', error)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

// Logout
authRoutes.post('/logout', authMiddleware, async (c) => {
  const refreshToken = getCookie(c, 'refresh_token')

  if (refreshToken) {
    // Revoke refresh token in database
    try {
      const payload = await verify(refreshToken, AUTH_CONFIG.REFRESH_TOKEN_SECRET) as RefreshTokenPayload
      await revokeRefreshToken(payload.tokenId)
    } catch (error) {
      // Token might be invalid, but we still want to clear the cookie
    }
  }

  deleteCookie(c, 'refresh_token')
  return c.json({ message: 'Logged out successfully' })
})
