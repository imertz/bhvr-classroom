import { SQLiteError } from "bun:sqlite";
import { Effect } from "effect";
import { ConflictError, DatabaseError } from "shared/dist";

const isUniqueConstraintError = (error: DatabaseError): boolean =>
  error.cause instanceof SQLiteError && error.cause.code === "SQLITE_CONSTRAINT_UNIQUE";

export const withUniqueConstraintConflict = <A, R>(
  effect: Effect.Effect<A, DatabaseError, R>,
  message: string
): Effect.Effect<A, DatabaseError | ConflictError, R> =>
  effect.pipe(
    Effect.catch((error): Effect.Effect<never, DatabaseError | ConflictError> => {
      const mappedError: DatabaseError | ConflictError = isUniqueConstraintError(error)
        ? new ConflictError({ message })
        : error;
      return Effect.fail(mappedError);
    })
  );
