import { Context, Effect, Layer } from "effect";
import { randomUUIDv7 as randomUUID } from "bun";
import type { Attendance, AttendanceInput } from "shared/dist";
import { DatabaseError, NotFoundError } from "shared/dist";
import { SqliteClient } from "./SqliteClient";

export class AttendanceRepo extends Context.Service<AttendanceRepo, {
  readonly findAll: () => Effect.Effect<Attendance[], DatabaseError>;
  readonly findById: (id: string) => Effect.Effect<Attendance, NotFoundError | DatabaseError>;
  readonly findByIdOrNull: (id: string) => Effect.Effect<Attendance | null, DatabaseError>;
  readonly findByStudentId: (studentId: string) => Effect.Effect<Attendance[], DatabaseError>;
  readonly create: (input: AttendanceInput) => Effect.Effect<Attendance, DatabaseError>;
  readonly update: (id: string, input: Partial<AttendanceInput>) => Effect.Effect<Attendance, NotFoundError | DatabaseError>;
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
        const res = yield* sqlite.queryOne<Attendance>(
          "INSERT INTO attendance (id, student_id, class_id, date, status, notes, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *",
          [id, input.student_id, input.class_id, input.date, input.status, input.notes ?? null, now]
        );
        if (!res) {
          return yield* new DatabaseError({ message: "Failed to create attendance record" });
        }
        return res;
      });

      const update = Effect.fn("AttendanceRepo.update")(function*(id: string, input: Partial<AttendanceInput>) {
        const now = new Date().toISOString();
        let updateQuery = "UPDATE attendance SET recorded_at = ?";
        const params: (string | number | null)[] = [now];

        for (const [key, value] of Object.entries(input)) {
          if (value !== undefined) {
            updateQuery += `, ${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`;
            params.push(value);
          }
        }

        updateQuery += " WHERE id = ? RETURNING *";
        params.push(id);

        const res = yield* sqlite.queryOne<Attendance>(updateQuery, params);
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
