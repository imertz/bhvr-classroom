import { Context, Effect, Layer } from "effect";
import { randomUUIDv7 as randomUUID } from "bun";
import type { Assignment, AssignmentInput } from "shared/dist";
import { DatabaseError, NotFoundError } from "shared/dist";
import { SqliteClient } from "./SqliteClient";

export class AssignmentRepo extends Context.Service<AssignmentRepo, {
  readonly findAll: () => Effect.Effect<Assignment[], DatabaseError>;
  readonly findById: (id: string) => Effect.Effect<Assignment, NotFoundError | DatabaseError>;
  readonly findByIdOrNull: (id: string) => Effect.Effect<Assignment | null, DatabaseError>;
  readonly findByClassId: (classId: string) => Effect.Effect<Assignment[], DatabaseError>;
  readonly create: (input: AssignmentInput) => Effect.Effect<Assignment, DatabaseError>;
  readonly update: (id: string, input: Partial<AssignmentInput>) => Effect.Effect<Assignment, NotFoundError | DatabaseError>;
  readonly delete: (id: string) => Effect.Effect<boolean, DatabaseError>;
}>()("server/AssignmentRepo") {
  static readonly layer = Layer.effect(
    AssignmentRepo,
    Effect.gen(function*() {
      const sqlite = yield* SqliteClient;

      const findAll = Effect.fn("AssignmentRepo.findAll")(function*() {
        return yield* sqlite.queryAll<Assignment>("SELECT * FROM assignments");
      });

      const findByIdOrNull = Effect.fn("AssignmentRepo.findByIdOrNull")(function*(id: string) {
        return yield* sqlite.queryOne<Assignment>("SELECT * FROM assignments WHERE id = ?", [id]);
      });

      const findById = Effect.fn("AssignmentRepo.findById")(function*(id: string) {
        const assignment = yield* findByIdOrNull(id);
        if (!assignment) {
          return yield* new NotFoundError({ message: `Assignment with id ${id} not found`, entity: "Assignment", id });
        }
        return assignment;
      });

      const findByClassId = Effect.fn("AssignmentRepo.findByClassId")(function*(classId: string) {
        return yield* sqlite.queryAll<Assignment>("SELECT * FROM assignments WHERE class_id = ?", [classId]);
      });

      const create = Effect.fn("AssignmentRepo.create")(function*(input: AssignmentInput) {
        const now = new Date().toISOString();
        const id = randomUUID();
        let dueDateIso = input.due_date;
        if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dueDateIso)) {
          dueDateIso = dueDateIso + ":00";
        }

        const res = yield* sqlite.queryOne<Assignment>(
          "INSERT INTO assignments (id, class_id, title, description, type, points_possible, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
          [id, input.class_id, input.title, input.description ?? null, input.type, input.points_possible, dueDateIso, now, now]
        );
        if (!res) {
          return yield* new DatabaseError({ message: "Failed to create assignment record" });
        }
        return res;
      });

      const update = Effect.fn("AssignmentRepo.update")(function*(id: string, input: Partial<AssignmentInput>) {
        const now = new Date().toISOString();
        let updateQuery = "UPDATE assignments SET updated_at = ?";
        const params: (string | number | null)[] = [now];

        for (const [key, value] of Object.entries(input)) {
          if (value !== undefined) {
            if (key === "due_date" && value) {
              let dueDateIso = String(value);
              if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dueDateIso)) {
                dueDateIso += ":00";
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

        const res = yield* sqlite.queryOne<Assignment>(updateQuery, params);
        if (!res) {
          return yield* new NotFoundError({ message: `Assignment with id ${id} not found`, entity: "Assignment", id });
        }
        return res;
      });

      const delete_ = Effect.fn("AssignmentRepo.delete")(function*(id: string) {
        const res = yield* sqlite.run("DELETE FROM assignments WHERE id = ?", [id]);
        return res.changes > 0;
      });

      return AssignmentRepo.of({
        findAll,
        findById,
        findByIdOrNull,
        findByClassId,
        create,
        update,
        delete: delete_
      });
    })
  );
}

