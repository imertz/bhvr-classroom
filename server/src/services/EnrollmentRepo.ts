import { Context, Effect, Layer } from "effect";
import { randomUUIDv7 as randomUUID } from "bun";
import type { Enrollment, EnrollmentInput } from "shared/dist";
import { ConflictError, DatabaseError, NotFoundError } from "shared/dist";
import { SqliteClient } from "./SqliteClient";
import { withUniqueConstraintConflict } from "./SqliteErrors";

export class EnrollmentRepo extends Context.Service<EnrollmentRepo, {
  readonly findAll: () => Effect.Effect<Enrollment[], DatabaseError>;
  readonly findById: (id: string) => Effect.Effect<Enrollment, NotFoundError | DatabaseError>;
  readonly findByIdOrNull: (id: string) => Effect.Effect<Enrollment | null, DatabaseError>;
  readonly findByStudentId: (studentId: string) => Effect.Effect<Enrollment[], DatabaseError>;
  readonly findByClassId: (classId: string) => Effect.Effect<Enrollment[], DatabaseError>;
  readonly create: (input: EnrollmentInput) => Effect.Effect<Enrollment, DatabaseError | ConflictError>;
  readonly update: (id: string, input: Partial<EnrollmentInput>) => Effect.Effect<Enrollment, NotFoundError | DatabaseError | ConflictError>;
  readonly delete: (id: string) => Effect.Effect<boolean, DatabaseError>;
}>()("server/EnrollmentRepo") {
  static readonly layer = Layer.effect(
    EnrollmentRepo,
    Effect.gen(function*() {
      const sqlite = yield* SqliteClient;

      const findAll = Effect.fn("EnrollmentRepo.findAll")(function*() {
        return yield* sqlite.queryAll<Enrollment>("SELECT * FROM enrollments");
      });

      const findByIdOrNull = Effect.fn("EnrollmentRepo.findByIdOrNull")(function*(id: string) {
        return yield* sqlite.queryOne<Enrollment>("SELECT * FROM enrollments WHERE id = ?", [id]);
      });

      const findById = Effect.fn("EnrollmentRepo.findById")(function*(id: string) {
        const enrollment = yield* findByIdOrNull(id);
        if (!enrollment) {
          return yield* new NotFoundError({ message: `Enrollment with id ${id} not found`, entity: "Enrollment", id });
        }
        return enrollment;
      });

      const findByStudentId = Effect.fn("EnrollmentRepo.findByStudentId")(function*(studentId: string) {
        return yield* sqlite.queryAll<Enrollment>("SELECT * FROM enrollments WHERE student_id = ?", [studentId]);
      });

      const findByClassId = Effect.fn("EnrollmentRepo.findByClassId")(function*(classId: string) {
        return yield* sqlite.queryAll<Enrollment>("SELECT * FROM enrollments WHERE class_id = ?", [classId]);
      });

      const create = Effect.fn("EnrollmentRepo.create")(function*(input: EnrollmentInput) {
        const now = new Date().toISOString();
        const id = randomUUID();
        const res = yield* withUniqueConstraintConflict(
          sqlite.queryOne<Enrollment>(
            "INSERT INTO enrollments (id, student_id, class_id, enrolled_at, status) VALUES (?, ?, ?, ?, ?) RETURNING *",
            [id, input.student_id, input.class_id, now, input.status || "active"]
          ),
          "This student is already enrolled in this class"
        );
        if (!res) {
          return yield* new DatabaseError({ message: "Failed to create enrollment record" });
        }
        return res;
      });

      const update = Effect.fn("EnrollmentRepo.update")(function*(id: string, input: Partial<EnrollmentInput>) {
        let updateQuery = "UPDATE enrollments SET";
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
          sqlite.queryOne<Enrollment>(updateQuery, params),
          "This student is already enrolled in this class"
        );
        if (!res) {
          return yield* new NotFoundError({ message: `Enrollment with id ${id} not found`, entity: "Enrollment", id });
        }
        return res;
      });

      const delete_ = Effect.fn("EnrollmentRepo.delete")(function*(id: string) {
        const res = yield* sqlite.run("DELETE FROM enrollments WHERE id = ?", [id]);
        return res.changes > 0;
      });

      return EnrollmentRepo.of({
        findAll,
        findById,
        findByIdOrNull,
        findByStudentId,
        findByClassId,
        create,
        update,
        delete: delete_
      });
    })
  );
}
