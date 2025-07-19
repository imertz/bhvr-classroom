import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AuthVariables } from './types/auth'

// Import all route files
import { authRoutes } from "./routes/auth";
import { teacherRoutes } from "./routes/teachers";
import { studentRoutes } from "./routes/students";
import { classRoutes } from "./routes/classes";
import { enrollmentRoutes } from "./routes/enrollments";
import { assignmentRoutes } from "./routes/assignments";
import { submissionRoutes } from "./routes/submissions";
import { gradeRoutes } from "./routes/grades";
import { attendanceRoutes } from "./routes/attendance";
import { announcementRoutes } from "./routes/announcements";

// Import middleware
import { authMiddleware, requireTeacher, requireAuth, optionalAuthMiddleware, requireAdmin } from "./middleware/auth";
import { errorMiddleware } from "./middleware/error";

// Initialize database
import { initializeDatabase, initializeAdminUser } from "./db/database";

// Initialize database and admin user on startup
initializeDatabase();
initializeAdminUser();

export const app = new Hono<{ Variables: AuthVariables }>()
	.use(cors({
		origin: 'http://localhost:5173',
		credentials: true,
	}))
	.use(errorMiddleware)

// Public routes
app.get("/", (c) => c.text("Classroom Management API"));
app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/auth", authRoutes);

// Teachers routes - admin only for write operations, public read
app.get('/api/teachers/*', optionalAuthMiddleware)
app.post('/api/teachers', requireAuth, requireAdmin)
app.put('/api/teachers/*', requireAuth, requireAdmin)
app.delete('/api/teachers/*', requireAuth, requireAdmin)

// Students routes - teacher/admin for write operations, public read
app.get('/api/students/*', optionalAuthMiddleware)
app.post('/api/students', requireAuth, requireTeacher)
app.put('/api/students/*', requireAuth, requireTeacher)
app.delete('/api/students/*', requireAuth, requireTeacher)

// Classes routes - teacher/admin for write operations, public read
app.get('/api/classes/*', optionalAuthMiddleware)
app.post('/api/classes', requireAuth, requireTeacher)
app.put('/api/classes/*', requireAuth, requireTeacher)
app.delete('/api/classes/*', requireAuth, requireTeacher)

// Assignments routes - teacher/admin for write operations, public read
app.get('/api/assignments/*', optionalAuthMiddleware)
app.post('/api/assignments', requireAuth, requireTeacher)
app.put('/api/assignments/*', requireAuth, requireTeacher)
app.delete('/api/assignments/*', requireAuth, requireTeacher)

// Announcements routes - teacher/admin for write operations, public read
app.get('/api/announcements/*', optionalAuthMiddleware)
app.post('/api/announcements', requireAuth, requireTeacher)
app.put('/api/announcements/*', requireAuth, requireTeacher)
app.delete('/api/announcements/*', requireAuth, requireTeacher)

// Enrollments routes - authenticated users can read, teacher/admin for write
app.get('/api/enrollments/*', optionalAuthMiddleware)
app.post('/api/enrollments', requireAuth, requireTeacher)
app.put('/api/enrollments/*', requireAuth, requireTeacher)
app.delete('/api/enrollments/*', requireAuth, requireTeacher)

// Submissions routes - public read, authenticated write with role checks
app.get('/api/submissions/*', optionalAuthMiddleware)
app.post('/api/submissions', requireAuth, async (c, next) => {
	const user = c.get('user')
	if (!user) {
		return c.json({ error: 'Authentication required' }, 401)
	}
	if (user.role === 'student') {
		const body = await c.req.json()
		// Ensure student can only submit for themselves
		if (body.student_id !== user.id) {
			return c.json({ error: 'You can only submit assignments for yourself.' }, 403)
		}
	}
	await next()
})
app.put('/api/submissions/*', requireAuth)
app.delete('/api/submissions/*', requireAuth)

// Grades routes - teacher/admin only (sensitive data)
app.use('/api/grades/*', requireAuth, requireTeacher)

// Attendance routes - teacher/admin only (sensitive data)
app.use('/api/attendance/*', requireAuth, requireTeacher)

// Mount the route handlers
app.route("/api/teachers", teacherRoutes);
app.route("/api/students", studentRoutes);
app.route("/api/classes", classRoutes);
app.route("/api/enrollments", enrollmentRoutes);
app.route("/api/assignments", assignmentRoutes);
app.route("/api/submissions", submissionRoutes);
app.route("/api/grades", gradeRoutes);
app.route("/api/attendance", attendanceRoutes);
app.route("/api/announcements", announcementRoutes);

export default {
	port: 3000,
	fetch: app.fetch,
}