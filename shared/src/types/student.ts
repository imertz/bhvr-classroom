// shared/src/types/student.ts
import { Schema } from "effect";

export class Student extends Schema.Class<Student>("Student")({
  id: Schema.String,
  email: Schema.String,
  first_name: Schema.String,
  last_name: Schema.String,
  date_of_birth: Schema.String,
  grade_level: Schema.Int,
  role: Schema.optional(Schema.Literal("student")),
  created_at: Schema.String,
  updated_at: Schema.String,
}) {}

export class StudentCreateInput extends Schema.Class<StudentCreateInput>("StudentCreateInput")({
  email: Schema.String,
  first_name: Schema.String,
  last_name: Schema.String,
  date_of_birth: Schema.String,
  grade_level: Schema.Int,
  role: Schema.optional(Schema.Literal("student")),
  password: Schema.String.pipe(Schema.check(Schema.isMinLength(8))),
}) {}

export class StudentInput extends Schema.Class<StudentInput>("StudentInput")({
  email: Schema.String,
  first_name: Schema.String,
  last_name: Schema.String,
  date_of_birth: Schema.String,
  grade_level: Schema.Int,
  role: Schema.optional(Schema.Literal("student")),
  password: Schema.optional(Schema.String.pipe(Schema.check(Schema.isMinLength(8)))),
}) {}

export const StudentCreateSchema = StudentCreateInput;
export const StudentSchema = StudentInput;

export interface StudentListResponse {
  data: Student[];
  count: number;
}

export interface StudentResponse {
  data: Student;
}
