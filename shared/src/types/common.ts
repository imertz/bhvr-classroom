// shared/src/types/common.ts
import { Schema } from "effect";

/**
 * Generic response for a list of items
 */
export interface ListResponse<T> {
  data: T[];
  count: number;
}

/**
 * Generic response for a single item
 */
export interface ItemResponse<T> {
  data: T;
}

/**
 * Generic error response
 */
export interface ErrorResponse {
  error: string | object;
}

export interface ApiResponse {
  message: string;
  success: true;
}

/**
 * Standard domain errors defined with Effect Schema TaggedError
 */
export class NotFoundError extends Schema.TaggedError<NotFoundError>()("NotFoundError", {
  message: Schema.String,
  entity: Schema.optional(Schema.String),
  id: Schema.optional(Schema.String),
}) {}

export class UnauthorizedError extends Schema.TaggedError<UnauthorizedError>()("UnauthorizedError", {
  message: Schema.String,
}) {}

export class ForbiddenError extends Schema.TaggedError<ForbiddenError>()("ForbiddenError", {
  message: Schema.String,
}) {}

export class ValidationError extends Schema.TaggedError<ValidationError>()("ValidationError", {
  message: Schema.String,
  issues: Schema.optional(Schema.Array(Schema.Unknown)),
}) {}

export class ConflictError extends Schema.TaggedError<ConflictError>()("ConflictError", {
  message: Schema.String,
}) {}

export class DatabaseError extends Schema.TaggedError<DatabaseError>()("DatabaseError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

/**
 * Helper to construct a partial struct schema from fields
 */
export function makePartial<Fields extends Record<string, Schema.Decoder<any>>>(fields: Fields) {
  const partialFields: Record<string, Schema.Decoder<any>> = {};
  for (const [key, schema] of Object.entries(fields)) {
    partialFields[key] = Schema.optional(schema);
  }
  return Schema.Struct(partialFields);
}
