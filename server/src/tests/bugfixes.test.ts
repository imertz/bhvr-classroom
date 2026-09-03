import { describe, it, expect, beforeAll } from "bun:test";
import { app } from "../index";
import { initializeDatabase, createTeacher, createStudent } from "../db/database";
import { generateAccessToken } from "../utils/jwt";
import type { AuthUser, Class, Assignment, Submission, Grade, Attendance } from "shared";
import { formatDate, getLocalDateString } from "../../../client/src/lib/utils";
import { unwrapJsonEffect } from "../../../client/src/lib/api";
import { Effect } from "effect";

let adminToken = "";
let teacherToken = "";
let studentToken = "";
let _otherStudentToken = "";

let teacherId = "";
let studentId = "";
let otherStudentId = "";

beforeAll(async () => {
  initializeDatabase();

  const adminUser: AuthUser = {
    id: "admin-fix-id",
    email: "admin_fix@example.com",
    role: "admin",
    userType: "teacher",
  };
  adminToken = await generateAccessToken(adminUser);

  const teacher = await createTeacher({
    email: `teacher_fix_${Date.now()}@example.com`,
    first_name: "Teacher",
    last_name: "Fix",
    password: "Password123!",
  });
  teacherId = teacher.id;
  teacherToken = await generateAccessToken({
    id: teacher.id,
    email: teacher.email,
    role: "teacher",
    userType: "teacher",
  });

  const student = await createStudent({
    email: `student_fix_${Date.now()}@example.com`,
    first_name: "Student",
    last_name: "One",
    date_of_birth: "2010-05-15",
    grade_level: 8,
    password: "Password123!",
  });
  studentId = student.id;
  studentToken = await generateAccessToken({
    id: student.id,
    email: student.email,
    role: "student",
    userType: "student",
  });

  const otherStudent = await createStudent({
    email: `student_other_${Date.now()}@example.com`,
    first_name: "Student",
    last_name: "Two",
    date_of_birth: "2010-09-20",
    grade_level: 8,
    password: "Password123!",
  });
  otherStudentId = otherStudent.id;
  _otherStudentToken = await generateAccessToken({
    id: otherStudent.id,
    email: otherStudent.email,
    role: "student",
    userType: "student",
  });
});

