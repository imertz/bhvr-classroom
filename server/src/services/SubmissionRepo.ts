import { Context, Effect, Layer } from "effect";
import { randomUUIDv7 as randomUUID } from "bun";
import type { Submission, SubmissionInput } from "shared/dist";
import { ConflictError, DatabaseError, NotFoundError } from "shared/dist";
import { SqliteClient } from "./SqliteClient";
import { withUniqueConstraintConflict } from "./SqliteErrors";

export class SubmissionRepo extends Context.Service<SubmissionRepo, {
  readonly findAll: () => Effect.Effect<Submission[], DatabaseError>;
  readonly findById: (id: string) => Effect.Effect<Submission, NotFoundError | DatabaseError>;
  readonly findByIdOrNull: (id: string) => Effect.Effect<Submission | null, DatabaseError>;
  readonly findByStudentId: (studentId: string) => Effect.Effect<Submission[], DatabaseError>;
  readonly create: (input: SubmissionInput) => Effect.Effect<Submission, DatabaseError | ConflictError>;
  readonly update: (id: string, input: Partial<SubmissionInput>) => Effect.Effect<Submission, NotFoundError | DatabaseError | ConflictError>;
  readonly delete: (id: string) => Effect.Effect<boolean, DatabaseError>;
}>()("server/SubmissionRepo") {
  static readonly layer = Layer.effect(
    SubmissionRepo,
    Effect.gen(function*() {
      const sqlite = yield* SqliteClient;

      const findAll = Effect.fn("SubmissionRepo.findAll")(function*() {
        return yield* sqlite.queryAll<Submission>("SELECT * FROM submissions");
      });

      const findByIdOrNull = Effect.fn("SubmissionRepo.findByIdOrNull")(function*(id: string) {
        return yield* sqlite.queryOne<Submission>("SELECT * FROM submissions WHERE id = ?", [id]);
      });

      const findById = Effect.fn("SubmissionRepo.findById")(function*(id: string) {
        const submission = yield* findByIdOrNull(id);
        if (!submission) {
          return yield* new NotFoundError({ message: `Submission with id ${id} not found`, entity: "Submission", id });
        }
        return submission;
      });

      const findByStudentId = Effect.fn("SubmissionRepo.findByStudentId")(function*(studentId: string) {
        return yield* sqlite.queryAll<Submission>(
          "SELECT * FROM submissions WHERE student_id = ? ORDER BY submitted_at DESC",
          [studentId]
        );
      });

      const create = Effect.fn("SubmissionRepo.create")(function*(input: SubmissionInput) {
        const now = new Date().toISOString();
        const id = randomUUID();
        const res = yield* withUniqueConstraintConflict(
          sqlite.queryOne<Submission>(
            "INSERT INTO submissions (id, assignment_id, student_id, submitted_at, content, status) VALUES (?, ?, ?, ?, ?, ?) RETURNING *",
            [id, input.assignment_id, input.student_id, now, input.content ?? null, input.status || "submitted"]
          ),
          "This student has already submitted this assignment"
        );
        if (!res) {
          return yield* new DatabaseError({ message: "Failed to create submission record" });
        }
        return res;
      });

      const update = Effect.fn("SubmissionRepo.update")(function*(id: string, input: Partial<SubmissionInput>) {
        let updateQuery = "UPDATE submissions SET";
        const params: (string | number | null)[] = [];
        const updates: string[] = [];

        for (const [key, value] of Object.entries(input)) {
          if (value !== undefined) {
            updates.push(`${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`);
            params.push(value);
          }
        }

        if (updates.length === 0) {
          return yield* findById(id);
        }

        updateQuery += ` ${updates.join(", ")} WHERE id = ? RETURNING *`;
        params.push(id);

        const res = yield* withUniqueConstraintConflict(
          sqlite.queryOne<Submission>(updateQuery, params),
          "This student has already submitted this assignment"
        );
        if (!res) {
          return yield* new NotFoundError({ message: `Submission with id ${id} not found`, entity: "Submission", id });
        }
        return res;
      });

      const delete_ = Effect.fn("SubmissionRepo.delete")(function*(id: string) {
        yield* sqlite.run("DELETE FROM grades WHERE submission_id = ?", [id]);
        const res = yield* sqlite.run("DELETE FROM submissions WHERE id = ?", [id]);
        return res.changes > 0;
      });

      return SubmissionRepo.of({
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
