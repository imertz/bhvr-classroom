// shared/src/types/grade.ts
import { Schema } from "effect";

export class Grade extends Schema.Class<Grade>("Grade")({
  id: Schema.String,
  submission_id: Schema.String,
  points_earned: Schema.Int,
  feedback: Schema.optional(Schema.NullOr(Schema.String)),
  graded_at: Schema.String,
  graded_by: Schema.String,
}) {}

export class GradeInput extends Schema.Class<GradeInput>("GradeInput")({
  submission_id: Schema.String,
  points_earned: Schema.Int,
  feedback: Schema.optional(Schema.NullOr(Schema.String)),
  graded_by: Schema.String,
}) {}

export const GradeSchema = GradeInput;

export interface GradeListResponse {
  data: Grade[];
  count: number;
}

export interface GradeResponse {
  data: Grade;
}
