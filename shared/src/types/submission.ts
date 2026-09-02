// shared/src/types/submission.ts
import { Schema } from "effect";

export class Submission extends Schema.Class<Submission>("Submission")({
  id: Schema.String,
  assignment_id: Schema.String,
  student_id: Schema.String,
  submitted_at: Schema.String,
  content: Schema.optional(Schema.NullOr(Schema.String)),
  status: Schema.optional(Schema.Literals(["submitted", "graded", "returned"])),
}) {}

export class SubmissionInput extends Schema.Class<SubmissionInput>("SubmissionInput")({
  assignment_id: Schema.String,
  student_id: Schema.String,
  content: Schema.optional(Schema.NullOr(Schema.String)),
  status: Schema.optional(Schema.Literals(["submitted", "graded", "returned"])),
}) {}

export const SubmissionSchema = SubmissionInput;

export interface SubmissionListResponse {
  data: Submission[];
  count: number;
}

export interface SubmissionResponse {
  data: Submission;
}
