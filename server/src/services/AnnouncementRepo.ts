import { Context, Effect, Layer } from "effect";
import { randomUUIDv7 as randomUUID } from "bun";
import type { Announcement, AnnouncementInput } from "shared/dist";
import { DatabaseError, NotFoundError } from "shared/dist";
import { SqliteClient } from "./SqliteClient";

export class AnnouncementRepo extends Context.Service<AnnouncementRepo, {
  readonly findAll: () => Effect.Effect<Announcement[], DatabaseError>;
  readonly findById: (id: string) => Effect.Effect<Announcement, NotFoundError | DatabaseError>;
  readonly findByIdOrNull: (id: string) => Effect.Effect<Announcement | null, DatabaseError>;
  readonly findByStudentId: (studentId: string) => Effect.Effect<Announcement[], DatabaseError>;
  readonly create: (input: AnnouncementInput) => Effect.Effect<Announcement, DatabaseError>;
  readonly update: (id: string, input: Partial<AnnouncementInput>) => Effect.Effect<Announcement, NotFoundError | DatabaseError>;
  readonly delete: (id: string) => Effect.Effect<boolean, DatabaseError>;
}>()("server/AnnouncementRepo") {
  static readonly layer = Layer.effect(
    AnnouncementRepo,
    Effect.gen(function*() {
      const sqlite = yield* SqliteClient;

      const findAll = Effect.fn("AnnouncementRepo.findAll")(function*() {
        return yield* sqlite.queryAll<Announcement>("SELECT * FROM announcements ORDER BY created_at DESC");
      });

      const findByIdOrNull = Effect.fn("AnnouncementRepo.findByIdOrNull")(function*(id: string) {
        return yield* sqlite.queryOne<Announcement>("SELECT * FROM announcements WHERE id = ?", [id]);
      });

      const findById = Effect.fn("AnnouncementRepo.findById")(function*(id: string) {
        const announcement = yield* findByIdOrNull(id);
        if (!announcement) {
          return yield* new NotFoundError({ message: `Announcement with id ${id} not found`, entity: "Announcement", id });
        }
        return announcement;
      });

      const normalizeIsoDateTime = (dateStr: string): string => {
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateStr)) {
          return `${dateStr}:00`;
        }
        return dateStr;
      };

      const create = Effect.fn("AnnouncementRepo.create")(function*(input: AnnouncementInput) {
        const now = new Date().toISOString();
        const id = randomUUID();
        const expiresIso = input.expires_at ? normalizeIsoDateTime(input.expires_at) : null;

        const res = yield* sqlite.queryOne<Announcement>(
          "INSERT INTO announcements (id, class_id, teacher_id, title, content, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *",
          [id, input.class_id, input.teacher_id, input.title, input.content, now, expiresIso]
        );
        if (!res) {
          return yield* new DatabaseError({ message: "Failed to create announcement record" });
        }
        return res;
      });

      const update = Effect.fn("AnnouncementRepo.update")(function*(id: string, input: Partial<AnnouncementInput>) {
        let updateQuery = "UPDATE announcements SET";
        const params: (string | number | null)[] = [];
        const updates: string[] = [];

        for (const [key, value] of Object.entries(input)) {
          if (value !== undefined) {
            if (key === "expires_at") {
              if (value) {
                const expiresIso = normalizeIsoDateTime(String(value));
                updates.push("expires_at = ?");
                params.push(expiresIso);
              } else {
                updates.push("expires_at = ?");
                params.push(null);
              }
            } else {
              updates.push(`${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`);
              params.push(value);
            }
          }
        }

        if (updates.length === 0) {
          return yield* findById(id);
        }

        updateQuery += ` ${updates.join(", ")} WHERE id = ? RETURNING *`;
        params.push(id);

        const res = yield* sqlite.queryOne<Announcement>(updateQuery, params);
        if (!res) {
          return yield* new NotFoundError({ message: `Announcement with id ${id} not found`, entity: "Announcement", id });
        }
        return res;
      });

      const delete_ = Effect.fn("AnnouncementRepo.delete")(function*(id: string) {
        const res = yield* sqlite.run("DELETE FROM announcements WHERE id = ?", [id]);
        return res.changes > 0;
      });

      const findByStudentId = Effect.fn("AnnouncementRepo.findByStudentId")(function*(studentId: string) {
        return yield* sqlite.queryAll<Announcement>(
          `SELECT a.* FROM announcements a
           INNER JOIN enrollments e ON a.class_id = e.class_id
           WHERE e.student_id = ? AND e.status = 'active'
           ORDER BY a.created_at DESC`,
          [studentId]
        );
      });

      return AnnouncementRepo.of({
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
