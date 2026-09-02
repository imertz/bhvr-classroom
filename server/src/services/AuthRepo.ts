import { Context, Effect, Layer } from "effect";
import { DatabaseError, NotFoundError } from "shared/dist";
import { SqliteClient } from "./SqliteClient";

export interface RefreshToken {
  id: string;
  user_id: string;
  user_type: "teacher" | "student";
  token_hash: string;
  expires_at: string;
  created_at: string;
  revoked_at?: string | null;
}

export interface RefreshTokenInput {
  id: string;
  user_id: string;
  user_type: "teacher" | "student";
  token_hash: string;
  expires_at: string;
}

export class AuthRepo extends Context.Service<AuthRepo, {
  readonly storeRefreshToken: (input: RefreshTokenInput) => Effect.Effect<RefreshToken, DatabaseError>;
  readonly findRefreshTokenById: (id: string) => Effect.Effect<RefreshToken, NotFoundError | DatabaseError>;
  readonly findRefreshTokenByIdOrNull: (id: string) => Effect.Effect<RefreshToken | null, DatabaseError>;
  readonly revokeRefreshToken: (id: string) => Effect.Effect<RefreshToken | null, DatabaseError>;
}>()("server/AuthRepo") {
  static readonly layer = Layer.effect(
    AuthRepo,
    Effect.gen(function*() {
      const sqlite = yield* SqliteClient;

      const storeRefreshToken = Effect.fn("AuthRepo.storeRefreshToken")(function*(input: RefreshTokenInput) {
        const now = new Date().toISOString();
        const res = yield* sqlite.queryOne<RefreshToken>(
          "INSERT INTO refresh_tokens (id, user_id, user_type, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING *",
          [input.id, input.user_id, input.user_type, input.token_hash, input.expires_at, now]
        );
        if (!res) {
          return yield* new DatabaseError({ message: "Failed to store refresh token" });
        }
        return res;
      });

      const findRefreshTokenByIdOrNull = Effect.fn("AuthRepo.findRefreshTokenByIdOrNull")(function*(id: string) {
        return yield* sqlite.queryOne<RefreshToken>("SELECT * FROM refresh_tokens WHERE id = ?", [id]);
      });

      const findRefreshTokenById = Effect.fn("AuthRepo.findRefreshTokenById")(function*(id: string) {
        const token = yield* findRefreshTokenByIdOrNull(id);
        if (!token) {
          return yield* new NotFoundError({ message: `Refresh token with id ${id} not found`, entity: "RefreshToken", id });
        }
        return token;
      });

      const revokeRefreshToken = Effect.fn("AuthRepo.revokeRefreshToken")(function*(id: string) {
        const now = new Date().toISOString();
        return yield* sqlite.queryOne<RefreshToken>(
          "UPDATE refresh_tokens SET revoked_at = ? WHERE id = ? RETURNING *",
          [now, id]
        );
      });

      return AuthRepo.of({
        storeRefreshToken,
        findRefreshTokenById,
        findRefreshTokenByIdOrNull,
        revokeRefreshToken
      });
    })
  );
}
