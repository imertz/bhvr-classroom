import { Hono } from "hono";
import { cors } from "hono/cors";

// Import all route files
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
import { authMiddleware } from "./middleware/auth";
import { errorMiddleware } from "./middleware/error";

// Initialize database
import { initializeDatabase } from "./db/database";

// Initialize database on startup
initializeDatabase();

export const app = new Hono()
	.use(cors())
	.use(errorMiddleware)

// Public routes
app.get("/", (c) => c.text("Classroom Management API"));
app.get("/health", (c) => c.json({ status: "ok" }));

// Protected routes (add auth middleware to each)
app.route("/teachers", teacherRoutes);
app.route("/students", studentRoutes);
app.route("/classes", classRoutes);
app.route("/enrollments", enrollmentRoutes);
app.route("/assignments", assignmentRoutes);
app.route("/submissions", submissionRoutes);
app.route("/grades", gradeRoutes);
app.route("/attendance", attendanceRoutes);
app.route("/announcements", announcementRoutes);

export default {
	port: 3000,
	fetch: app.fetch,
}