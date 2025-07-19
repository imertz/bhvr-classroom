import { Database } from "bun:sqlite";
import { randomUUIDv7 as randomUUID } from "bun"
import fs from "fs";
import path from "path";
import type { Teacher, TeacherInput } from "shared/src/types/teacher";
import type { Student, StudentInput } from "shared/src/types/student";
import type { Class, ClassInput } from "shared/src/types/class";
import type { Enrollment, EnrollmentInput } from "shared/src/types/enrollment";
import type { Assignment, AssignmentInput } from "shared/src/types/assignment";
import type { Submission, SubmissionInput } from "shared/src/types/submission";
import type { Grade, GradeInput } from "shared/src/types/grade";
import type { Attendance, AttendanceInput } from "shared/src/types/attendance";
import type { Announcement, AnnouncementInput } from "shared/src/types/announcement";

export interface RefreshToken {
  id: string;
  user_id: string;
  user_type: 'teacher' | 'student';
  token_hash: string;
  expires_at: string;
  created_at: string;
  revoked_at?: string | null;
}

export interface RefreshTokenInput {
  id: string;
  user_id: string;
  user_type: 'teacher' | 'student';
  token_hash: string;
  expires_at: string;
}

const DB_PATH = path.join(__dirname, "classroom.sqlite");
let db: Database;

/**
 * Initializes the database by creating it if it doesn't exist and applying the schema.
 * @throws When it fails to initialize the database.
 */
