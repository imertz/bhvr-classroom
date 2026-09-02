import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
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
import { requireTeacher, requireAuth, optionalAuthMiddleware, requireAdmin } from "./middleware/auth";
import { requestLogger } from "./middleware/logging";
import { errorMiddleware, errorHandler } from "./middleware/error";

// Initialize database
import { initializeDatabase, initializeAdminUser } from "./db/database";
import { appRuntime } from "./services/AppRuntime";

// Initialize database and admin user on startup
initializeDatabase();
initializeAdminUser();

let isShuttingDown = false;
const shutdown = async () => {
	if (isShuttingDown) return;
	isShuttingDown = true;
	try {
		await appRuntime.dispose();
	} catch (err) {
		console.error("Error during shutdown:", err);
	} finally {
		process.exit(0);
	}
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export const app = new Hono<{ Variables: AuthVariables }>()
	.use(requestId())
	.use(requestLogger)
	.use(cors({
		origin: 'http://localhost:5173',
		credentials: true,
	}))
	.use(errorMiddleware)
	.onError(errorHandler)

// Public routes
app.get("/", (c) => c.text("Classroom Management API"));
app.get("/health", (c) => c.json({ status: "ok" }));
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

// Grades routes - authenticated read, teacher/admin write
app.get('/api/grades/*', requireAuth)
app.post('/api/grades', requireAuth, requireTeacher)
app.put('/api/grades/*', requireAuth, requireTeacher)
app.delete('/api/grades/*', requireAuth, requireTeacher)

// Attendance routes - authenticated read, teacher/admin write
app.get('/api/attendance/*', requireAuth)
app.post('/api/attendance', requireAuth, requireTeacher)
app.put('/api/attendance/*', requireAuth, requireTeacher)
app.delete('/api/attendance/*', requireAuth, requireTeacher)

// Mount the route handlers with chaining for Hono RPC type inference
export const routes = app
	.route("/auth", authRoutes)
	.route("/api/teachers", teacherRoutes)
	.route("/api/students", studentRoutes)
	.route("/api/classes", classRoutes)
	.route("/api/enrollments", enrollmentRoutes)
	.route("/api/assignments", assignmentRoutes)
	.route("/api/submissions", submissionRoutes)
	.route("/api/grades", gradeRoutes)
	.route("/api/attendance", attendanceRoutes)
	.route("/api/announcements", announcementRoutes);

export type AppType = typeof routes;

export default {
	port: 3000,
	fetch: app.fetch,
}
