import { Context, Effect, Layer } from "effect";
import { randomUUIDv7 as randomUUID } from "bun";
import type {
  Class,
  ClassInput,
  ClassDetails,
  ClassEnrollmentDetail,
  ClassAttendanceDetail,
  ClassStats,
  ClassTeacherSummary,
  Assignment,
  Announcement,
} from "shared/dist";
import { DatabaseError, NotFoundError } from "shared/dist";
import { SqliteClient } from "./SqliteClient";

export class ClassRepo extends Context.Service<ClassRepo, {
  readonly findAll: () => Effect.Effect<Class[], DatabaseError>;
  readonly findById: (id: string) => Effect.Effect<Class, NotFoundError | DatabaseError>;
  readonly findByIdOrNull: (id: string) => Effect.Effect<Class | null, DatabaseError>;
  readonly findByStudentId: (studentId: string) => Effect.Effect<Class[], DatabaseError>;
  readonly getDetails: (id: string) => Effect.Effect<ClassDetails, NotFoundError | DatabaseError>;
  readonly create: (input: ClassInput) => Effect.Effect<Class, DatabaseError>;
  readonly update: (id: string, input: Partial<ClassInput>) => Effect.Effect<Class, NotFoundError | DatabaseError>;
  readonly delete: (id: string) => Effect.Effect<boolean, DatabaseError>;
}>()("server/ClassRepo") {
  static readonly layer = Layer.effect(
    ClassRepo,
    Effect.gen(function*() {
      const sqlite = yield* SqliteClient;

      const findAll = Effect.fn("ClassRepo.findAll")(function*() {
        return yield* sqlite.queryAll<Class>("SELECT * FROM classes ORDER BY name ASC");
      });

      const findByIdOrNull = Effect.fn("ClassRepo.findByIdOrNull")(function*(id: string) {
        return yield* sqlite.queryOne<Class>("SELECT * FROM classes WHERE id = ?", [id]);
      });

      const findById = Effect.fn("ClassRepo.findById")(function*(id: string) {
        const cls = yield* findByIdOrNull(id);
        if (!cls) {
          return yield* new NotFoundError({ message: `Class with id ${id} not found`, entity: "Class", id });
        }
        return cls;
      });

      const findByStudentId = Effect.fn("ClassRepo.findByStudentId")(function*(studentId: string) {
        return yield* sqlite.queryAll<Class>(
          `SELECT c.* FROM classes c
           INNER JOIN enrollments e ON c.id = e.class_id
           WHERE e.student_id = ? AND e.status = 'active'
           ORDER BY c.name ASC`,
          [studentId]
        );
      });

      const getDetails = Effect.fn("ClassRepo.getDetails")(function*(id: string) {
        const cls = yield* findById(id);

        const teacher = yield* sqlite.queryOne<ClassTeacherSummary>(
          "SELECT id, first_name, last_name, email, role FROM teachers WHERE id = ?",
          [cls.teacher_id]
        );

        type RawEnrollmentRow = {
          id: string;
          student_id: string;
          class_id: string;
          enrolled_at: string;
          status: "active" | "dropped" | "completed";
          first_name: string;
          last_name: string;
          email: string;
          grade_level: number;
        };

        const rawEnrollments = yield* sqlite.queryAll<RawEnrollmentRow>(
          `SELECT e.id, e.student_id, e.class_id, e.enrolled_at, e.status,
                  s.first_name, s.last_name, s.email, s.grade_level
           FROM enrollments e
           INNER JOIN students s ON e.student_id = s.id
           WHERE e.class_id = ?
           ORDER BY s.last_name ASC, s.first_name ASC`,
          [id]
        );

        const enrollments: ClassEnrollmentDetail[] = rawEnrollments.map((row) => ({
          id: row.id,
          student_id: row.student_id,
          class_id: row.class_id,
          enrolled_at: row.enrolled_at,
          status: row.status,
          student: {
            id: row.student_id,
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            grade_level: row.grade_level,
          },
        }));

        const assignments = yield* sqlite.queryAll<Assignment>(
          "SELECT * FROM assignments WHERE class_id = ? ORDER BY due_date ASC",
          [id]
        );

        const announcements = yield* sqlite.queryAll<Announcement>(
          "SELECT * FROM announcements WHERE class_id = ? ORDER BY created_at DESC",
          [id]
        );

        type RawAttendanceRow = {
          id: string;
          student_id: string;
          class_id: string;
          date: string;
          status: "present" | "absent" | "tardy" | "excused";
          notes: string | null;
          recorded_at: string;
          student_name: string;
        };

        const rawAttendance = yield* sqlite.queryAll<RawAttendanceRow>(
          `SELECT a.id, a.student_id, a.class_id, a.date, a.status, a.notes, a.recorded_at,
                  (s.first_name || ' ' || s.last_name) AS student_name
           FROM attendance a
           INNER JOIN students s ON a.student_id = s.id
           WHERE a.class_id = ?
           ORDER BY a.date DESC, a.recorded_at DESC
           LIMIT 50`,
          [id]
        );

        const recentAttendance: ClassAttendanceDetail[] = rawAttendance.map((row) => ({
          id: row.id,
          student_id: row.student_id,
          student_name: row.student_name,
          class_id: row.class_id,
          date: row.date,
          status: row.status,
          notes: row.notes,
          recorded_at: row.recorded_at,
        }));

        const totalEnrollments = enrollments.length;
        const activeEnrollments = enrollments.filter((e) => e.status === "active").length;
        const totalAssignments = assignments.length;
        const totalAnnouncements = announcements.length;

        let attendanceRate: number | null = null;
        const statsRow = yield* sqlite.queryOne<{ attended: number; total: number }>(
          `SELECT 
             COUNT(CASE WHEN status = 'present' THEN 1 END) AS attended,
             COUNT(CASE WHEN status != 'excused' THEN 1 END) AS total
           FROM attendance WHERE class_id = ?`,
          [id]
        );
        if (statsRow && statsRow.total > 0) {
          attendanceRate = Math.round((statsRow.attended / statsRow.total) * 100);
        }

        const stats: ClassStats = {
          totalEnrollments,
          activeEnrollments,
          totalAssignments,
          totalAnnouncements,
          attendanceRate,
        };

        const result: ClassDetails = {
          class: cls,
          teacher,
          enrollments,
          assignments,
          announcements,
          recentAttendance,
          stats,
        };

        return result;
      });

      const create = Effect.fn("ClassRepo.create")(function*(input: ClassInput) {
        const now = new Date().toISOString();
        const id = randomUUID();
        const res = yield* sqlite.queryOne<Class>(
          "INSERT INTO classes (id, name, subject, teacher_id, room_number, schedule, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
          [id, input.name, input.subject, input.teacher_id, input.room_number ?? null, input.schedule ?? null, now, now]
        );
        if (!res) {
          return yield* new DatabaseError({ message: "Failed to create class record" });
        }
        return res;
      });

      const update = Effect.fn("ClassRepo.update")(function*(id: string, input: Partial<ClassInput>) {
        const now = new Date().toISOString();
        let updateQuery = "UPDATE classes SET updated_at = ?";
        const params: (string | number | null)[] = [now];

        for (const [key, value] of Object.entries(input)) {
          if (value !== undefined) {
            updateQuery += `, ${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`;
            params.push(value);
          }
        }

        updateQuery += " WHERE id = ? RETURNING *";
        params.push(id);

        const res = yield* sqlite.queryOne<Class>(updateQuery, params);
        if (!res) {
          return yield* new NotFoundError({ message: `Class with id ${id} not found`, entity: "Class", id });
        }
        return res;
      });

      const delete_ = Effect.fn("ClassRepo.delete")(function*(id: string) {
        // Cascading deletion of dependent entities
        yield* sqlite.run("DELETE FROM announcements WHERE class_id = ?", [id]);
        yield* sqlite.run("DELETE FROM attendance WHERE class_id = ?", [id]);
        yield* sqlite.run(
          "DELETE FROM grades WHERE submission_id IN (SELECT s.id FROM submissions s INNER JOIN assignments a ON s.assignment_id = a.id WHERE a.class_id = ?)",
          [id]
        );
        yield* sqlite.run(
          "DELETE FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE class_id = ?)",
          [id]
        );
        yield* sqlite.run("DELETE FROM assignments WHERE class_id = ?", [id]);
        yield* sqlite.run("DELETE FROM enrollments WHERE class_id = ?", [id]);
        const res = yield* sqlite.run("DELETE FROM classes WHERE id = ?", [id]);
        return res.changes > 0;
      });

      return ClassRepo.of({
        findAll,
        findById,
        findByIdOrNull,
        findByStudentId,
        getDetails,
        create,
        update,
        delete: delete_
      });
    })
  );
}
