import { Context, Effect, Layer } from "effect";
import { randomUUIDv7 as randomUUID } from "bun";
import type { Student, StudentInput } from "shared/dist";
import { DatabaseError, NotFoundError } from "shared/dist";
import { SqliteClient } from "./SqliteClient";

export interface StudentRecord extends Student {
  password_hash: string | null;
}

export class StudentRepo extends Context.Service<StudentRepo, {
  readonly findAll: () => Effect.Effect<Student[], DatabaseError>;
  readonly findById: (id: string) => Effect.Effect<Student, NotFoundError | DatabaseError>;
  readonly findByIdOrNull: (id: string) => Effect.Effect<Student | null, DatabaseError>;
  readonly findByEmail: (email: string) => Effect.Effect<StudentRecord | null, DatabaseError>;
  readonly findByClassId: (classId: string) => Effect.Effect<Student[], DatabaseError>;
  readonly create: (input: StudentInput) => Effect.Effect<Student, DatabaseError>;
  readonly update: (id: string, input: Partial<StudentInput>) => Effect.Effect<Student, NotFoundError | DatabaseError>;
  readonly delete: (id: string) => Effect.Effect<boolean, DatabaseError>;
}>()("server/StudentRepo") {
  static readonly layer = Layer.effect(
    StudentRepo,
    Effect.gen(function*() {
      const sqlite = yield* SqliteClient;

      const findAll = Effect.fn("StudentRepo.findAll")(function*() {
        return yield* sqlite.queryAll<Student>(
          "SELECT id, email, first_name, last_name, date_of_birth, grade_level, role, created_at, updated_at FROM students ORDER BY last_name, first_name ASC"
        );
      });

      const findByIdOrNull = Effect.fn("StudentRepo.findByIdOrNull")(function*(id: string) {
        return yield* sqlite.queryOne<Student>(
          "SELECT id, email, first_name, last_name, date_of_birth, grade_level, role, created_at, updated_at FROM students WHERE id = ?",
          [id]
        );
      });

      const findById = Effect.fn("StudentRepo.findById")(function*(id: string) {
        const student = yield* findByIdOrNull(id);
        if (!student) {
          return yield* new NotFoundError({ message: `Student with id ${id} not found`, entity: "Student", id });
        }
        return student;
      });

      const findByEmail = Effect.fn("StudentRepo.findByEmail")(function*(email: string) {
        return yield* sqlite.queryOne<StudentRecord>(
          "SELECT * FROM students WHERE email = ?",
          [email]
        );
      });

      const findByClassId = Effect.fn("StudentRepo.findByClassId")(function*(classId: string) {
        return yield* sqlite.queryAll<Student>(
          `SELECT s.id, s.email, s.first_name, s.last_name, s.date_of_birth, s.grade_level, s.role, s.created_at, s.updated_at FROM students s
           JOIN enrollments e ON s.id = e.student_id
           WHERE e.class_id = ?`,
          [classId]
        );
      });

      const create = Effect.fn("StudentRepo.create")(function*(input: StudentInput) {
        const now = new Date().toISOString();
        const id = randomUUID();
        const passwordHash = input.password
          ? yield* Effect.tryPromise({
              try: () => Bun.password.hash(input.password!),
              catch: (e) => new DatabaseError({ message: "Failed to hash password", cause: e })
            })
          : null;
        const role = input.role || "student";

        const res = yield* sqlite.queryOne<Student>(
          "INSERT INTO students (id, email, password_hash, first_name, last_name, date_of_birth, grade_level, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, email, first_name, last_name, date_of_birth, grade_level, role, created_at, updated_at",
          [id, input.email, passwordHash, input.first_name, input.last_name, input.date_of_birth, input.grade_level, role, now, now]
        );
        if (!res) {
          return yield* new DatabaseError({ message: "Failed to insert student record" });
        }
        return res;
      });

      const update = Effect.fn("StudentRepo.update")(function*(id: string, input: Partial<StudentInput>) {
        const now = new Date().toISOString();
        let updateQuery = "UPDATE students SET updated_at = ?";
        const params: (string | number | null)[] = [now];

        for (const [key, value] of Object.entries(input)) {
          if (key === "password" && value) {
            const hashedPassword = yield* Effect.tryPromise({
              try: () => Bun.password.hash(String(value)),
              catch: (e) => new DatabaseError({ message: "Failed to hash password", cause: e })
            });
            updateQuery += `, password_hash = ?`;
            params.push(hashedPassword);
          } else if (value !== undefined) {
            updateQuery += `, ${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`;
            params.push(value);
          }
        }

        updateQuery += " WHERE id = ? RETURNING id, email, first_name, last_name, date_of_birth, grade_level, role, created_at, updated_at";
        params.push(id);

        const res = yield* sqlite.queryOne<Student>(updateQuery, params);
        if (!res) {
          return yield* new NotFoundError({ message: `Student with id ${id} not found`, entity: "Student", id });
        }
        return res;
      });

      const delete_ = Effect.fn("StudentRepo.delete")(function*(id: string) {
        const res = yield* sqlite.run("DELETE FROM students WHERE id = ?", [id]);
        return res.changes > 0;
      });

      return StudentRepo.of({
        findAll,
        findById,
        findByIdOrNull,
        findByEmail,
        findByClassId,
        create,
        update,
        delete: delete_
      });
    })
  );
}

