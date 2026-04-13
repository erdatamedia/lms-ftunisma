'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, accessToken, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    if (!user || !accessToken) {
      router.replace('/login');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/dashboard');
    }
  }, [user, accessToken, isHydrated, allowedRoles, router]);

  if (!isHydrated) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user || !accessToken) {
    return <div className="p-6">Redirecting...</div>;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="p-6">Redirecting...</div>;
  }

  return <>{children}</>;
}