describe("Bugfix Verification Suite", () => {
  it("1.1: Deleting a class cascades cleanly to assignments, submissions, grades, and enrollments without 500 error", async () => {
    // Create class
    const clsRes = await app.request("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ name: "Cascade Class", subject: "Math", teacher_id: teacherId }),
    });
    expect(clsRes.status).toBe(201);
    // SAFETY: POST /api/classes returns created class in data
    const cls = ((await clsRes.json()) as { data: Class }).data;

    // Enroll student
    await app.request("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ class_id: cls.id, student_id: studentId }),
    });

    // Create assignment
    const assignRes = await app.request("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        class_id: cls.id,
        title: "Test HW",
        type: "homework",
        points_possible: 100,
        due_date: "2026-10-10T12:00:00",
      }),
    });
    // SAFETY: POST /api/assignments returns created assignment in data
    const assignment = ((await assignRes.json()) as { data: Assignment }).data;

    // Create submission
    const subRes = await app.request("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ assignment_id: assignment.id, student_id: studentId, content: "My work" }),
    });
    // SAFETY: POST /api/submissions returns created submission in data
    const sub = ((await subRes.json()) as { data: Submission }).data;

    // Grade submission
    await app.request("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ submission_id: sub.id, points_earned: 95 }),
    });

    // Post announcement
    await app.request("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ class_id: cls.id, title: "Test notice", content: "Details" }),
    });

    // Record attendance
    await app.request("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ class_id: cls.id, student_id: studentId, date: "2026-10-01", status: "present" }),
    });

    // Delete class - should cascade delete without foreign key error
    const delRes = await app.request(`/api/classes/${cls.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    expect(delRes.status).toBe(200);

    // Verify class is gone
    const checkRes = await app.request(`/api/classes/${cls.id}`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    expect(checkRes.status).toBe(404);
  });

  it("1.2: Student PII is masked for unauthenticated callers while returning 200 OK", async () => {
    const res = await app.request("/api/students");
    expect(res.status).toBe(200);
    // SAFETY: GET /api/students returns student list in data
    const json = (await res.json()) as { data: Array<{ email: string; date_of_birth: string }> };
    expect(json.data.length).toBeGreaterThan(0);
    for (const student of json.data) {
      expect(student.date_of_birth).toBe("••••-••-••");
      expect(student.email).toContain("*");
    }

    // Authenticated teacher sees unmasked data
    const authRes = await app.request("/api/students", {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    expect(authRes.status).toBe(200);
    // SAFETY: GET /api/students with auth returns student list in data
    const authJson = (await authRes.json()) as { data: Array<{ email: string; date_of_birth: string }> };
    expect(authJson.data[0]!.date_of_birth).not.toBe("••••-••-••");
  });

  it("1.3: Class details attendance is scoped to the requesting student", async () => {
    // Create class
    const clsRes = await app.request("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ name: "Attendance Scoping Class", subject: "Science", teacher_id: teacherId }),
    });
    // SAFETY: POST /api/classes returns created class in data
    const cls = ((await clsRes.json()) as { data: Class }).data;

    // Record attendance for both student and otherStudent
    await app.request("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ class_id: cls.id, student_id: studentId, date: "2026-10-02", status: "present" }),
    });
    await app.request("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ class_id: cls.id, student_id: otherStudentId, date: "2026-10-02", status: "present" }),
    });

    // Student requests class details
    const studentReq = await app.request(`/api/classes/${cls.id}/details`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(studentReq.status).toBe(200);
    // SAFETY: GET /api/classes/:id/details returns class details in data
    const studentData = (await studentReq.json()) as { data: { recentAttendance: Array<{ student_id: string }> } };
    expect(studentData.data.recentAttendance.length).toBe(1);
    expect(studentData.data.recentAttendance[0]!.student_id).toBe(studentId);

    // Teacher requests class details - sees both records
    const teacherReq = await app.request(`/api/classes/${cls.id}/details`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    // SAFETY: GET /api/classes/:id/details returns class details in data
    const teacherData = (await teacherReq.json()) as { data: { recentAttendance: Array<{ student_id: string }> } };
    expect(teacherData.data.recentAttendance.length).toBe(2);
  });

  it("1.4: Enrollments endpoint requires authentication and enforces student ownership", async () => {
    // Unauthenticated GET /api/enrollments returns 401
    const unauth = await app.request("/api/enrollments");
    expect(unauth.status).toBe(401);

    // Student trying to read another student's enrollments returns 403
    const forbidden = await app.request(`/api/enrollments/student/${otherStudentId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(forbidden.status).toBe(403);
  });

  it("1.5: Submissions status cannot be manipulated by students and graded submissions cannot be updated", async () => {
    // Create class and assignment
    const clsRes = await app.request("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ name: "Submissions Test", subject: "History", teacher_id: teacherId }),
    });
    // SAFETY: POST /api/classes returns created class in data
    const cls = ((await clsRes.json()) as { data: Class }).data;

    const assignRes = await app.request("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        class_id: cls.id,
        title: "Essay",
        type: "homework",
        points_possible: 100,
        due_date: "2026-10-15T12:00:00",
      }),
    });
    // SAFETY: POST /api/assignments returns created assignment in data
    const assignment = ((await assignRes.json()) as { data: Assignment }).data;

    // Student tries to submit with status: "graded"
    const subRes = await app.request("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        assignment_id: assignment.id,
        student_id: studentId,
        content: "Draft",
        status: "graded",
      }),
    });
    expect(subRes.status).toBe(201);
    // SAFETY: POST /api/submissions returns created submission in data
    const sub = ((await subRes.json()) as { data: Submission }).data;
    // Server forces status to "submitted"
    expect(sub.status).toBe("submitted");

    // Teacher grades submission -> 2.4 check
    const gradeRes = await app.request("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ submission_id: sub.id, points_earned: 90 }),
    });
    expect(gradeRes.status).toBe(201);
    // SAFETY: POST /api/grades returns created grade in data
    const grade = ((await gradeRes.json()) as { data: Grade }).data;

    // Check submission status became "graded"
    const gradedSubRes = await app.request(`/api/submissions/${sub.id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    // SAFETY: GET /api/submissions/:id returns submission in data
    const gradedSub = ((await gradedSubRes.json()) as { data: Submission }).data;
    expect(gradedSub.status).toBe("graded");

    // Student attempts to update already-graded submission -> 403
    const editGraded = await app.request(`/api/submissions/${sub.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ content: "Updated draft after grading" }),
    });
    expect(editGraded.status).toBe(403);

    // 2.4: Deleting the grade reverts submission status to "submitted"
    const delGrade = await app.request(`/api/grades/${grade.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    expect(delGrade.status).toBe(200);

    const revertedSubRes = await app.request(`/api/submissions/${sub.id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    // SAFETY: GET /api/submissions/:id returns submission in data
    const revertedSub = ((await revertedSubRes.json()) as { data: Submission }).data;
    expect(revertedSub.status).toBe("submitted");
  });

  it("2.1 & 2.2: Passwords are required with minimum 8 characters for students and teachers", async () => {
    // Missing / short student password
    const badStudent = await app.request("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        email: `short_${Date.now()}@example.com`,
        first_name: "Short",
        last_name: "Pass",
        date_of_birth: "2012-01-01",
        grade_level: 5,
        password: "short",
      }),
    });
    expect(badStudent.status).toBe(400);

    // Missing / short teacher password
    const badTeacher = await app.request("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        email: `short_t_${Date.now()}@example.com`,
        first_name: "Short",
        last_name: "Teacher",
        password: "short",
      }),
    });
    expect(badTeacher.status).toBe(400);
  });

  it("2.3: Attendance update preserves original recorded_at timestamp", async () => {
    // Create class and attendance
    const clsRes = await app.request("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ name: "Attendance Preserved", subject: "Art", teacher_id: teacherId }),
    });
    // SAFETY: POST /api/classes returns created class in data
    const cls = ((await clsRes.json()) as { data: Class }).data;

    const attnRes = await app.request("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ class_id: cls.id, student_id: studentId, date: "2026-10-05", status: "present" }),
    });
    // SAFETY: POST /api/attendance returns created attendance in data
    const attn = ((await attnRes.json()) as { data: Attendance }).data;
    const originalRecordedAt = attn.recorded_at;

    // Wait a tiny bit then update status
    await new Promise((r) => setTimeout(r, 15));
    const updateRes = await app.request(`/api/attendance/${attn.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ status: "tardy", notes: "Arrived 5 mins late" }),
    });
    // SAFETY: PUT /api/attendance/:id returns updated attendance in data
    const updatedAttn = ((await updateRes.json()) as { data: Attendance }).data;

    expect(updatedAttn.status).toBe("tardy");
    expect(updatedAttn.recorded_at).toBe(originalRecordedAt);
  });

  it("2.6: Assignments and announcements are scoped to student's enrolled classes", async () => {
    // Class 1: student is enrolled
    const cls1Res = await app.request("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ name: "Enrolled Class", subject: "Music", teacher_id: teacherId }),
    });
    // SAFETY: POST /api/classes returns created class in data
    const cls1 = ((await cls1Res.json()) as { data: Class }).data;

    await app.request("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ class_id: cls1.id, student_id: studentId }),
    });

    // Class 2: student is NOT enrolled
    const cls2Res = await app.request("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ name: "Unenrolled Class", subject: "Drama", teacher_id: teacherId }),
    });
    // SAFETY: POST /api/classes returns created class in data
    const cls2 = ((await cls2Res.json()) as { data: Class }).data;

    // Create assignments in both classes
    await app.request("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        class_id: cls1.id,
        title: "Music Project",
        type: "project",
        points_possible: 100,
        due_date: "2026-10-20T12:00:00",
      }),
    });
    await app.request("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        class_id: cls2.id,
        title: "Drama Monologue",
        type: "project",
        points_possible: 100,
        due_date: "2026-10-20T12:00:00",
      }),
    });

    // Create announcements in both classes
    await app.request("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ class_id: cls1.id, title: "Music concert", content: "Tonight" }),
    });
    await app.request("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ class_id: cls2.id, title: "Drama rehearsal", content: "Tomorrow" }),
    });

    // Student GET /api/assignments
    const studentAssign = await app.request("/api/assignments", {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    // SAFETY: GET /api/assignments returns list of assignments in data
    const assignJson = (await studentAssign.json()) as { data: Array<{ class_id: string }> };
    expect(assignJson.data.every((a) => a.class_id === cls1.id)).toBe(true);

    // Student GET /api/announcements
    const studentAnnc = await app.request("/api/announcements", {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    // SAFETY: GET /api/announcements returns list of announcements in data
    const anncJson = (await studentAnnc.json()) as { data: Array<{ class_id: string }> };
    expect(anncJson.data.every((a) => a.class_id === cls1.id)).toBe(true);
  });

  it("3.2: getLocalDateString returns YYYY-MM-DD in local time without UTC day skew", () => {
    const testDate = new Date(2026, 4, 15, 0, 30, 0); // May 15, 2026 at 00:30 AM local
    expect(getLocalDateString(testDate)).toBe("2026-05-15");
  });

  it("3.5: unwrapJsonEffect executes lazily when passed a promise thunk", async () => {
    let called = false;
    const effect = unwrapJsonEffect(() => {
      called = true;
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    });

    // Not called before Effect is run
    expect(called).toBe(false);

    // Called when Effect runs
    const res = await Effect.runPromise(effect);
    expect(called).toBe(true);
    expect(res).toEqual({ ok: true });
  });

  it("4.1: Student PII is masked in class details for unauthenticated callers", async () => {
    // Create class and enrollment
    const clsRes = await app.request("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ name: "PII Shield Class", subject: "Cybersecurity", teacher_id: teacherId }),
    });
    // SAFETY: POST /api/classes returns created class in data
    const cls = ((await clsRes.json()) as { data: Class }).data;

    await app.request("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ class_id: cls.id, student_id: studentId }),
    });

    // Unauthenticated caller gets class details
    const unauthRes = await app.request(`/api/classes/${cls.id}/details`);
    expect(unauthRes.status).toBe(200);
    // SAFETY: GET /api/classes/:id/details returns ClassDetails in data
    const unauthData = (await unauthRes.json()) as {
      data: { enrollments: Array<{ student: { id: string; email: string } }> };
    };
    expect(unauthData.data.enrollments.length).toBeGreaterThan(0);
    expect(unauthData.data.enrollments[0]!.student.email).toContain("*");

    // Authenticated teacher sees unmasked email
    const authRes = await app.request(`/api/classes/${cls.id}/details`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    expect(authRes.status).toBe(200);
    // SAFETY: GET /api/classes/:id/details returns ClassDetails in data
    const authData = (await authRes.json()) as {
      data: { enrollments: Array<{ student: { id: string; email: string } }> };
    };
    expect(authData.data.enrollments[0]!.student.email).not.toContain("*");
  });

  it("4.2: GET /api/classes/student/:studentId requires authentication and enforces ownership", async () => {
    // Unauthenticated call returns 401
    const unauth = await app.request(`/api/classes/student/${studentId}`);
    expect(unauth.status).toBe(401);

    // Other student returns 403
    const forbidden = await app.request(`/api/classes/student/${otherStudentId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(forbidden.status).toBe(403);

    // Student themselves returns 200
    const allowed = await app.request(`/api/classes/student/${studentId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(allowed.status).toBe(200);
  });

  it("4.3: Students can submit assignments without explicitly providing student_id", async () => {
    const clsRes = await app.request("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ name: "Auto Student ID Class", subject: "Math", teacher_id: teacherId }),
    });
    // SAFETY: POST /api/classes returns created class in data
    const cls = ((await clsRes.json()) as { data: Class }).data;

    const assignRes = await app.request("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        class_id: cls.id,
        title: "Homework Auto ID",
        type: "homework",
        points_possible: 100,
        due_date: "2026-11-01T12:00:00",
      }),
    });
    // SAFETY: POST /api/assignments returns created assignment in data
    const assignment = ((await assignRes.json()) as { data: Assignment }).data;

    // Student submits without student_id in body
    const subRes = await app.request("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ assignment_id: assignment.id, content: "My homework without student_id" }),
    });
    expect(subRes.status).toBe(201);
    // SAFETY: POST /api/submissions returns created submission in data
    const sub = ((await subRes.json()) as { data: Submission }).data;
    expect(sub.student_id).toBe(studentId);
  });

  it("4.4: Students cannot delete graded submissions", async () => {
    const clsRes = await app.request("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ name: "No Grade Deletion Class", subject: "Literature", teacher_id: teacherId }),
    });
    // SAFETY: POST /api/classes returns created class in data
    const cls = ((await clsRes.json()) as { data: Class }).data;

    const assignRes = await app.request("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({
        class_id: cls.id,
        title: "Essay to Grade",
        type: "homework",
        points_possible: 100,
        due_date: "2026-11-01T12:00:00",
      }),
    });
    // SAFETY: POST /api/assignments returns created assignment in data
    const assignment = ((await assignRes.json()) as { data: Assignment }).data;

    const subRes = await app.request("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ assignment_id: assignment.id, content: "Essay submission" }),
    });
    expect(subRes.status).toBe(201);
    // SAFETY: POST /api/submissions returns created submission in data
    const sub = ((await subRes.json()) as { data: Submission }).data;

    // Teacher grades submission
    await app.request("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${teacherToken}` },
      body: JSON.stringify({ submission_id: sub.id, points_earned: 45 }),
    });

    // Student tries to delete the graded submission -> 403
    const deleteRes = await app.request(`/api/submissions/${sub.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(deleteRes.status).toBe(403);
  });

  it("4.5: formatDate preserves masked placeholder date string without returning Invalid Date", () => {
    expect(formatDate("••••-••-••")).toBe("••••-••-••");
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
  });
});
