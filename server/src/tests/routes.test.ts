import { describe, it, expect, beforeAll } from "bun:test";
import { app } from "../index";
import { initializeDatabase, createTeacher, createStudent } from "../db/database";
import { generateAccessToken } from "../utils/jwt";
import type { Teacher, Student, Class, ClassDetails, Enrollment, Assignment, Submission, Grade, Attendance } from "shared";

let adminToken = "";
let teacherToken = "";
let studentToken = "";

let testTeacherId = "";
let testStudentId = "";
let testClassId = "";
let testAssignmentId = "";
let testSubmissionId = "";

beforeAll(async () => {
  initializeDatabase();

  // Create admin user token
  const adminUser: AuthUser = {
    id: "admin-test-id",
    email: "admin_test@example.com",
    role: "admin",
    userType: "teacher"
  };
  adminToken = await generateAccessToken(adminUser);

  // Create teacher
  const teacher = await createTeacher({
    email: `teacher_route_${Date.now()}@example.com`,
    first_name: "John",
    last_name: "Teacher",
    password: "Password123!"
  });
  testTeacherId = teacher.id;

  const teacherUser: AuthUser = {
    id: teacher.id,
    email: teacher.email,
    role: "teacher",
    userType: "teacher"
  };
  teacherToken = await generateAccessToken(teacherUser);

  // Create student
  const student = await createStudent({
    email: `student_route_${Date.now()}@example.com`,
    first_name: "Jane",
    last_name: "Student",
    date_of_birth: "2011-04-12",
    grade_level: 7,
    password: "Password123!"
  });
  testStudentId = student.id;

  const studentUser: AuthUser = {
    id: student.id,
    email: student.email,
    role: "student",
    userType: "student"
  };
  studentToken = await generateAccessToken(studentUser);
});