export function initializeDatabase() {
  try {
    const dbExists = fs.existsSync(DB_PATH);
    db = new Database(DB_PATH, { create: true });

    if (!dbExists) {
      console.log("Creating database...");
      const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
      db.exec(schema);
      console.log("Database created successfully.");
    } else {
      console.log("Database already exists.");
      // Run migrations for existing database
      runMigrations();
    }
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

function runMigrations() {
  try {
    console.log("Running database migrations...");
    
    // Check if role column exists in teachers table
    const teachersInfo = db.prepare("PRAGMA table_info(teachers)").all() as any[];
    const hasRoleColumn = teachersInfo.some((col: any) => col.name === 'role');
    
    if (!hasRoleColumn) {
      console.log("Adding role column to teachers table...");
      db.exec("ALTER TABLE teachers ADD COLUMN role TEXT DEFAULT 'teacher' CHECK (role IN ('teacher', 'admin'))");
      db.exec("CREATE INDEX IF NOT EXISTS idx_teachers_role ON teachers(role)");
      console.log("Role column added successfully.");
    }
    
    // Check if role column exists in students table
    const studentsInfo = db.prepare("PRAGMA table_info(students)").all() as any[];
    const hasStudentRoleColumn = studentsInfo.some((col: any) => col.name === 'role');
    
    if (!hasStudentRoleColumn) {
      console.log("Adding role column to students table...");
      db.exec("ALTER TABLE students ADD COLUMN role TEXT DEFAULT 'student' CHECK (role IN ('student'))");
      console.log("Role column added to students table.");
    }
    
    console.log("Migrations completed successfully.");
  } catch (error) {
    console.error("Failed to run migrations:", error);
    throw error;
  }
}

// Teacher functions
/**
 * Creates a new teacher in the database.
 * @param data - The teacher data to create.
 * @returns The created teacher.
 * @throws When it fails to create the teacher.
 */
export async function createTeacher(data: TeacherInput): Promise<Teacher> {
  const now = new Date().toISOString();
  const id = randomUUID();
  if (!data.password) throw new Error("Password is required");
  const hashedPassword = await Bun.password.hash(data.password);
  const role = (data as any).role || 'teacher'; // Default to teacher if not specified

  const query = db.query(
    "INSERT INTO teachers (id, email, password_hash, first_name, last_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
  );
  return query.get(id, data.email, hashedPassword, data.first_name, data.last_name, role, now, now) as Teacher;
}

/**
 * Finds a teacher by their ID.
 * @param id - The ID of the teacher to find.
 * @returns The teacher if found, otherwise null.
 */
export async function findTeacherById(id: string): Promise<Teacher | null> {
  const query = db.query("SELECT * FROM teachers WHERE id = ?");
  return query.get(id) as Teacher | null;
}

/**
 * Finds a teacher by their email.
 * @param email - The email of the teacher to find.
 * @returns The teacher if found, otherwise null.
 */
export async function findTeacherByEmail(email: string): Promise<Teacher | null> {
  const query = db.query("SELECT * FROM teachers WHERE email = ?");
  return query.get(email) as Teacher | null;
}

/**
 * Finds all teachers in the database.
 * @returns A list of all teachers.
 */
export async function findAllTeachers(): Promise<Teacher[]> {
  const query = db.query("SELECT * FROM teachers");
  return query.all() as Teacher[];
}

/**
 * Updates a teacher's information.
 * @param id - The ID of the teacher to update.
 * @param data - The data to update.
 * @returns The updated teacher, or null if not found.
 */
export async function updateTeacher(id: string, data: Partial<TeacherInput>): Promise<Teacher | null> {
  const now = new Date().toISOString();
  let updateQuery = "UPDATE teachers SET updated_at = ?";
  const params: any[] = [now];

  for (const [key, value] of Object.entries(data)) {
    if (key === 'password' && value) {
      const hashedPassword = await Bun.password.hash(value);
      updateQuery += `, password_hash = ?`;
      params.push(hashedPassword);
    } else if (value !== undefined) {
      updateQuery += `, ${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`;
      params.push(value);
    }
  }

  updateQuery += " WHERE id = ? RETURNING *";
  params.push(id);

  const query = db.query(updateQuery);
  return query.get(...params) as Teacher | null;
}

/**
 * Deletes a teacher from the database.
 * @param id - The ID of the teacher to delete.
 * @returns True if the teacher was deleted, otherwise false.
 */
export async function deleteTeacher(id: string): Promise<boolean> {
  const query = db.query("DELETE FROM teachers WHERE id = ?");
  const result = query.run(id);
  return result.changes > 0;
}

// Student functions
/**
 * Creates a new student in the database.
 * @param data - The student data to create.
 * @returns The created student.
 * @throws When it fails to create the student.
 */
export async function createStudent(data: StudentInput): Promise<Student> {
  const now = new Date().toISOString();
  const id = randomUUID();
  const query = db.query(
    "INSERT INTO students (id, email, first_name, last_name, date_of_birth, grade_level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
  );
  return query.get(id, data.email, data.first_name, data.last_name, data.date_of_birth, data.grade_level, now, now) as Student;
}

/**
 * Finds a student by their ID.
 * @param id - The ID of the student to find.
 * @returns The student if found, otherwise null.
 */
export async function findStudentById(id: string): Promise<Student | null> {
  const query = db.query("SELECT * FROM students WHERE id = ?");
  return query.get(id) as Student | null;
}

/**
 * Finds a student by their email.
 * @param email - The email of the student to find.
 * @returns The student if found, otherwise null.
 */
export async function findStudentByEmail(email: string): Promise<Student | null> {
  const query = db.query("SELECT * FROM students WHERE email = ?");
  return query.get(email) as Student | null;
}

/**
 * Finds all students in the database.
 * @returns A list of all students.
 */
export async function findAllStudents(): Promise<Student[]> {
  const query = db.query("SELECT * FROM students");
  return query.all() as Student[];
}

/**
 * Updates a student's information.
 * @param id - The ID of the student to update.
 * @param data - The data to update.
 * @returns The updated student, or null if not found.
 */
export async function updateStudent(id: string, data: Partial<StudentInput>): Promise<Student | null> {
  const now = new Date().toISOString();
  let updateQuery = "UPDATE students SET updated_at = ?";
  const params: any[] = [now];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateQuery += `, ${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`;
      params.push(value);
    }
  }

  updateQuery += " WHERE id = ? RETURNING *";
  params.push(id);

  const query = db.query(updateQuery);
  return query.get(...params) as Student | null;
}

