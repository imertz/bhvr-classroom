// shared/src/types/class.ts
import { Schema } from "effect";

export class Class extends Schema.Class<Class>("Class")({
  id: Schema.String,
  name: Schema.String,
  subject: Schema.String,
  teacher_id: Schema.String,
  room_number: Schema.optional(Schema.NullOr(Schema.String)),
  schedule: Schema.optional(Schema.NullOr(Schema.String)),
  created_at: Schema.String,
  updated_at: Schema.String,
}) {}

export class ClassInput extends Schema.Class<ClassInput>("ClassInput")({
  name: Schema.String,
  subject: Schema.String,
  teacher_id: Schema.String,
  room_number: Schema.optional(Schema.NullOr(Schema.String)),
  schedule: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

export const ClassSchema = ClassInput;

export interface ClassListResponse {
  data: Class[];
  count: number;
}

export interface ClassResponse {
  data: Class;
}
