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
import { authMiddleware, requireTeacher } from "./middleware/auth";
import { errorMiddleware } from "./middleware/error";

// Initialize database
import { initializeDatabase } from "./db/database";

// Initialize database on startup
initializeDatabase();

export const app = new Hono<{ Variables: AuthVariables }>()
	.use(cors())
	.use(errorMiddleware)

// Public routes
app.get("/", (c) => c.text("Classroom Management API"));
app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/auth", authRoutes);

// Protected routes
app.use('/api/*', authMiddleware)

// Apply role-based protection to specific routes
app.use('/api/teachers/*', requireTeacher)
app.use('/api/students/*', requireTeacher) // Only teachers can manage students
app.use('/api/grades/*', requireTeacher)
app.use('/api/attendance/*', requireTeacher)

// Students can only create/update their own submissions
app.use('/api/submissions', authMiddleware)
app.post('/api/submissions', async (c, next) => {
	const user = c.get('user')
	if (user.role === 'student') {
		const body = await c.req.json()
		// Ensure student can only submit for themselves
		if (body.student_id !== user.id) {
			return c.json({ error: 'You can only submit assignments for yourself.' }, 403)
		}
	}
	await next()
})


// Protected routes (add auth middleware to each)
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