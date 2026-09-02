import { Context, Effect, Layer } from "effect";
import { randomUUIDv7 as randomUUID } from "bun";
import type { Class, ClassInput } from "shared/dist";
import { DatabaseError, NotFoundError } from "shared/dist";
import { SqliteClient } from "./SqliteClient";

export class ClassRepo extends Context.Service<ClassRepo, {
  readonly findAll: () => Effect.Effect<Class[], DatabaseError>;
  readonly findById: (id: string) => Effect.Effect<Class, NotFoundError | DatabaseError>;
  readonly findByIdOrNull: (id: string) => Effect.Effect<Class | null, DatabaseError>;
  readonly findByStudentId: (studentId: string) => Effect.Effect<Class[], DatabaseError>;
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
        const res = yield* sqlite.run("DELETE FROM classes WHERE id = ?", [id]);
        return res.changes > 0;
      });

      return ClassRepo.of({
        findAll,
        findById,
        findByIdOrNull,
        findByStudentId,
        create,
        update,
        delete: delete_
      });
    })
  );
}
