// shared/src/types/auth.ts
import { Schema } from "effect";

export class AuthUser extends Schema.Class<AuthUser>("AuthUser")({
  id: Schema.String,
  email: Schema.String,
  firstName: Schema.optional(Schema.String),
  lastName: Schema.optional(Schema.String),
  role: Schema.Literals(["teacher", "student", "admin"]),
  userType: Schema.Literals(["teacher", "student"]),
  gradeLevel: Schema.optional(Schema.Int),
}) {}

export class AccessTokenPayload extends Schema.Class<AccessTokenPayload>("AccessTokenPayload")({
  user: AuthUser,
  type: Schema.Literal("access"),
  exp: Schema.optional(Schema.Int),
  iat: Schema.optional(Schema.Int),
}) {}

export class RefreshTokenPayload extends Schema.Class<RefreshTokenPayload>("RefreshTokenPayload")({
  userId: Schema.String,
  userType: Schema.Literals(["teacher", "student"]),
  tokenId: Schema.String,
  type: Schema.Literal("refresh"),
  exp: Schema.optional(Schema.Int),
  iat: Schema.optional(Schema.Int),
}) {}

export class LoginCredentials extends Schema.Class<LoginCredentials>("LoginCredentials")({
  email: Schema.String,
  password: Schema.String,
}) {}

export class RegistrationData extends Schema.Class<RegistrationData>("RegistrationData")({
  email: Schema.String,
  password: Schema.String,
  first_name: Schema.String,
  last_name: Schema.String,
}) {}

export class LoginResponse extends Schema.Class<LoginResponse>("LoginResponse")({
  user: AuthUser,
  accessToken: Schema.String,
  message: Schema.optional(Schema.String),
}) {}

export class AuthResponse extends Schema.Class<AuthResponse>("AuthResponse")({
  user: AuthUser,
  message: Schema.optional(Schema.String),
}) {}

export class RefreshResponse extends Schema.Class<RefreshResponse>("RefreshResponse")({
  accessToken: Schema.String,
  user: AuthUser,
  message: Schema.optional(Schema.String),
}) {}
