// shared/src/types/enrollment.ts
import { Schema } from "effect";

export class Enrollment extends Schema.Class<Enrollment>("Enrollment")({
  id: Schema.String,
  student_id: Schema.String,
  class_id: Schema.String,
  enrolled_at: Schema.String,
  status: Schema.Literals(["active", "dropped", "completed"]),
}) {}

export class EnrollmentInput extends Schema.Class<EnrollmentInput>("EnrollmentInput")({
  student_id: Schema.String,
  class_id: Schema.String,
  status: Schema.optional(Schema.Literals(["active", "dropped", "completed"])),
}) {}

export const EnrollmentSchema = EnrollmentInput;

export interface EnrollmentListResponse {
  data: Enrollment[];
  count: number;
}

export interface EnrollmentResponse {
  data: Enrollment;
}
