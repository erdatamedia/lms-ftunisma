import { create } from 'zustand';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'LECTURER' | 'STUDENT';
  lecturer?: any;
  student?: any;
} | null;

type AuthState = {
  accessToken: string | null;
  user: AuthUser;
  isHydrated: boolean;
  setAuth: (accessToken: string, user: AuthUser) => void;
  clearAuth: () => void;
  hydrate: () => void;
};

function safeParseAuthUser(value: string | null): AuthUser {
  if (!value) return null;
  if (value === 'undefined' || value === 'null') return null;

  try {
    return JSON.parse(value);
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