/**
 * Deletes a student from the database.
 * @param id - The ID of the student to delete.
 * @returns True if the student was deleted, otherwise false.
 */
export async function deleteStudent(id: string): Promise<boolean> {
  const query = db.query("DELETE FROM students WHERE id = ?");
  const result = query.run(id);
  return result.changes > 0;
}

/**
 * Finds all students enrolled in a specific class.
 * @param classId - The ID of the class.
 * @returns A list of students in the class.
 */
export async function findStudentsByClassId(classId: string): Promise<Student[]> {
  const query = db.query(`
        SELECT s.* FROM students s
        JOIN enrollments e ON s.id = e.student_id
        WHERE e.class_id = ?
    `);
  return query.all(classId) as Student[];
}

// Class functions
/**
 * Creates a new class in the database.
 * @param data - The class data to create.
 * @returns The created class.
 * @throws When it fails to create the class.
 */
export async function createClass(data: ClassInput): Promise<Class> {
  const now = new Date().toISOString();
  const id = randomUUID();
  const query = db.query(
    "INSERT INTO classes (id, name, subject, teacher_id, room_number, schedule, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
  );
  return query.get(
    id,
    data.name,
    data.subject,
    data.teacher_id,
    data.room_number ?? null,
    data.schedule ?? null,
    now,
    now
  ) as Class;
}

/**
 * Finds a class by its ID.
 * @param id - The ID of the class to find.
 * @returns The class if found, otherwise null.
 */
export async function findClassById(id: string): Promise<Class | null> {
  const query = db.query("SELECT * FROM classes WHERE id = ?");
  return query.get(id) as Class | null;
}

/**
 * Finds all classes in the database.
 * @returns A list of all classes.
 */
export async function findAllClasses(): Promise<Class[]> {
  const query = db.query("SELECT * FROM classes");
  return query.all() as Class[];
}

/**
 * Updates a class's information.
 * @param id - The ID of the class to update.
 * @param data - The data to update.
 * @returns The updated class, or null if not found.
 */
export async function updateClass(id: string, data: Partial<ClassInput>): Promise<Class | null> {
  const now = new Date().toISOString();
  let updateQuery = "UPDATE classes SET updated_at = ?";
  const params: any[] = [now];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateQuery += `, ${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`;
      params.push(value);
    }
  }

  updateQuery += " WHERE id = ? RETURNING *";
  params.push(id);

  const query = db.query(updateQuery);
  return query.get(...params) as Class | null;
}

/**
 * Deletes a class from the database.
 * @param id - The ID of the class to delete.
 * @returns True if the class was deleted, otherwise false.
 */
export async function deleteClass(id: string): Promise<boolean> {
  const query = db.query("DELETE FROM classes WHERE id = ?");
  const result = query.run(id);
  return result.changes > 0;
}

// Enrollment functions
/**
 * Creates a new enrollment in the database.
 * @param data - The enrollment data to create.
 * @returns The created enrollment.
 * @throws When it fails to create the enrollment.
 */
export async function createEnrollment(data: EnrollmentInput): Promise<Enrollment> {
  const now = new Date().toISOString();
  const id = randomUUID();
  const query = db.query(
    "INSERT INTO enrollments (id, student_id, class_id, enrolled_at, status) VALUES (?, ?, ?, ?, ?) RETURNING *"
  );
  return query.get(id, data.student_id, data.class_id, now, data.status || 'active') as Enrollment;
}

/**
 * Finds an enrollment by its ID.
 * @param id - The ID of the enrollment to find.
 * @returns The enrollment if found, otherwise null.
 */
export async function findEnrollmentById(id: string): Promise<Enrollment | null> {
  const query = db.query("SELECT * FROM enrollments WHERE id = ?");
  return query.get(id) as Enrollment | null;
}

/**
 * Finds all enrollments in the database.
 * @returns A list of all enrollments.
 */
export async function findAllEnrollments(): Promise<Enrollment[]> {
  const query = db.query("SELECT * FROM enrollments");
  return query.all() as Enrollment[];
}

