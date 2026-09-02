import { Effect } from "effect";
import type { Teacher, TeacherInput } from "shared/dist";
import type { Student, StudentInput } from "shared/dist";
import type { Class, ClassInput } from "shared/dist";
import type { Enrollment, EnrollmentInput } from "shared/dist";
import type { Assignment, AssignmentInput } from "shared/dist";
import type { Submission, SubmissionInput } from "shared/dist";
import type { Grade, GradeInput } from "shared/dist";
import type { Attendance, AttendanceInput } from "shared/dist";
import type { Announcement, AnnouncementInput } from "shared/dist";
import { appRuntime } from "../services/AppRuntime";
import { SqliteClient } from "../services/SqliteClient";
import { TeacherRepo, type TeacherRecord } from "../services/TeacherRepo";
import { StudentRepo, type StudentRecord } from "../services/StudentRepo";
import { ClassRepo } from "../services/ClassRepo";
import { EnrollmentRepo } from "../services/EnrollmentRepo";
import { AssignmentRepo } from "../services/AssignmentRepo";
import { SubmissionRepo } from "../services/SubmissionRepo";
import { GradeRepo } from "../services/GradeRepo";
import { AttendanceRepo } from "../services/AttendanceRepo";
import { AnnouncementRepo } from "../services/AnnouncementRepo";
import { AuthRepo, type RefreshToken, type RefreshTokenInput } from "../services/AuthRepo";
import { AuthService } from "../services/AuthService";

export type { TeacherRecord, StudentRecord, RefreshToken, RefreshTokenInput };

export function initializeDatabase() {
  // SqliteClient layer automatically initializes the database, WAL, and migrations
  return appRuntime.runSync(
    SqliteClient.use((sqlite) => Effect.succeed(sqlite.db))
  );
}

export async function initializeAdminUser(): Promise<void> {
  await appRuntime.runPromise(
    AuthService.use((auth) => auth.initializeAdminUser())
  );
}

// Teacher functions
export async function createTeacher(data: TeacherInput): Promise<Teacher> {
  return appRuntime.runPromise(
    TeacherRepo.use((repo) => repo.create(data))
  );
}

export async function findTeacherById(id: string): Promise<Teacher | null> {
  return appRuntime.runPromise(
    TeacherRepo.use((repo) => repo.findByIdOrNull(id))
  );
}

export async function findTeacherByEmail(email: string): Promise<TeacherRecord | null> {
  return appRuntime.runPromise(
    TeacherRepo.use((repo) => repo.findByEmail(email))
  );
}

export async function findAllTeachers(): Promise<Teacher[]> {
  return appRuntime.runPromise(
    TeacherRepo.use((repo) => repo.findAll())
  );
}

export async function updateTeacher(id: string, data: Partial<TeacherInput>): Promise<Teacher | null> {
  return appRuntime.runPromise(
    TeacherRepo.use((repo) => repo.update(id, data)).pipe(
      Effect.catchTag("NotFoundError", () => Effect.succeed(null))
    )
  );
}

export async function deleteTeacher(id: string): Promise<boolean> {
  return appRuntime.runPromise(
    TeacherRepo.use((repo) => repo.delete(id))
  );
}

// Student functions
export async function createStudent(data: StudentInput): Promise<Student> {
  return appRuntime.runPromise(
    StudentRepo.use((repo) => repo.create(data))
  );
}

export async function findStudentById(id: string): Promise<Student | null> {
  return appRuntime.runPromise(
    StudentRepo.use((repo) => repo.findByIdOrNull(id))
  );
}

export async function findStudentByEmail(email: string): Promise<StudentRecord | null> {
  return appRuntime.runPromise(
    StudentRepo.use((repo) => repo.findByEmail(email))
  );
}

export async function findAllStudents(): Promise<Student[]> {
  return appRuntime.runPromise(
    StudentRepo.use((repo) => repo.findAll())
  );
}

export async function updateStudent(id: string, data: Partial<StudentInput>): Promise<Student | null> {
  return appRuntime.runPromise(
    StudentRepo.use((repo) => repo.update(id, data)).pipe(
      Effect.catchTag("NotFoundError", () => Effect.succeed(null))
    )
  );
}

export async function deleteStudent(id: string): Promise<boolean> {
  return appRuntime.runPromise(
    StudentRepo.use((repo) => repo.delete(id))
  );
}

export async function findStudentsByClassId(classId: string): Promise<Student[]> {
  return appRuntime.runPromise(
    StudentRepo.use((repo) => repo.findByClassId(classId))
  );
}

