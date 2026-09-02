import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { Effect } from 'effect'
import { randomUUIDv7 as randomUUID } from 'bun'
import type { AuthVariables, AuthUser } from '../types/auth'
import {
  LoginCredentials,
  TeacherRegistrationSchema
} from 'shared/dist'
import { effectValidator } from '../middleware/validator'
import { appRuntime } from '../services/AppRuntime'
import { TeacherRepo } from '../services/TeacherRepo'
import { StudentRepo } from '../services/StudentRepo'
import { AuthRepo } from '../services/AuthRepo'
import { AuthService } from '../services/AuthService'
import { AUTH_CONFIG } from '../config/auth'
import { authMiddleware } from '../middleware/auth'

export const authRoutes = new Hono<{ Variables: AuthVariables }>()
  // Unified login (auto-detects teacher vs student)
  .post('/login', effectValidator('json', LoginCredentials), async (c) => {
    const { email, password } = c.req.valid('json')

    const program = Effect.gen(function*() {
      const teacherRepo = yield* TeacherRepo
      const studentRepo = yield* StudentRepo
      const authRepo = yield* AuthRepo
      const authService = yield* AuthService

      // 1. Try teacher/admin
      const teacher = yield* teacherRepo.findByEmail(email)
      if (teacher && teacher.password_hash) {
        const isValid = yield* Effect.tryPromise(() => Bun.password.verify(password, teacher.password_hash))
        if (isValid) {
          const user: AuthUser = {
            id: teacher.id,
            email: teacher.email,
            firstName: teacher.first_name,
            lastName: teacher.last_name,
            role: teacher.role || 'teacher',
            userType: 'teacher'
          }

          const accessToken = yield* authService.generateAccessToken(user)
          const refreshTokenId = randomUUID()
          const refreshToken = yield* authService.generateRefreshToken(teacher.id, 'teacher', refreshTokenId)
          const hashedRefreshToken = yield* Effect.tryPromise(() => Bun.password.hash(refreshToken))

          yield* authRepo.storeRefreshToken({
            id: refreshTokenId,
            user_id: teacher.id,
            user_type: 'teacher',
            token_hash: hashedRefreshToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })

          return { user, accessToken, refreshToken }
        }
      }

      // 2. Try student
      const student = yield* studentRepo.findByEmail(email)
      if (student && student.password_hash) {
        const isValid = yield* Effect.tryPromise(() => Bun.password.verify(password, student.password_hash!))
        if (isValid) {
          const user: AuthUser = {
            id: student.id,
            email: student.email,
            firstName: student.first_name,
            lastName: student.last_name,
            role: 'student',
            userType: 'student',
            gradeLevel: student.grade_level
          }

          const accessToken = yield* authService.generateAccessToken(user)
          const refreshTokenId = randomUUID()
          const refreshToken = yield* authService.generateRefreshToken(student.id, 'student', refreshTokenId)
          const hashedRefreshToken = yield* Effect.tryPromise(() => Bun.password.hash(refreshToken))

          yield* authRepo.storeRefreshToken({
            id: refreshTokenId,
            user_id: student.id,
            user_type: 'student',
            token_hash: hashedRefreshToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })

          return { user, accessToken, refreshToken }
        }
      }

      return null
    })

    const result = await appRuntime.runPromise(program)
    if (!result) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    setCookie(c, 'refresh_token', result.refreshToken, AUTH_CONFIG.COOKIE_OPTIONS)
    return c.json({ user: result.user, accessToken: result.accessToken })
  })

  // Teacher login
  .post('/teacher/login', effectValidator('json', LoginCredentials), async (c) => {
    const { email, password } = c.req.valid('json')

    const program = Effect.gen(function*() {
      const teacherRepo = yield* TeacherRepo
      const authRepo = yield* AuthRepo
      const authService = yield* AuthService

      const teacher = yield* teacherRepo.findByEmail(email)
      if (!teacher || !teacher.password_hash) {
        return null
      }

      const isValid = yield* Effect.tryPromise(() => Bun.password.verify(password, teacher.password_hash))
      if (!isValid) {
        return null
      }

      const user: AuthUser = {
        id: teacher.id,
        email: teacher.email,
        firstName: teacher.first_name,
        lastName: teacher.last_name,
        role: teacher.role || 'teacher',
        userType: 'teacher'
      }

      const accessToken = yield* authService.generateAccessToken(user)
      const refreshTokenId = randomUUID()
      const refreshToken = yield* authService.generateRefreshToken(teacher.id, 'teacher', refreshTokenId)
      const hashedRefreshToken = yield* Effect.tryPromise(() => Bun.password.hash(refreshToken))

      yield* authRepo.storeRefreshToken({
        id: refreshTokenId,
        user_id: teacher.id,
        user_type: 'teacher',
        token_hash: hashedRefreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      return { user, accessToken, refreshToken, teacher }
    })

    const result = await appRuntime.runPromise(program)
    if (!result) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    setCookie(c, 'refresh_token', result.refreshToken, AUTH_CONFIG.COOKIE_OPTIONS)
    return c.json({
      user: {
        id: result.teacher.id,
        email: result.teacher.email,
        firstName: result.teacher.first_name,
        lastName: result.teacher.last_name,
        role: result.teacher.role || 'teacher'
      },
      accessToken: result.accessToken
    })
  })

  // Student login
  .post('/student/login', effectValidator('json', LoginCredentials), async (c) => {
    const { email, password } = c.req.valid('json')

    const program = Effect.gen(function*() {
      const studentRepo = yield* StudentRepo
      const authRepo = yield* AuthRepo
      const authService = yield* AuthService

      const student = yield* studentRepo.findByEmail(email)
      if (!student || !student.password_hash) {
        return null
      }

      const isValid = yield* Effect.tryPromise(() => Bun.password.verify(password, student.password_hash!))
      if (!isValid) {
        return null
      }

      const user: AuthUser = {
        id: student.id,
        email: student.email,
        firstName: student.first_name,
        lastName: student.last_name,
        role: 'student',
        userType: 'student',
        gradeLevel: student.grade_level
      }

      const accessToken = yield* authService.generateAccessToken(user)
      const refreshTokenId = randomUUID()
      const refreshToken = yield* authService.generateRefreshToken(student.id, 'student', refreshTokenId)
      const hashedRefreshToken = yield* Effect.tryPromise(() => Bun.password.hash(refreshToken))

      yield* authRepo.storeRefreshToken({
        id: refreshTokenId,
        user_id: student.id,
        user_type: 'student',
        token_hash: hashedRefreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      return { user, accessToken, refreshToken, student }
    })

    const result = await appRuntime.runPromise(program)
    if (!result) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    setCookie(c, 'refresh_token', result.refreshToken, AUTH_CONFIG.COOKIE_OPTIONS)
    return c.json({
      user: {
        id: result.student.id,
        email: result.student.email,
        firstName: result.student.first_name,
        lastName: result.student.last_name,
        role: 'student',
        gradeLevel: result.student.grade_level
      },
      accessToken: result.accessToken
    })
  })

  // Refresh token endpoint
  .post('/refresh', async (c) => {
    const refreshToken = getCookie(c, 'refresh_token')
    if (!refreshToken) {
      return c.json({ error: 'No refresh token provided' }, 401)
    }

    const program = Effect.gen(function*() {
      const authService = yield* AuthService
      const authRepo = yield* AuthRepo
      const teacherRepo = yield* TeacherRepo
      const studentRepo = yield* StudentRepo

      const payload = yield* authService.verifyRefreshToken(refreshToken)
      if (payload.type !== 'refresh') {
        return null
      }

      const storedToken = yield* authRepo.findRefreshTokenByIdOrNull(payload.tokenId)
      if (!storedToken || storedToken.revoked_at) {
        return null
      }

      const isValidToken = yield* Effect.tryPromise(() => Bun.password.verify(refreshToken, storedToken.token_hash))
      if (!isValidToken) {
        return null
      }

      let user: AuthUser
      if (payload.userType === 'teacher') {
        const teacher = yield* teacherRepo.findByIdOrNull(payload.userId)
        if (!teacher) return null
        user = {
          id: teacher.id,
          email: teacher.email,
          role: teacher.role || 'teacher',
          userType: 'teacher'
        }
      } else {
        const student = yield* studentRepo.findByIdOrNull(payload.userId)
        if (!student) return null
        user = {
          id: student.id,
          email: student.email,
          role: 'student',
          userType: 'student'
        }
      }

      const accessToken = yield* authService.generateAccessToken(user)
      return { accessToken, user }
    })

    try {
      const result = await appRuntime.runPromise(program)
      if (!result) {
        return c.json({ error: 'Invalid refresh token' }, 401)
      }
      return c.json(result)
    } catch {
      return c.json({ error: 'Invalid refresh token' }, 401)
    }
  })

  // Get current user
  .get('/me', authMiddleware, async (c) => {
    const user = c.get('user')

    const program = Effect.gen(function*() {
      const teacherRepo = yield* TeacherRepo
      const studentRepo = yield* StudentRepo

      if (user.userType === 'teacher') {
        const teacher = yield* teacherRepo.findByIdOrNull(user.id)
        if (!teacher) return null
        return {
          user: {
            id: teacher.id,
            email: teacher.email,
            firstName: teacher.first_name,
            lastName: teacher.last_name,
            role: teacher.role || 'teacher'
          }
        }
      } else {
        const student = yield* studentRepo.findByIdOrNull(user.id)
        if (!student) return null
        return {
          user: {
            id: student.id,
            email: student.email,
            firstName: student.first_name,
            lastName: student.last_name,
            role: 'student',
            gradeLevel: student.grade_level
          }
        }
      }
    })

    const result = await appRuntime.runPromise(program)
    if (!result) {
      return c.json({ error: user.userType === 'teacher' ? 'Teacher not found' : 'Student not found' }, 404)
    }
    return c.json(result)
  })

  // Teacher registration
  .post('/teacher/register', effectValidator('json', TeacherRegistrationSchema), async (c) => {
    const registrationData = c.req.valid('json')

    const program = Effect.gen(function*() {
      const teacherRepo = yield* TeacherRepo
      const authRepo = yield* AuthRepo
      const authService = yield* AuthService

      const existingTeacher = yield* teacherRepo.findByEmail(registrationData.email)
      if (existingTeacher) {
        return { status: 409 as const, error: 'Email already exists' }
      }

      const teacher = yield* teacherRepo.create({
        ...registrationData,
        role: 'teacher'
      })

      const user: AuthUser = {
        id: teacher.id,
        email: teacher.email,
        role: 'teacher',
        userType: 'teacher'
      }

      const accessToken = yield* authService.generateAccessToken(user)
      const refreshTokenId = randomUUID()
      const refreshToken = yield* authService.generateRefreshToken(teacher.id, 'teacher', refreshTokenId)
      const hashedRefreshToken = yield* Effect.tryPromise(() => Bun.password.hash(refreshToken))

      yield* authRepo.storeRefreshToken({
        id: refreshTokenId,
        user_id: teacher.id,
        user_type: 'teacher',
        token_hash: hashedRefreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      return {
        status: 201 as const,
        data: {
          user: {
            id: teacher.id,
            email: teacher.email,
            firstName: teacher.first_name,
            lastName: teacher.last_name,
            role: 'teacher'
          },
          accessToken,
          refreshToken
        }
      }
    })

    try {
      const result = await appRuntime.runPromise(program)
      if ('error' in result) {
        return c.json({ error: result.error }, result.status)
      }

      setCookie(c, 'refresh_token', result.data.refreshToken, AUTH_CONFIG.COOKIE_OPTIONS)
      return c.json({
        user: result.data.user,
        accessToken: result.data.accessToken
      }, 201)
    } catch (error) {
      console.error('Registration error:', error)
      return c.json({ error: 'Registration failed' }, 500)
    }
  })

  // Logout
  .post('/logout', authMiddleware, async (c) => {
    const refreshToken = getCookie(c, 'refresh_token')

    if (refreshToken) {
      const program = Effect.gen(function*() {
        const authService = yield* AuthService
        const authRepo = yield* AuthRepo
        const payload = yield* authService.verifyRefreshToken(refreshToken)
        yield* authRepo.revokeRefreshToken(payload.tokenId)
      })

      await appRuntime.runPromise(program.pipe(Effect.catch(() => Effect.void)))
    }

    deleteCookie(c, 'refresh_token')
    return c.json({ message: 'Logged out successfully' })
  })
