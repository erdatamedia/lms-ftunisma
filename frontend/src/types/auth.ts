export type UserRole = 'ADMIN' | 'LECTURER' | 'STUDENT';

export interface StudentProfile {
  id: string;
  userId: string;
  nim: string;
  studyProgram?: string | null;
  faculty?: string | null;
  yearEntry?: number | null;
}

export interface LecturerProfile {
  id: string;
  userId: string;
  nidn?: string | null;
  department?: string | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  student?: StudentProfile | null;
  lecturer?: LecturerProfile | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
