export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: 'ADMIN' | 'LECTURER' | 'STUDENT';
}
