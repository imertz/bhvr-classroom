import { describe, it, expect, beforeAll } from "bun:test";
import {
  initializeDatabase,
  createTeacher,
  findTeacherById,
  findTeacherByEmail,
  updateTeacher,
  deleteTeacher,
  createStudent,
  findStudentById,
  updateStudent,
  deleteStudent,
  createClass,
  findClassById,
  createAssignment,
  findAssignmentById,
  createAnnouncement,
  updateAnnouncement,
  findAnnouncementById
} from "../db/database";

beforeAll(() => {
  initializeDatabase();
});

describe("Database Layer Operations & Integrity", () => {
  it("should create and retrieve a teacher", async () => {
    const email = `db_teacher_${Date.now()}@example.com`;
    const teacher = await createTeacher({
      email,
      first_name: "DB",
      last_name: "Teacher",
      password: "SecurePassword123!"
    });

    expect(teacher.id).toBeDefined();
    expect(teacher.email).toBe(email);
    expect((teacher as any).password_hash).toBeUndefined();

    const byId = await findTeacherById(teacher.id);
    expect(byId?.email).toBe(email);
    expect((byId as any)?.password_hash).toBeUndefined();

    const byEmail = await findTeacherByEmail(email);
    expect(byEmail?.id).toBe(teacher.id);
    expect(byEmail?.password_hash).toBeDefined();
  });

  it("should update a teacher and verify password change", async () => {
    const email = `db_update_teacher_${Date.now()}@example.com`;
    const teacher = await createTeacher({
      email,
      first_name: "Original",
      last_name: "Name",
      password: "Password1!"
    });

    const updated = await updateTeacher(teacher.id, {
      first_name: "Updated",
      password: "NewPassword2!"
    });

    expect(updated?.first_name).toBe("Updated");
    expect((updated as any)?.password_hash).toBeUndefined();
    const teacherRecord = await findTeacherByEmail(email);
    expect(teacherRecord?.password_hash).toBeDefined();
    const isNewValid = await Bun.password.verify("NewPassword2!", teacherRecord!.password_hash);
    expect(isNewValid).toBe(true);
  });

  it("should create, update, and delete a student", async () => {
    const email = `db_student_${Date.now()}@example.com`;
    const student = await createStudent({
      email,
      first_name: "Student",
      last_name: "Test",
      date_of_birth: "2012-05-20",
      grade_level: 6,
      password: "StudentPass123!"
    });

    expect(student.id).toBeDefined();
    expect(student.grade_level).toBe(6);

    const updated = await updateStudent(student.id, {
      grade_level: 7
    });
    expect(updated?.grade_level).toBe(7);

    const deleted = await deleteStudent(student.id);
    expect(deleted).toBe(true);

    const check = await findStudentById(student.id);
    expect(check).toBeNull();
  });

  it("should preserve created_at on announcement update", async () => {
    const teacher = await createTeacher({
      email: `ann_teacher_${Date.now()}@example.com`,
      first_name: "Ann",
      last_name: "Teacher",
      password: "Password123!"
    });

    const class_ = await createClass({
      name: "History 101",
      subject: "History",
      teacher_id: teacher.id
    });

    const ann = await createAnnouncement({
      class_id: class_.id,
      teacher_id: teacher.id,
      title: "History Exam Next Week",
      content: "Study chapters 1 to 5",
      expires_at: null
    });

    const originalCreatedAt = ann.created_at;

    // Small delay
    await new Promise(r => setTimeout(r, 10));

    const updated = await updateAnnouncement(ann.id, {
      title: "History Exam Rescheduled",
      content: "Study chapters 1 to 6"
    });

    expect(updated?.created_at).toBe(originalCreatedAt);
    expect(updated?.title).toBe("History Exam Rescheduled");
  });
});
