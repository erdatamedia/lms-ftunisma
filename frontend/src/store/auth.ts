import { create } from 'zustand';
import { AuthUser } from '../types/auth';

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
  setAuth: (accessToken: string, user: AuthUser | null) => void;
  clearAuth: () => void;
  hydrate: () => void;
};

function safeParseAuthUser(value: string | null): AuthUser | null {
  if (!value) return null;
  if (value === 'undefined' || value === 'null') return null;

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isHydrated: false,

  setAuth: (accessToken, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);

      if (user) {
        localStorage.setItem('authUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('authUser');
      }
    }

    set({
      accessToken,
      user,
      isHydrated: true,
    });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authUser');
    }

    set({
      accessToken: null,
      user: null,
      isHydrated: true,
    });
  },

  hydrate: () => {
    if (typeof window === 'undefined') {
      set({ isHydrated: true });
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    const authUser = localStorage.getItem('authUser');
    const parsedUser = safeParseAuthUser(authUser);

    if (authUser && !parsedUser) {
      localStorage.removeItem('authUser');
    }

    set({
      accessToken,
      user: parsedUser,
      isHydrated: true,
    });
  },
}));
