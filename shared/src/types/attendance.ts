// shared/src/types/attendance.ts
import { Schema } from "effect";

export class Attendance extends Schema.Class<Attendance>("Attendance")({
  id: Schema.String,
  student_id: Schema.String,
  class_id: Schema.String,
  date: Schema.String,
  status: Schema.Literals(["present", "absent", "tardy", "excused"]),
  notes: Schema.optional(Schema.NullOr(Schema.String)),
  recorded_at: Schema.String,
}) {}

export class AttendanceInput extends Schema.Class<AttendanceInput>("AttendanceInput")({
  student_id: Schema.String,
  class_id: Schema.String,
  date: Schema.String,
  status: Schema.Literals(["present", "absent", "tardy", "excused"]),
  notes: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

export const AttendanceSchema = AttendanceInput;

export interface AttendanceListResponse {
  data: Attendance[];
  count: number;
}

export interface AttendanceResponse {
  data: Attendance;
}