/**
 * Updates an enrollment's information.
 * @param id - The ID of the enrollment to update.
 * @param data - The data to update.
 * @returns The updated enrollment, or null if not found.
 */
export async function updateEnrollment(id: string, data: Partial<EnrollmentInput>): Promise<Enrollment | null> {
  let updateQuery = "UPDATE enrollments SET";
  const params: any[] = [];
  const updates: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`);
      params.push(value);
    }
  }

  if (updates.length === 0) {
    return findEnrollmentById(id);
  }

  updateQuery += ` ${updates.join(', ')} WHERE id = ? RETURNING *`;
  params.push(id);

  const query = db.query(updateQuery);
  return query.get(...params) as Enrollment | null;
}

/**
 * Deletes an enrollment from the database.
 * @param id - The ID of the enrollment to delete.
 * @returns True if the enrollment was deleted, otherwise false.
 */
export async function deleteEnrollment(id: string): Promise<boolean> {
  const query = db.query("DELETE FROM enrollments WHERE id = ?");
  const result = query.run(id);
  return result.changes > 0;
}

// Assignment functions
/**
 * Creates a new assignment in the database.
 * @param data - The assignment data to create.
 * @returns The created assignment.
 * @throws When it fails to create the assignment.
 */
export async function createAssignment(data: AssignmentInput): Promise<Assignment> {
  const now = new Date().toISOString();
  const id = randomUUID();
  // Ensure due_date is stored as full ISO string, adding seconds if missing
  let dueDateIso = data.due_date;
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dueDateIso)) {
    dueDateIso = dueDateIso + ':00';
  }
  const query = db.query(
    "INSERT INTO assignments (id, class_id, title, description, type, points_possible, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
  );
  return query.get(id, data.class_id, data.title, data.description, data.type, data.points_possible, dueDateIso, now, now) as Assignment;
}

/**
 * Finds an assignment by its ID.
 * @param id - The ID of the assignment to find.
 * @returns The assignment if found, otherwise null.
 */
export async function findAssignmentById(id: string): Promise<Assignment | null> {
  const query = db.query("SELECT * FROM assignments WHERE id = ?");
  return query.get(id) as Assignment | null;
}

/**
 * Finds all assignments in the database.
 * @returns A list of all assignments.
 */
export async function findAllAssignments(): Promise<Assignment[]> {
  const query = db.query("SELECT * FROM assignments");
  return query.all() as Assignment[];
}

/**
 * Updates an assignment's information.
 * @param id - The ID of the assignment to update.
 * @param data - The data to update.
 * @returns The updated assignment, or null if not found.
 */
export async function updateAssignment(id: string, data: Partial<AssignmentInput>): Promise<Assignment | null> {
  const now = new Date().toISOString();
  let updateQuery = "UPDATE assignments SET updated_at = ?";
  const params: any[] = [now];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (key === 'due_date' && typeof value === 'string') {
        // Normalize due_date to include seconds
        let dueDateIso = value;
        if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dueDateIso)) {
          dueDateIso += ':00';
        }
        updateQuery += `, due_date = ?`;
        params.push(dueDateIso);
      } else {
        updateQuery += `, ${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`;
        params.push(value);
      }
    }
  }

  updateQuery += " WHERE id = ? RETURNING *";
  params.push(id);

  const query = db.query(updateQuery);
  return query.get(...params) as Assignment | null;
}

/**
 * Deletes an assignment from the database.
 * @param id - The ID of the assignment to delete.
 * @returns True if the assignment was deleted, otherwise false.
 */
export async function deleteAssignment(id: string): Promise<boolean> {
  const query = db.query("DELETE FROM assignments WHERE id = ?");
  const result = query.run(id);
  return result.changes > 0;
}

/**
 * Finds all assignments for a specific class.
 * @param classId - The ID of the class.
 * @returns A list of assignments for the class.
 */
export async function findAssignmentsByClassId(classId: string): Promise<Assignment[]> {
  const query = db.query("SELECT * FROM assignments WHERE class_id = ?");
  return query.all(classId) as Assignment[];
}

// Submission functions
/**
 * Creates a new submission in the database.
 * @param data - The submission data to create.
 * @returns The created submission.
 * @throws When it fails to create the submission.
 */
export async function createSubmission(data: SubmissionInput): Promise<Submission> {
  const now = new Date().toISOString();
  const id = randomUUID();
  const query = db.query(
    "INSERT INTO submissions (id, assignment_id, student_id, submitted_at, content, status) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
  );
  return query.get(
    id,
    data.assignment_id,
    data.student_id,
    now,
    data.content ?? null,
    data.status || 'submitted'
  ) as Submission;
}

/**
 * Finds a submission by its ID.
 * @param id - The ID of the submission to find.
 * @returns The submission if found, otherwise null.
 */
export async function findSubmissionById(id: string): Promise<Submission | null> {
  const query = db.query("SELECT * FROM submissions WHERE id = ?");
  return query.get(id) as Submission | null;
}

/**
 * Finds all submissions in the database.
 * @returns A list of all submissions.
 */
export async function findAllSubmissions(): Promise<Submission[]> {
  const query = db.query("SELECT * FROM submissions");
  return query.all() as Submission[];
}

/**
 * Updates a submission's information.
 * @param id - The ID of the submission to update.
 * @param data - The data to update.
 * @returns The updated submission, or null if not found.
 */
export async function updateSubmission(id: string, data: Partial<SubmissionInput>): Promise<Submission | null> {
  let updateQuery = "UPDATE submissions SET";
  const params: any[] = [];
  const updates: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`);
      params.push(value);
    }
  }

  if (updates.length === 0) {
    return findSubmissionById(id);
  }

  updateQuery += ` ${updates.join(', ')} WHERE id = ? RETURNING *`;
  params.push(id);

  const query = db.query(updateQuery);
  return query.get(...params) as Submission | null;
}

