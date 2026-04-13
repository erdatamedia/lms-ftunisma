export type UserRole = 'ADMIN' | 'LECTURER' | 'STUDENT';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  student?: any | null;
  lecturer?: any | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
