import type { JWTPayload } from 'hono/utils/jwt/types';
import type {
  AuthUser,
  AccessTokenPayload as SharedAccessTokenPayload,
  RefreshTokenPayload as SharedRefreshTokenPayload
} from 'shared/src/types/auth';

export type {
  AuthUser,
  LoginCredentials,
  RegistrationData,
  LoginResponse,
  AuthResponse,
  RefreshResponse
} from 'shared/src/types/auth';

export interface AccessTokenPayload extends SharedAccessTokenPayload, JWTPayload {}
export interface RefreshTokenPayload extends SharedRefreshTokenPayload, JWTPayload {}

export interface AuthVariables {
  user?: AuthUser;
  jwtPayload?: AccessTokenPayload;
  requestId?: string;
}

export interface RequiredAuthVariables {
  user: AuthUser;
  jwtPayload: AccessTokenPayload;
  requestId: string;
}