// Class functions
export async function createClass(data: ClassInput): Promise<Class> {
  return appRuntime.runPromise(
    ClassRepo.use((repo) => repo.create(data))
  );
}

export async function findClassById(id: string): Promise<Class | null> {
  return appRuntime.runPromise(
    ClassRepo.use((repo) => repo.findByIdOrNull(id))
  );
}

export async function findAllClasses(): Promise<Class[]> {
  return appRuntime.runPromise(
    ClassRepo.use((repo) => repo.findAll())
  );
}

export async function findClassesByStudentId(studentId: string): Promise<Class[]> {
  return appRuntime.runPromise(
    ClassRepo.use((repo) => repo.findByStudentId(studentId))
  );
}

export async function updateClass(id: string, data: Partial<ClassInput>): Promise<Class | null> {
  return appRuntime.runPromise(
    ClassRepo.use((repo) => repo.update(id, data)).pipe(
      Effect.catchTag("NotFoundError", () => Effect.succeed(null))
    )
  );
}

export async function deleteClass(id: string): Promise<boolean> {
  return appRuntime.runPromise(
    ClassRepo.use((repo) => repo.delete(id))
  );
}

// Enrollment functions
export async function createEnrollment(data: EnrollmentInput): Promise<Enrollment> {
  return appRuntime.runPromise(
    EnrollmentRepo.use((repo) => repo.create(data))
  );
}

export async function findEnrollmentById(id: string): Promise<Enrollment | null> {
  return appRuntime.runPromise(
    EnrollmentRepo.use((repo) => repo.findByIdOrNull(id))
  );
}

export async function findAllEnrollments(): Promise<Enrollment[]> {
  return appRuntime.runPromise(
    EnrollmentRepo.use((repo) => repo.findAll())
  );
}

export async function findEnrollmentsByStudentId(studentId: string): Promise<Enrollment[]> {
  return appRuntime.runPromise(
    EnrollmentRepo.use((repo) => repo.findByStudentId(studentId))
  );
}

export async function updateEnrollment(id: string, data: Partial<EnrollmentInput>): Promise<Enrollment | null> {
  return appRuntime.runPromise(
    EnrollmentRepo.use((repo) => repo.update(id, data)).pipe(
      Effect.catchTag("NotFoundError", () => Effect.succeed(null))
    )
  );
}

export async function deleteEnrollment(id: string): Promise<boolean> {
  return appRuntime.runPromise(
    EnrollmentRepo.use((repo) => repo.delete(id))
  );
}

// Assignment functions
export async function createAssignment(data: AssignmentInput): Promise<Assignment> {
  return appRuntime.runPromise(
    AssignmentRepo.use((repo) => repo.create(data))
  );
}

export async function findAssignmentById(id: string): Promise<Assignment | null> {
  return appRuntime.runPromise(
    AssignmentRepo.use((repo) => repo.findByIdOrNull(id))
  );
}

export async function findAllAssignments(): Promise<Assignment[]> {
  return appRuntime.runPromise(
    AssignmentRepo.use((repo) => repo.findAll())
  );
}

export async function findAssignmentsByClassId(classId: string): Promise<Assignment[]> {
  return appRuntime.runPromise(
    AssignmentRepo.use((repo) => repo.findByClassId(classId))
  );
}

export async function updateAssignment(id: string, data: Partial<AssignmentInput>): Promise<Assignment | null> {
  return appRuntime.runPromise(
    AssignmentRepo.use((repo) => repo.update(id, data)).pipe(
      Effect.catchTag("NotFoundError", () => Effect.succeed(null))
    )
  );
}

export async function deleteAssignment(id: string): Promise<boolean> {
  return appRuntime.runPromise(
    AssignmentRepo.use((repo) => repo.delete(id))
  );
}

// Submission functions
export async function createSubmission(data: SubmissionInput): Promise<Submission> {
  return appRuntime.runPromise(
    SubmissionRepo.use((repo) => repo.create(data))
  );
}

export async function findSubmissionById(id: string): Promise<Submission | null> {
  return appRuntime.runPromise(
    SubmissionRepo.use((repo) => repo.findByIdOrNull(id))
  );
}

export async function findAllSubmissions(): Promise<Submission[]> {
  return appRuntime.runPromise(
    SubmissionRepo.use((repo) => repo.findAll())
  );
}

export async function findSubmissionsByStudentId(studentId: string): Promise<Submission[]> {
  return appRuntime.runPromise(
    SubmissionRepo.use((repo) => repo.findByStudentId(studentId))
  );
}