/**
 * Deletes a submission from the database.
 * @param id - The ID of the submission to delete.
 * @returns True if the submission was deleted, otherwise false.
 */
export async function deleteSubmission(id: string): Promise<boolean> {
  const query = db.query("DELETE FROM submissions WHERE id = ?");
  const result = query.run(id);
  return result.changes > 0;
}

// Grade functions
/**
 * Creates a new grade in the database.
 * @param data - The grade data to create.
 * @returns The created grade.
 * @throws When it fails to create the grade.
 */
export async function createGrade(data: GradeInput): Promise<Grade> {
  const now = new Date().toISOString();
  const id = randomUUID();
  const query = db.query(
    "INSERT INTO grades (id, submission_id, points_earned, feedback, graded_at, graded_by) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
  );
  return query.get(
    id,
    data.submission_id,
    data.points_earned,
    data.feedback ?? null,
    now,
    data.graded_by
  ) as Grade;
}

/**
 * Finds a grade by its ID.
 * @param id - The ID of the grade to find.
 * @returns The grade if found, otherwise null.
 */
export async function findGradeById(id: string): Promise<Grade | null> {
  const query = db.query("SELECT * FROM grades WHERE id = ?");
  return query.get(id) as Grade | null;
}

/**
 * Finds all grades in the database.
 * @returns A list of all grades.
 */
export async function findAllGrades(): Promise<Grade[]> {
  const query = db.query("SELECT * FROM grades");
  return query.all() as Grade[];
}

/**
 * Updates a grade's information.
 * @param id - The ID of the grade to update.
 * @param data - The data to update.
 * @returns The updated grade, or null if not found.
 */
export async function updateGrade(id: string, data: Partial<GradeInput>): Promise<Grade | null> {
  const now = new Date().toISOString();
  let updateQuery = "UPDATE grades SET graded_at = ?";
  const params: any[] = [now];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateQuery += `, ${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`;
      params.push(value);
    }
  }

  updateQuery += " WHERE id = ? RETURNING *";
  params.push(id);

  const query = db.query(updateQuery);
  return query.get(...params) as Grade | null;
}

