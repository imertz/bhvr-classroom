import { Context, Effect, Layer } from "effect";
import { randomUUIDv7 as randomUUID } from "bun";
import type { Grade, GradeInput } from "shared/dist";
import { DatabaseError, NotFoundError } from "shared/dist";
import { SqliteClient } from "./SqliteClient";

export class GradeRepo extends Context.Service<GradeRepo, {
  readonly findAll: () => Effect.Effect<Grade[], DatabaseError>;
  readonly findById: (id: string) => Effect.Effect<Grade, NotFoundError | DatabaseError>;
  readonly findByIdOrNull: (id: string) => Effect.Effect<Grade | null, DatabaseError>;
  readonly findByStudentId: (studentId: string) => Effect.Effect<Grade[], DatabaseError>;
  readonly create: (input: GradeInput) => Effect.Effect<Grade, DatabaseError>;
  readonly update: (id: string, input: Partial<GradeInput>) => Effect.Effect<Grade, NotFoundError | DatabaseError>;
  readonly delete: (id: string) => Effect.Effect<boolean, DatabaseError>;
}>()("server/GradeRepo") {
  static readonly layer = Layer.effect(
    GradeRepo,
    Effect.gen(function*() {
      const sqlite = yield* SqliteClient;

      const findAll = Effect.fn("GradeRepo.findAll")(function*() {
        return yield* sqlite.queryAll<Grade>("SELECT * FROM grades");
      });

      const findByIdOrNull = Effect.fn("GradeRepo.findByIdOrNull")(function*(id: string) {
        return yield* sqlite.queryOne<Grade>("SELECT * FROM grades WHERE id = ?", [id]);
      });

      const findById = Effect.fn("GradeRepo.findById")(function*(id: string) {
        const grade = yield* findByIdOrNull(id);
        if (!grade) {
          return yield* new NotFoundError({ message: `Grade with id ${id} not found`, entity: "Grade", id });
        }
        return grade;
      });

      const findByStudentId = Effect.fn("GradeRepo.findByStudentId")(function*(studentId: string) {
        return yield* sqlite.queryAll<Grade>(
          `SELECT g.* FROM grades g
           INNER JOIN submissions s ON g.submission_id = s.id
           WHERE s.student_id = ?
           ORDER BY g.graded_at DESC`,
          [studentId]
        );
      });

      const create = Effect.fn("GradeRepo.create")(function*(input: GradeInput) {
        const now = new Date().toISOString();
        const id = randomUUID();
        const res = yield* sqlite.queryOne<Grade>(
          "INSERT INTO grades (id, submission_id, points_earned, feedback, graded_at, graded_by) VALUES (?, ?, ?, ?, ?, ?) RETURNING *",
          [id, input.submission_id, input.points_earned, input.feedback ?? null, now, input.graded_by]
        );
        if (!res) {
          return yield* new DatabaseError({ message: "Failed to create grade record" });
        }
        return res;
      });

      const update = Effect.fn("GradeRepo.update")(function*(id: string, input: Partial<GradeInput>) {
        const now = new Date().toISOString();
        let updateQuery = "UPDATE grades SET graded_at = ?";
        const params: (string | number | null)[] = [now];

        for (const [key, value] of Object.entries(input)) {
          if (value !== undefined) {
            updateQuery += `, ${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`;
            params.push(value);
          }
        }

        updateQuery += " WHERE id = ? RETURNING *";
        params.push(id);

        const res = yield* sqlite.queryOne<Grade>(updateQuery, params);
        if (!res) {
          return yield* new NotFoundError({ message: `Grade with id ${id} not found`, entity: "Grade", id });
        }
        return res;
      });

      const delete_ = Effect.fn("GradeRepo.delete")(function*(id: string) {
        const res = yield* sqlite.run("DELETE FROM grades WHERE id = ?", [id]);
        return res.changes > 0;
      });

      return GradeRepo.of({
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
