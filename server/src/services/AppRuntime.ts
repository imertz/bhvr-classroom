import { Layer, ManagedRuntime } from "effect";
import { SqliteClient } from "./SqliteClient";
import { TeacherRepo } from "./TeacherRepo";
import { StudentRepo } from "./StudentRepo";
import { ClassRepo } from "./ClassRepo";
import { EnrollmentRepo } from "./EnrollmentRepo";
import { AssignmentRepo } from "./AssignmentRepo";
import { SubmissionRepo } from "./SubmissionRepo";
import { GradeRepo } from "./GradeRepo";
import { AttendanceRepo } from "./AttendanceRepo";
import { AnnouncementRepo } from "./AnnouncementRepo";
import { AuthRepo } from "./AuthRepo";
import { AuthService } from "./AuthService";

// Base SQLite Layer
export const SqliteLayer = SqliteClient.layer;

// Domain Repositories Layers that depend on SqliteClient
export const TeacherRepoLayer = TeacherRepo.layer.pipe(Layer.provide(SqliteLayer));
export const StudentRepoLayer = StudentRepo.layer.pipe(Layer.provide(SqliteLayer));
export const ClassRepoLayer = ClassRepo.layer.pipe(Layer.provide(SqliteLayer));
export const EnrollmentRepoLayer = EnrollmentRepo.layer.pipe(Layer.provide(SqliteLayer));
export const AssignmentRepoLayer = AssignmentRepo.layer.pipe(Layer.provide(SqliteLayer));
export const SubmissionRepoLayer = SubmissionRepo.layer.pipe(Layer.provide(SqliteLayer));
export const GradeRepoLayer = GradeRepo.layer.pipe(Layer.provide(SqliteLayer));
export const AttendanceRepoLayer = AttendanceRepo.layer.pipe(Layer.provide(SqliteLayer));
export const AnnouncementRepoLayer = AnnouncementRepo.layer.pipe(Layer.provide(SqliteLayer));
export const AuthRepoLayer = AuthRepo.layer.pipe(Layer.provide(SqliteLayer));

// AuthService depends on TeacherRepo
export const AuthServiceLayer = AuthService.layer.pipe(Layer.provide(TeacherRepoLayer));

// Merged AppLayer
export const AppLayer = Layer.mergeAll(
  SqliteLayer,
  TeacherRepoLayer,
  StudentRepoLayer,
  ClassRepoLayer,
  EnrollmentRepoLayer,
  AssignmentRepoLayer,
  SubmissionRepoLayer,
  GradeRepoLayer,
  AttendanceRepoLayer,
  AnnouncementRepoLayer,
  AuthRepoLayer,
  AuthServiceLayer
);

export const appMemoMap = Layer.makeMemoMapUnsafe();

export const appRuntime = ManagedRuntime.make(AppLayer, {
  memoMap: appMemoMap
});
