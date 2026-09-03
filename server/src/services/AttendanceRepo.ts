import { Context, Effect, Layer } from "effect";
import { randomUUIDv7 as randomUUID } from "bun";
import type { Attendance, AttendanceInput } from "shared/dist";
import { ConflictError, DatabaseError, NotFoundError } from "shared/dist";
import { SqliteClient } from "./SqliteClient";
import { withUniqueConstraintConflict } from "./SqliteErrors";

export class AttendanceRepo extends Context.Service<AttendanceRepo, {
  readonly findAll: () => Effect.Effect<Attendance[], DatabaseError>;
  readonly findById: (id: string) => Effect.Effect<Attendance, NotFoundError | DatabaseError>;
  readonly findByIdOrNull: (id: string) => Effect.Effect<Attendance | null, DatabaseError>;
  readonly findByStudentId: (studentId: string) => Effect.Effect<Attendance[], DatabaseError>;
  readonly create: (input: AttendanceInput) => Effect.Effect<Attendance, DatabaseError | ConflictError>;
  readonly update: (id: string, input: Partial<AttendanceInput>) => Effect.Effect<Attendance, NotFoundError | DatabaseError | ConflictError>;
  readonly delete: (id: string) => Effect.Effect<boolean, DatabaseError>;
}>()("server/AttendanceRepo") {
  static readonly layer = Layer.effect(
    AttendanceRepo,
    Effect.gen(function*() {
      const sqlite = yield* SqliteClient;

      const findAll = Effect.fn("AttendanceRepo.findAll")(function*() {
        return yield* sqlite.queryAll<Attendance>("SELECT * FROM attendance");
      });

      const findByIdOrNull = Effect.fn("AttendanceRepo.findByIdOrNull")(function*(id: string) {
        return yield* sqlite.queryOne<Attendance>("SELECT * FROM attendance WHERE id = ?", [id]);
      });

      const findById = Effect.fn("AttendanceRepo.findById")(function*(id: string) {
        const attendance = yield* findByIdOrNull(id);
        if (!attendance) {
          return yield* new NotFoundError({ message: `Attendance record with id ${id} not found`, entity: "Attendance", id });
        }
        return attendance;
      });

      const findByStudentId = Effect.fn("AttendanceRepo.findByStudentId")(function*(studentId: string) {
        return yield* sqlite.queryAll<Attendance>(
          "SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC",
          [studentId]
        );
      });

      const create = Effect.fn("AttendanceRepo.create")(function*(input: AttendanceInput) {
        const now = new Date().toISOString();
        const id = randomUUID();
        const res = yield* withUniqueConstraintConflict(
          sqlite.queryOne<Attendance>(
            "INSERT INTO attendance (id, student_id, class_id, date, status, notes, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *",
            [id, input.student_id, input.class_id, input.date, input.status, input.notes ?? null, now]
          ),
          "Attendance has already been recorded for this student, class, and date"
        );
        if (!res) {
          return yield* new DatabaseError({ message: "Failed to create attendance record" });
        }
        return res;
      });

      const update = Effect.fn("AttendanceRepo.update")(function*(id: string, input: Partial<AttendanceInput>) {
        let updateQuery = "UPDATE attendance SET";
        const params: (string | number | null)[] = [];
        const updates: string[] = [];

        for (const [key, value] of Object.entries(input)) {
          if (value !== undefined && key !== "recorded_at") {
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
          sqlite.queryOne<Attendance>(updateQuery, params),
          "Attendance has already been recorded for this student, class, and date"
        );
        if (!res) {
          return yield* new NotFoundError({ message: `Attendance record with id ${id} not found`, entity: "Attendance", id });
        }
        return res;
      });

      const delete_ = Effect.fn("AttendanceRepo.delete")(function*(id: string) {
        const res = yield* sqlite.run("DELETE FROM attendance WHERE id = ?", [id]);
        return res.changes > 0;
      });

      return AttendanceRepo.of({
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
