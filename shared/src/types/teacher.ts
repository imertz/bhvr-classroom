// shared/src/types/teacher.ts
import { Schema } from "effect";

export class Teacher extends Schema.Class<Teacher>("Teacher")({
  id: Schema.String,
  email: Schema.String,
  first_name: Schema.String,
  last_name: Schema.String,
  role: Schema.Literals(["teacher", "admin"]),
  created_at: Schema.String,
  updated_at: Schema.String,
}) {}

export class TeacherCreateInput extends Schema.Class<TeacherCreateInput>("TeacherCreateInput")({
  email: Schema.String,
  first_name: Schema.String,
  last_name: Schema.String,
  role: Schema.optional(Schema.Literals(["teacher", "admin"])),
  password: Schema.String.pipe(Schema.check(Schema.isMinLength(8))),
}) {}

export class TeacherInput extends Schema.Class<TeacherInput>("TeacherInput")({
  email: Schema.String,
  first_name: Schema.String,
  last_name: Schema.String,
  role: Schema.optional(Schema.Literals(["teacher", "admin"])),
  password: Schema.optional(Schema.String.pipe(Schema.check(Schema.isMinLength(8)))),
}) {}

export class TeacherRegistrationInput extends Schema.Class<TeacherRegistrationInput>("TeacherRegistrationInput")({
  email: Schema.String,
  password: Schema.String.pipe(Schema.check(Schema.isMinLength(8))),
  first_name: Schema.String,
  last_name: Schema.String,
}) {}

export const TeacherCreateSchema = TeacherCreateInput;
export const TeacherSchema = TeacherInput;
export const TeacherRegistrationSchema = TeacherRegistrationInput;

export interface TeacherListResponse {
  data: Teacher[];
  count: number;
}

export interface TeacherResponse {
  data: Teacher;
}
