export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'teacher' | 'student' | 'admin';
  userType: 'teacher' | 'student';
  gradeLevel?: number;
}

export interface AccessTokenPayload {
  user: AuthUser;
  type: 'access';
  exp?: number;
  iat?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  userType: 'teacher' | 'student';
  tokenId: string;
  type: 'refresh';
  exp?: number;
  iat?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  message?: string;
}

export interface AuthResponse {
  user: AuthUser;
  message?: string;
}

export interface RefreshResponse {
  accessToken: string;
  user: AuthUser;
  message?: string;
}