/**
 * Deletes a grade from the database.
 * @param id - The ID of the grade to delete.
 * @returns True if the grade was deleted, otherwise false.
 */
export async function deleteGrade(id: string): Promise<boolean> {
  const query = db.query("DELETE FROM grades WHERE id = ?");
  const result = query.run(id);
  return result.changes > 0;
}

// Attendance functions
/**
 * Creates a new attendance record in the database.
 * @param data - The attendance data to create.
 * @returns The created attendance record.
 * @throws When it fails to create the attendance record.
 */
export async function createAttendance(data: AttendanceInput): Promise<Attendance> {
  const now = new Date().toISOString();
  const id = randomUUID();
  const query = db.query(
    "INSERT INTO attendance (id, student_id, class_id, date, status, notes, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *"
  );
  return query.get(
    id,
    data.student_id,
    data.class_id,
    data.date,
    data.status,
    data.notes ?? null,
    now
  ) as Attendance;
}

/**
 * Finds an attendance record by its ID.
 * @param id - The ID of the attendance record to find.
 * @returns The attendance record if found, otherwise null.
 */
export async function findAttendanceById(id: string): Promise<Attendance | null> {
  const query = db.query("SELECT * FROM attendance WHERE id = ?");
  return query.get(id) as Attendance | null;
}

/**
 * Finds all attendance records in the database.
 * @returns A list of all attendance records.
 */
export async function findAllAttendances(): Promise<Attendance[]> {
  const query = db.query("SELECT * FROM attendance");
  return query.all() as Attendance[];
}

/**
 * Updates an attendance record's information.
 * @param id - The ID of the attendance record to update.
 * @param data - The data to update.
 * @returns The updated attendance record, or null if not found.
 */
export async function updateAttendance(id: string, data: Partial<AttendanceInput>): Promise<Attendance | null> {
  const now = new Date().toISOString();
  let updateQuery = "UPDATE attendance SET recorded_at = ?";
  const params: any[] = [now];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateQuery += `, ${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`;
      params.push(value);
    }
  }

  updateQuery += " WHERE id = ? RETURNING *";
  params.push(id);

  const query = db.query(updateQuery);
  return query.get(...params) as Attendance | null;
}

/**
 * Deletes an attendance record from the database.
 * @param id - The ID of the attendance record to delete.
 * @returns True if the attendance record was deleted, otherwise false.
 */
export async function deleteAttendance(id: string): Promise<boolean> {
  const query = db.query("DELETE FROM attendance WHERE id = ?");
  const result = query.run(id);
  return result.changes > 0;
}

// Announcement functions
/**
 * Creates a new announcement in the database.
 * @param data - The announcement data to create.
 * @returns The created announcement.
 * @throws When it fails to create the announcement.
 */
export async function createAnnouncement(data: AnnouncementInput): Promise<Announcement> {
  const now = new Date().toISOString();
  const id = randomUUID();
  // Normalize expires_at to include seconds if provided, otherwise allow null
  let expiresIso = null;
  if (data.expires_at) {
    expiresIso = data.expires_at;
    if (typeof expiresIso === 'string' && !/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(expiresIso)) {
      expiresIso = expiresIso + ':00';
    }
  }
  const query = db.query(
    "INSERT INTO announcements (id, class_id, teacher_id, title, content, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *"
  );
  return query.get(
    id,
    data.class_id,
    data.teacher_id,
    data.title,
    data.content,
    now,
    expiresIso
  ) as Announcement;
}

/**
 * Finds an announcement by its ID.
 * @param id - The ID of the announcement to find.
 * @returns The announcement if found, otherwise null.
 */
export async function findAnnouncementById(id: string): Promise<Announcement | null> {
  const query = db.query("SELECT * FROM announcements WHERE id = ?");
  return query.get(id) as Announcement | null;
}

/**
 * Finds all announcements in the database.
 * @returns A list of all announcements.
 */
export async function findAllAnnouncements(): Promise<Announcement[]> {
  const query = db.query("SELECT * FROM announcements");
  return query.all() as Announcement[];
}

