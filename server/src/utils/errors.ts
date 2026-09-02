import { Schema } from "effect";
import { ConflictError } from "shared/dist";

export const isConflictError = Schema.is(ConflictError);
