import type { AuthUser } from "shared/dist";
import { appRuntime } from "../services/AppRuntime";
import { AuthService } from "../services/AuthService";

export async function generateAccessToken(user: AuthUser): Promise<string> {
  return appRuntime.runPromise(
    AuthService.use((auth) => auth.generateAccessToken(user))
  );
}

export async function generateRefreshToken(
  userId: string,
  userType: "teacher" | "student",
  tokenId: string
): Promise<string> {
  return appRuntime.runPromise(
    AuthService.use((auth) => auth.generateRefreshToken(userId, userType, tokenId))
  );
}