/**
 * Updates an announcement's information.
 * @param id - The ID of the announcement to update.
 * @param data - The data to update.
 * @returns The updated announcement, or null if not found.
 */
export async function updateAnnouncement(id: string, data: Partial<AnnouncementInput>): Promise<Announcement | null> {
  const now = new Date().toISOString();
  let updateQuery = "UPDATE announcements SET created_at = ?"; // This seems wrong, should be updated_at if we add it
  const params: any[] = [now];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (key === 'expires_at') {
        // Normalize expires_at to include seconds if provided, otherwise allow null
        if (value) {
          let expiresIso = value as string;
          if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(expiresIso)) {
            expiresIso = expiresIso + ':00';
          }
          updateQuery += `, expires_at = ?`;
          params.push(expiresIso);
        } else {
          updateQuery += `, expires_at = ?`;
          params.push(null);
        }
      } else {
        updateQuery += `, ${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`;
        params.push(value);
      }
    }
  }

  updateQuery += " WHERE id = ? RETURNING *";
  params.push(id);

  const query = db.query(updateQuery);
  return query.get(...params) as Announcement | null;
}

/**
 * Deletes an announcement from the database.
 * @param id - The ID of the announcement to delete.
 * @returns True if the announcement was deleted, otherwise false.
 */
export async function deleteAnnouncement(id: string): Promise<boolean> {
  const query = db.query("DELETE FROM announcements WHERE id = ?");
  const result = query.run(id);
  return result.changes > 0;
}

// Refresh Token functions
/**
 * Stores a new refresh token in the database.
 * @param data - The refresh token data to store.
 * @returns The created refresh token.
 */
export async function storeRefreshToken(data: RefreshTokenInput): Promise<RefreshToken> {
  const now = new Date().toISOString();
  const query = db.query(
    "INSERT INTO refresh_tokens (id, user_id, user_type, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
  );
  return query.get(data.id, data.user_id, data.user_type, data.token_hash, data.expires_at, now) as RefreshToken;
}

/**
 * Finds a refresh token by its ID.
 * @param id - The ID of the refresh token to find.
 * @returns The refresh token if found, otherwise null.
 */
export async function findRefreshTokenById(id: string): Promise<RefreshToken | null> {
  const query = db.query("SELECT * FROM refresh_tokens WHERE id = ?");
  return query.get(id) as RefreshToken | null;
}

/**
 * Revokes a refresh token by its ID.
 * @param id - The ID of the refresh token to revoke.
 * @returns The updated refresh token, or null if not found.
 */
export async function revokeRefreshToken(id: string): Promise<RefreshToken | null> {
  const now = new Date().toISOString();
  const query = db.query("UPDATE refresh_tokens SET revoked_at = ? WHERE id = ? RETURNING *");
  return query.get(now, id) as RefreshToken | null;
}

/**
 * Initializes the admin user if it doesn't exist.
 * Creates a hardcoded admin user with credentials from environment variables.
 */
export async function initializeAdminUser(): Promise<void> {
  try {
    const { AUTH_CONFIG } = await import('../config/auth');
    const adminEmail = AUTH_CONFIG.ADMIN_EMAIL;
    const adminPassword = AUTH_CONFIG.ADMIN_PASSWORD || generateSecurePassword();
    
    // Check if admin already exists
    const existingAdmin = await findTeacherByEmail(adminEmail);
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Create admin user
    const adminUser = await createTeacher({
      email: adminEmail,
      password: adminPassword,
      first_name: "Admin",
      last_name: "User",
      role: "admin"
    } as any);

    console.log("Admin user created successfully:");
    console.log(`Email: ${adminEmail}`);
    if (!AUTH_CONFIG.ADMIN_PASSWORD) {
      console.log(`Password: ${adminPassword}`);
      console.log("⚠️  Please save this password - it will not be shown again!");
      console.log("⚠️  Set ADMIN_PASSWORD environment variable for production");
    }
  } catch (error) {
    console.error("Failed to initialize admin user:", error);
    throw error;
  }
}

/**
 * Generates a secure random password.
 */
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
