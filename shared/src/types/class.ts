import { Schema } from "effect";
import type { Assignment } from "./assignment";
import type { Announcement } from "./announcement";

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

export interface ClassEnrollmentDetail {
  id: string;
  student_id: string;
  class_id: string;
  enrolled_at: string;
  status: "active" | "dropped" | "completed";
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    grade_level: number;
  };
}

export interface ClassAttendanceDetail {
  id: string;
  student_id: string;
  student_name: string;
  class_id: string;
  date: string;
  status: "present" | "absent" | "tardy" | "excused";
  notes: string | null;
  recorded_at: string;
}

export interface ClassStats {
  totalEnrollments: number;
  activeEnrollments: number;
  totalAssignments: number;
  totalAnnouncements: number;
  attendanceRate: number | null;
}

export interface ClassTeacherSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

export interface ClassDetails {
  class: Class;
  teacher: ClassTeacherSummary | null;
  enrollments: ClassEnrollmentDetail[];
  assignments: Assignment[];
  announcements: Announcement[];
  recentAttendance: ClassAttendanceDetail[];
  stats: ClassStats;
}

export interface ClassDetailsResponse {
  data: ClassDetails;
}