describe("API Routes & Role-Based Access Control", () => {
  describe("Teachers Management (/api/teachers)", () => {
    it("should allow public read access to teachers list and not leak password_hash", async () => {
      const res = await app.request("/api/teachers");
      expect(res.status).toBe(200);
      // SAFETY: /api/teachers returns data array of teachers
      const body = (await res.json()) as { data: Teacher[] };
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      for (const t of body.data) {
        expect('password_hash' in t).toBe(false);
      }
    });

    it("should forbid non-admin from creating a teacher (403)", async () => {
      const res = await app.request("/api/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          email: "another_teacher@example.com",
          first_name: "Bob",
          last_name: "Smith",
          password: "Password123!"
        })
      });

      expect(res.status).toBe(403);
    });

    it("should allow admin to create a teacher without leaking password_hash (201)", async () => {
      const res = await app.request("/api/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          email: `created_by_admin_${Date.now()}@example.com`,
          first_name: "AdminCreated",
          last_name: "Teacher",
          password: "Password123!"
        })
      });

      expect(res.status).toBe(201);
      // SAFETY: POST /api/teachers returns created teacher in data
      const body = (await res.json()) as { data: Teacher };
      expect(body.data.first_name).toBe("AdminCreated");
      expect('password_hash' in body.data).toBe(false);
    });

    it("should get teacher by ID without leaking password_hash", async () => {
      const res = await app.request(`/api/teachers/${testTeacherId}`);
      expect(res.status).toBe(200);
      // SAFETY: GET /api/teachers/:id returns teacher in data
      const body = (await res.json()) as { data: Teacher };
      expect(body.data.id).toBe(testTeacherId);
      expect('password_hash' in body.data).toBe(false);
    });
  });

  describe("Students Management (/api/students)", () => {
    it("should allow public read access to students list without leaking password_hash", async () => {
      const res = await app.request("/api/students");
      expect(res.status).toBe(200);
      // SAFETY: GET /api/students returns data array of students
      const body = (await res.json()) as { data: Student[] };
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      for (const s of body.data) {
        expect('password_hash' in s).toBe(false);
      }
    });

    it("should get student by ID without leaking password_hash", async () => {
      const res = await app.request(`/api/students/${testStudentId}`);
      expect(res.status).toBe(200);
      // SAFETY: GET /api/students/:id returns student in data
      const body = (await res.json()) as { data: Student };
      expect(body.data.id).toBe(testStudentId);
      expect('password_hash' in body.data).toBe(false);
    });
  });

  describe("Classes Management (/api/classes)", () => {
    it("should allow teacher to create a class", async () => {
      const res = await app.request("/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          name: "Biology 101",
          subject: "Science",
          teacher_id: testTeacherId,
          room_number: "Lab 3",
          schedule: "Mon/Wed 10:00 AM"
        })
      });

      expect(res.status).toBe(201);
      // SAFETY: POST /api/classes returns created class in data
      const body = (await res.json()) as { data: Class };
      expect(body.data.id).toBeDefined();
      expect(body.data.name).toBe("Biology 101");
      testClassId = body.data.id;
    });

    it("should reject creating class with non-existent teacher due to foreign key", async () => {
      const res = await app.request("/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          name: "Ghost Class",
          subject: "Mystery",
          teacher_id: "non-existent-teacher-id"
        })
      });

      // Returns 500 or error when DB constraint fails
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("should list classes", async () => {
      const res = await app.request("/api/classes");
      expect(res.status).toBe(200);
      // SAFETY: GET /api/classes returns data array of classes
      const body = (await res.json()) as { data: Class[] };
      expect(body.data.some((c) => c.id === testClassId)).toBe(true);
    });

    it("should get complete class details by ID", async () => {
      const res = await app.request(`/api/classes/${testClassId}/details`);
      expect(res.status).toBe(200);
      // SAFETY: GET /api/classes/:id/details returns ClassDetails in data
      const body = (await res.json()) as { data: ClassDetails };
      expect(body.data).toBeDefined();
      expect(body.data.class.id).toBe(testClassId);
      expect(body.data.class.name).toBe("Biology 101");
      expect(body.data.teacher).toBeDefined();
      expect(body.data.teacher?.id).toBe(testTeacherId);
      expect(Array.isArray(body.data.enrollments)).toBe(true);
      expect(Array.isArray(body.data.assignments)).toBe(true);
      expect(Array.isArray(body.data.announcements)).toBe(true);
      expect(Array.isArray(body.data.recentAttendance)).toBe(true);
      expect(body.data.stats).toBeDefined();
      expect(body.data.stats.totalEnrollments).toBeGreaterThanOrEqual(0);
    });

    it("should return 404 for non-existent class details", async () => {
      const res = await app.request("/api/classes/non-existent-class-id/details");
      expect(res.status).toBe(404);
    });
  });

  describe("Enrollments (/api/enrollments)", () => {
    it("should enroll student in class", async () => {
      const res = await app.request("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          student_id: testStudentId,
          class_id: testClassId,
          status: "active"
        })
      });

      expect(res.status).toBe(201);
      // SAFETY: POST /api/enrollments returns created enrollment in data
      const body = (await res.json()) as { data: Enrollment };
      expect(body.data.student_id).toBe(testStudentId);
      expect(body.data.class_id).toBe(testClassId);
    });
  });

  describe("Assignments (/api/assignments)", () => {
    it("should create assignment for class", async () => {
      const res = await app.request("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          class_id: testClassId,
          title: "Lab Report 1",
          description: "Write report on cell division",
          type: "homework",
          points_possible: 100,
          due_date: "2026-10-01T23:59:00"
        })
      });

      expect(res.status).toBe(201);
      // SAFETY: POST /api/assignments returns created assignment in data
      const body = (await res.json()) as { data: Assignment };
      expect(body.data.id).toBeDefined();
      testAssignmentId = body.data.id;
    });
  });

  describe("Submissions & Student Permissions (/api/submissions)", () => {
    it("should allow student to submit assignment for themselves", async () => {
      const res = await app.request("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          student_id: testStudentId,
          content: "My completed biology report",
          status: "submitted"
        })
      });

      expect(res.status).toBe(201);
      // SAFETY: POST /api/submissions returns created submission in data
      const body = (await res.json()) as { data: Submission };
      expect(body.data.id).toBeDefined();
      testSubmissionId = body.data.id;
    });

    it("should forbid student from submitting assignment for another student", async () => {
      const res = await app.request("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          assignment_id: testAssignmentId,
          student_id: "other-student-id",
          content: "Fake submission",
          status: "submitted"
        })
      });

      expect(res.status).toBe(403);
    });
  });

  describe("Grades & Attendance Security", () => {
    it("should forbid unauthenticated access to /api/grades", async () => {
      const res = await app.request("/api/grades");
      expect(res.status).toBe(401);
    });

    it("should allow teacher to grade a submission", async () => {
      const res = await app.request("/api/grades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          submission_id: testSubmissionId,
          points_earned: 95,
          feedback: "Great analysis!",
          graded_by: testTeacherId
        })
      });

      expect(res.status).toBe(201);
      // SAFETY: POST /api/grades returns created grade in data
      const body = (await res.json()) as { data: Grade };
      expect(body.data.points_earned).toBe(95);
    });

    it("should allow student to read their own grades", async () => {
      const res = await app.request("/api/grades", {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      expect(res.status).toBe(200);
      // SAFETY: GET /api/grades returns list of grades in data
      const body = (await res.json()) as { data: Grade[] };
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should forbid student from creating a grade (403)", async () => {
      const res = await app.request("/api/grades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          submission_id: testSubmissionId,
          points_earned: 100,
          graded_by: testStudentId
        })
      });
      expect(res.status).toBe(403);
    });

    it("should forbid student from recording attendance (403)", async () => {
      const res = await app.request("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          student_id: testStudentId,
          class_id: testClassId,
          date: "2026-09-01",
          status: "present"
        })
      });

      expect(res.status).toBe(403);
    });

    it("should allow teacher to record attendance", async () => {
      const res = await app.request("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          student_id: testStudentId,
          class_id: testClassId,
          date: "2026-09-01",
          status: "present",
          notes: "On time"
        })
      });

      expect(res.status).toBe(201);
      // SAFETY: POST /api/attendance returns created attendance in data
      const body = (await res.json()) as { data: Attendance };
      expect(body.data.status).toBe("present");
    });

    it("should allow student to read their own attendance records", async () => {
      const res = await app.request("/api/attendance", {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      expect(res.status).toBe(200);
      // SAFETY: GET /api/attendance returns list of attendance in data
      const body = (await res.json()) as { data: Attendance[] };
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should allow student to retrieve their enrolled classes", async () => {
      const res = await app.request("/api/classes", {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      expect(res.status).toBe(200);
      // SAFETY: GET /api/classes returns list of classes in data
      const body = (await res.json()) as { data: Class[] };
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.some((c) => c.id === testClassId)).toBe(true);
    });
  });
});

