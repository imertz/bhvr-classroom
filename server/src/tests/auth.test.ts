import { describe, it, expect, beforeAll } from "bun:test";
import { app } from "../index";
import { initializeDatabase, createStudent } from "../db/database";

beforeAll(() => {
  initializeDatabase();
});

interface AuthResponse {
  user?: { email?: string; role?: string };
  accessToken?: string;
  error?: string;
}

describe("Authentication & Authorization API", () => {
  const teacherEmail = `teacher_${Date.now()}@example.com`;
  const teacherPassword = "Password123!";
  const studentEmail = `student_${Date.now()}@example.com`;
  const studentPassword = "StudentPassword123!";

  let teacherToken = "";
  let teacherRefreshTokenCookie = "";

  it("should register a new teacher", async () => {
    const res = await app.request("/auth/teacher/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: teacherEmail,
        password: teacherPassword,
        first_name: "Test",
        last_name: "Teacher"
      })
    });

    expect(res.status).toBe(201);
    // SAFETY: register response returns AuthResponse json
    const body = (await res.json()) as AuthResponse;
    expect(body.user).toBeDefined();
    expect(body.user?.email).toBe(teacherEmail);
    expect(body.user?.role).toBe("teacher");
    expect(body.accessToken).toBeDefined();

    teacherToken = body.accessToken || "";
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      teacherRefreshTokenCookie = setCookie.split(";")[0]!;
    }
  });

  it("should reject teacher login with wrong password", async () => {
    const res = await app.request("/auth/teacher/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: teacherEmail,
        password: "WrongPassword!"
      })
    });

    expect(res.status).toBe(401);
    // SAFETY: error response returns AuthResponse json
    const body = (await res.json()) as AuthResponse;
    expect(body.error).toBe("Invalid credentials");
  });

  it("should login teacher successfully via /auth/teacher/login", async () => {
    const res = await app.request("/auth/teacher/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: teacherEmail,
        password: teacherPassword
      })
    });

    expect(res.status).toBe(200);
    // SAFETY: login response returns AuthResponse json
    const body = (await res.json()) as AuthResponse;
    expect(body.user?.email).toBe(teacherEmail);
    expect(body.accessToken).toBeDefined();
    teacherToken = body.accessToken || "";

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      teacherRefreshTokenCookie = setCookie.split(";")[0]!;
    }
  });

  it("should login teacher successfully via unified /auth/login", async () => {
    const res = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: teacherEmail,
        password: teacherPassword
      })
    });

    expect(res.status).toBe(200);
    // SAFETY: login response returns AuthResponse json
    const body = (await res.json()) as AuthResponse;
    expect(body.user?.email).toBe(teacherEmail);
    expect(body.user?.role).toBe("teacher");
    expect(body.accessToken).toBeDefined();
  });

  it("should create a student with password and log in via student endpoints", async () => {
    // Create student
    const student = await createStudent({
      email: studentEmail,
      first_name: "Alice",
      last_name: "Student",
      date_of_birth: "2010-09-01",
      grade_level: 8,
      password: studentPassword
    });

    expect(student.id).toBeDefined();
    expect(student.email).toBe(studentEmail);

    // Login via /auth/student/login
    const res = await app.request("/auth/student/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: studentEmail,
        password: studentPassword
      })
    });

    expect(res.status).toBe(200);
    // SAFETY: student login response returns AuthResponse json
    const body = (await res.json()) as AuthResponse;
    expect(body.user?.email).toBe(studentEmail);
    expect(body.user?.role).toBe("student");
    expect(body.accessToken).toBeDefined();

    // Login via unified /auth/login
    const unifiedRes = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: studentEmail,
        password: studentPassword
      })
    });

    expect(unifiedRes.status).toBe(200);
    // SAFETY: unified login response returns AuthResponse json
    const unifiedBody = (await unifiedRes.json()) as AuthResponse;
    expect(unifiedBody.user?.email).toBe(studentEmail);
    expect(unifiedBody.user?.role).toBe("student");
  });

  it("should return current user data on /auth/me", async () => {
    const res = await app.request("/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });

    expect(res.status).toBe(200);
    // SAFETY: /auth/me response returns AuthResponse json
    const body = (await res.json()) as AuthResponse;
    expect(body.user?.email).toBe(teacherEmail);
    expect(body.user?.role).toBe("teacher");
  });

  it("should refresh access token via /auth/refresh with cookie", async () => {
    if (!teacherRefreshTokenCookie) return;

    const res = await app.request("/auth/refresh", {
      method: "POST",
      headers: {
        Cookie: teacherRefreshTokenCookie
      }
    });

    expect(res.status).toBe(200);
    // SAFETY: refresh response returns AuthResponse json
    const body = (await res.json()) as AuthResponse;
    expect(body.accessToken).toBeDefined();
    expect(body.user?.email).toBe(teacherEmail);
  });

  it("should reject /auth/me with invalid or missing token", async () => {
    const res = await app.request("/auth/me", {
      method: "GET"
    });
    expect(res.status).toBe(401);

    const res2 = await app.request("/auth/me", {
      method: "GET",
      headers: { Authorization: "Bearer invalid-token" }
    });
    expect(res2.status).toBe(401);
  });
});