export async function updateSubmission(id: string, data: Partial<SubmissionInput>): Promise<Submission | null> {
  return appRuntime.runPromise(
    SubmissionRepo.use((repo) => repo.update(id, data)).pipe(
      Effect.catchTag("NotFoundError", () => Effect.succeed(null))
    )
  );
}

export async function deleteSubmission(id: string): Promise<boolean> {
  return appRuntime.runPromise(
    SubmissionRepo.use((repo) => repo.delete(id))
  );
}

// Grade functions
export async function createGrade(data: GradeInput): Promise<Grade> {
  return appRuntime.runPromise(
    GradeRepo.use((repo) => repo.create(data))
  );
}

export async function findGradeById(id: string): Promise<Grade | null> {
  return appRuntime.runPromise(
    GradeRepo.use((repo) => repo.findByIdOrNull(id))
  );
}

export async function findAllGrades(): Promise<Grade[]> {
  return appRuntime.runPromise(
    GradeRepo.use((repo) => repo.findAll())
  );
}

export async function findGradesByStudentId(studentId: string): Promise<Grade[]> {
  return appRuntime.runPromise(
    GradeRepo.use((repo) => repo.findByStudentId(studentId))
  );
}

export async function updateGrade(id: string, data: Partial<GradeInput>): Promise<Grade | null> {
  return appRuntime.runPromise(
    GradeRepo.use((repo) => repo.update(id, data)).pipe(
      Effect.catchTag("NotFoundError", () => Effect.succeed(null))
    )
  );
}

export async function deleteGrade(id: string): Promise<boolean> {
  return appRuntime.runPromise(
    GradeRepo.use((repo) => repo.delete(id))
  );
}

// Attendance functions
export async function createAttendance(data: AttendanceInput): Promise<Attendance> {
  return appRuntime.runPromise(
    AttendanceRepo.use((repo) => repo.create(data))
  );
}

export async function findAttendanceById(id: string): Promise<Attendance | null> {
  return appRuntime.runPromise(
    AttendanceRepo.use((repo) => repo.findByIdOrNull(id))
  );
}

export async function findAllAttendances(): Promise<Attendance[]> {
  return appRuntime.runPromise(
    AttendanceRepo.use((repo) => repo.findAll())
  );
}

export async function findAttendancesByStudentId(studentId: string): Promise<Attendance[]> {
  return appRuntime.runPromise(
    AttendanceRepo.use((repo) => repo.findByStudentId(studentId))
  );
}

export async function updateAttendance(id: string, data: Partial<AttendanceInput>): Promise<Attendance | null> {
  return appRuntime.runPromise(
    AttendanceRepo.use((repo) => repo.update(id, data)).pipe(
      Effect.catchTag("NotFoundError", () => Effect.succeed(null))
    )
  );
}

export async function deleteAttendance(id: string): Promise<boolean> {
  return appRuntime.runPromise(
    AttendanceRepo.use((repo) => repo.delete(id))
  );
}

// Announcement functions
export async function createAnnouncement(data: AnnouncementInput): Promise<Announcement> {
  return appRuntime.runPromise(
    AnnouncementRepo.use((repo) => repo.create(data))
  );
}

export async function findAnnouncementById(id: string): Promise<Announcement | null> {
  return appRuntime.runPromise(
    AnnouncementRepo.use((repo) => repo.findByIdOrNull(id))
  );
}

export async function findAllAnnouncements(): Promise<Announcement[]> {
  return appRuntime.runPromise(
    AnnouncementRepo.use((repo) => repo.findAll())
  );
}

export async function updateAnnouncement(id: string, data: Partial<AnnouncementInput>): Promise<Announcement | null> {
  return appRuntime.runPromise(
    AnnouncementRepo.use((repo) => repo.update(id, data)).pipe(
      Effect.catchTag("NotFoundError", () => Effect.succeed(null))
    )
  );
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  return appRuntime.runPromise(
    AnnouncementRepo.use((repo) => repo.delete(id))
  );
}

// Refresh token functions
export async function storeRefreshToken(data: RefreshTokenInput): Promise<RefreshToken> {
  return appRuntime.runPromise(
    AuthRepo.use((repo) => repo.storeRefreshToken(data))
  );
}

export async function findRefreshTokenById(id: string): Promise<RefreshToken | null> {
  return appRuntime.runPromise(
    AuthRepo.use((repo) => repo.findRefreshTokenByIdOrNull(id))
  );
}

export async function revokeRefreshToken(id: string): Promise<RefreshToken | null> {
  return appRuntime.runPromise(
    AuthRepo.use((repo) => repo.revokeRefreshToken(id))
  );
}
