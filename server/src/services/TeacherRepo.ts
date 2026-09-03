import { Context, Effect, Layer } from "effect";
import { randomUUIDv7 as randomUUID } from "bun";
import type { Teacher, TeacherInput } from "shared/dist";
import { ConflictError, DatabaseError, NotFoundError } from "shared/dist";
import { SqliteClient } from "./SqliteClient";
import { withUniqueConstraintConflict } from "./SqliteErrors";

export interface TeacherRecord extends Teacher {
  password_hash: string;
}

export class TeacherRepo extends Context.Service<TeacherRepo, {
  readonly findAll: () => Effect.Effect<Teacher[], DatabaseError>;
  readonly findById: (id: string) => Effect.Effect<Teacher, NotFoundError | DatabaseError>;
  readonly findByIdOrNull: (id: string) => Effect.Effect<Teacher | null, DatabaseError>;
  readonly findByEmail: (email: string) => Effect.Effect<TeacherRecord | null, DatabaseError>;
  readonly create: (input: TeacherInput) => Effect.Effect<Teacher, DatabaseError | ConflictError>;
  readonly update: (id: string, input: Partial<TeacherInput>) => Effect.Effect<Teacher, NotFoundError | DatabaseError | ConflictError>;
  readonly delete: (id: string) => Effect.Effect<boolean, DatabaseError>;
}>()("server/TeacherRepo") {
  static readonly layer = Layer.effect(
    TeacherRepo,
    Effect.gen(function*() {
      const sqlite = yield* SqliteClient;

      const findAll = Effect.fn("TeacherRepo.findAll")(function*() {
        return yield* sqlite.queryAll<Teacher>(
          "SELECT id, email, first_name, last_name, role, created_at, updated_at FROM teachers ORDER BY last_name, first_name ASC"
        );
      });

      const findByIdOrNull = Effect.fn("TeacherRepo.findByIdOrNull")(function*(id: string) {
        return yield* sqlite.queryOne<Teacher>(
          "SELECT id, email, first_name, last_name, role, created_at, updated_at FROM teachers WHERE id = ?",
          [id]
        );
      });

      const findById = Effect.fn("TeacherRepo.findById")(function*(id: string) {
        const teacher = yield* findByIdOrNull(id);
        if (!teacher) {
          return yield* new NotFoundError({ message: `Teacher with id ${id} not found`, entity: "Teacher", id });
        }
        return teacher;
      });

      const findByEmail = Effect.fn("TeacherRepo.findByEmail")(function*(email: string) {
        return yield* sqlite.queryOne<TeacherRecord>(
          "SELECT * FROM teachers WHERE lower(email) = lower(?)",
          [email]
        );
      });

      const create = Effect.fn("TeacherRepo.create")(function*(input: TeacherInput) {
        const now = new Date().toISOString();
        const id = randomUUID();
        if (!input.password) {
          return yield* new DatabaseError({ message: "Password is required to create teacher" });
        }
        const hashedPassword = yield* Effect.tryPromise({
          try: () => Bun.password.hash(input.password!),
          catch: (e) => new DatabaseError({ message: "Failed to hash password", cause: e })
        });
        const role = input.role || "teacher";

        const res = yield* withUniqueConstraintConflict(
          sqlite.queryOne<Teacher>(
            "INSERT INTO teachers (id, email, password_hash, first_name, last_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, email, first_name, last_name, role, created_at, updated_at",
            [id, input.email, hashedPassword, input.first_name, input.last_name, role, now, now]
          ),
          "A teacher with this email already exists"
        );
        if (!res) {
          return yield* new DatabaseError({ message: "Failed to insert teacher record" });
        }
        return res;
      });

      const update = Effect.fn("TeacherRepo.update")(function*(id: string, input: Partial<TeacherInput>) {
        const now = new Date().toISOString();
        let updateQuery = "UPDATE teachers SET updated_at = ?";
        const params: (string | number | null)[] = [now];

        for (const [key, value] of Object.entries(input)) {
          if (key === "password") {
            if (value) {
              const hashedPassword = yield* Effect.tryPromise({
                try: () => Bun.password.hash(String(value)),
                catch: (e) => new DatabaseError({ message: "Failed to hash password", cause: e })
              });
              updateQuery += `, password_hash = ?`;
              params.push(hashedPassword);
            }
          } else if (value !== undefined) {
            updateQuery += `, ${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`;
            params.push(value);
          }
        }

        updateQuery += " WHERE id = ? RETURNING id, email, first_name, last_name, role, created_at, updated_at";
        params.push(id);

        const res = yield* withUniqueConstraintConflict(
          sqlite.queryOne<Teacher>(updateQuery, params),
          "A teacher with this email already exists"
        );
        if (!res) {
          return yield* new NotFoundError({ message: `Teacher with id ${id} not found`, entity: "Teacher", id });
        }
        return res;
      });

      const delete_ = Effect.fn("TeacherRepo.delete")(function*(id: string) {
        yield* sqlite.run("DELETE FROM refresh_tokens WHERE user_id = ? AND user_type = 'teacher'", [id]);
        yield* sqlite.run("DELETE FROM announcements WHERE teacher_id = ?", [id]);
        const classes = yield* sqlite.queryAll<{ id: string }>("SELECT id FROM classes WHERE teacher_id = ?", [id]);
        for (const cls of classes) {
          yield* sqlite.run("DELETE FROM announcements WHERE class_id = ?", [cls.id]);
          yield* sqlite.run("DELETE FROM attendance WHERE class_id = ?", [cls.id]);
          yield* sqlite.run(
            "DELETE FROM grades WHERE submission_id IN (SELECT s.id FROM submissions s INNER JOIN assignments a ON s.assignment_id = a.id WHERE a.class_id = ?)",
            [cls.id]
          );
          yield* sqlite.run(
            "DELETE FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE class_id = ?)",
            [cls.id]
          );
          yield* sqlite.run("DELETE FROM assignments WHERE class_id = ?", [cls.id]);
          yield* sqlite.run("DELETE FROM enrollments WHERE class_id = ?", [cls.id]);
          yield* sqlite.run("DELETE FROM classes WHERE id = ?", [cls.id]);
        }
        yield* sqlite.run("DELETE FROM grades WHERE graded_by = ?", [id]);
        const res = yield* sqlite.run("DELETE FROM teachers WHERE id = ?", [id]);
        return res.changes > 0;
      });

      return TeacherRepo.of({
        findAll,
        findById,
        findByIdOrNull,
        findByEmail,
        create,
        update,
        delete: delete_
      });
    })
  );
}
