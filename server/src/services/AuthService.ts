import { Context, Effect, Layer, Schema } from "effect";
import { sign, verify } from "hono/jwt";
import { AuthUser, AccessTokenPayload, RefreshTokenPayload } from "shared/dist";
import { DatabaseError, UnauthorizedError } from "shared/dist";
import { AUTH_CONFIG } from "../config/auth";
import { TeacherRepo } from "./TeacherRepo";

function generateSecurePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export class AuthService extends Context.Service<AuthService, {
  readonly generateAccessToken: (user: AuthUser) => Effect.Effect<string, DatabaseError>;
  readonly generateRefreshToken: (userId: string, userType: "teacher" | "student", tokenId: string) => Effect.Effect<string, DatabaseError>;
  readonly verifyAccessToken: (token: string) => Effect.Effect<AccessTokenPayload, UnauthorizedError>;
  readonly verifyRefreshToken: (token: string) => Effect.Effect<RefreshTokenPayload, UnauthorizedError>;
  readonly initializeAdminUser: () => Effect.Effect<void, DatabaseError>;
}>()("server/AuthService") {
  static readonly layer = Layer.effect(
    AuthService,
    Effect.gen(function*() {
      const teacherRepo = yield* TeacherRepo;

      const generateAccessToken = Effect.fn("AuthService.generateAccessToken")(function*(user: AuthUser) {
        const payload: AccessTokenPayload = {
          user,
          type: "access",
          exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
          iat: Math.floor(Date.now() / 1000)
        };

        return yield* Effect.tryPromise({
          try: () => sign(payload, AUTH_CONFIG.ACCESS_TOKEN_SECRET),
          catch: (e) => new DatabaseError({ message: "Failed to sign access token", cause: e })
        });
      });

      const generateRefreshToken = Effect.fn("AuthService.generateRefreshToken")(function*(
        userId: string,
        userType: "teacher" | "student",
        tokenId: string
      ) {
        const payload: RefreshTokenPayload = {
          userId,
          userType,
          tokenId,
          type: "refresh",
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
          iat: Math.floor(Date.now() / 1000)
        };

        return yield* Effect.tryPromise({
          try: () => sign(payload, AUTH_CONFIG.REFRESH_TOKEN_SECRET),
          catch: (e) => new DatabaseError({ message: "Failed to sign refresh token", cause: e })
        });
      });

      const verifyAccessToken = Effect.fn("AuthService.verifyAccessToken")(function*(token: string) {
        return yield* Effect.tryPromise({
          try: async () => {
            const decoded = await verify(token, AUTH_CONFIG.ACCESS_TOKEN_SECRET, "HS256");
            return Schema.decodeUnknownSync(AccessTokenPayload)(decoded);
          },
          catch: () => new UnauthorizedError({ message: "Invalid or expired access token" })
        });
      });

      const verifyRefreshToken = Effect.fn("AuthService.verifyRefreshToken")(function*(token: string) {
        return yield* Effect.tryPromise({
          try: async () => {
            const decoded = await verify(token, AUTH_CONFIG.REFRESH_TOKEN_SECRET, "HS256");
            return Schema.decodeUnknownSync(RefreshTokenPayload)(decoded);
          },
          catch: () => new UnauthorizedError({ message: "Invalid or expired refresh token" })
        });
      });

      const initializeAdminUser = Effect.fn("AuthService.initializeAdminUser")(function*() {
        const adminEmail = AUTH_CONFIG.ADMIN_EMAIL;
        const adminPassword = AUTH_CONFIG.ADMIN_PASSWORD || generateSecurePassword();

        const existingAdmin = yield* teacherRepo.findByEmail(adminEmail);
        if (existingAdmin) {
          return;
        }

        yield* teacherRepo.create({
          email: adminEmail,
          password: adminPassword,
          first_name: "Admin",
          last_name: "User",
          role: "admin"
        });

        console.log("Admin user created successfully:");
        console.log(`Email: ${adminEmail}`);
        if (!AUTH_CONFIG.ADMIN_PASSWORD) {
          console.log(`Password: ${adminPassword}`);
        }
      });

      return AuthService.of({
        generateAccessToken,
        generateRefreshToken,
        verifyAccessToken,
        verifyRefreshToken,
        initializeAdminUser
      });
    })
  );
}
