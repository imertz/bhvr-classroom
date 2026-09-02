// shared/src/types/assignment.ts
import { Schema } from "effect";

export class Assignment extends Schema.Class<Assignment>("Assignment")({
  id: Schema.String,
  class_id: Schema.String,
  title: Schema.String,
  description: Schema.NullOr(Schema.String),
  type: Schema.Literals(["homework", "quiz", "test", "project"]),
  points_possible: Schema.Int,
  due_date: Schema.String,
  created_at: Schema.String,
  updated_at: Schema.String,
}) {}

export class AssignmentInput extends Schema.Class<AssignmentInput>("AssignmentInput")({
  class_id: Schema.String,
  title: Schema.String,
  description: Schema.optional(Schema.NullOr(Schema.String)),
  type: Schema.Literals(["homework", "quiz", "test", "project"]),
  points_possible: Schema.Int,
  due_date: Schema.String,
}) {}

export const AssignmentSchema = AssignmentInput;

export interface AssignmentListResponse {
  data: Assignment[];
  count: number;
}

export interface AssignmentResponse {
  data: Assignment;
}
