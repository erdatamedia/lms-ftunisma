'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.replace('/login');
  };

  const navItems =
    user?.role === 'ADMIN'
      ? [
          { href: '/admin/classes', label: 'Kelola Kelas' },
          { href: '/admin/courses', label: 'Kelola Mata Kuliah' },
          { href: '/admin/users', label: 'Kelola Akun' },
          { href: '/admin/enrollments', label: 'Kelola Enroll Mahasiswa' },
        ]
      : user?.role === 'LECTURER'
      ? [
          { href: '/lecturer/classes', label: 'Kelas Saya' },
          { href: '/lecturer/classes', label: 'Progress Kelas' },
        ]
      : [
          { href: '/student/classes', label: 'Kelas Saya' },
          { href: '/student/progress', label: 'Progress Saya' },
        ];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">LMS UNISMA</h1>
            <p className="text-sm text-slate-500">
              {user?.name} · {user?.role}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-6">
        <aside className="col-span-12 md:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Navigasi
            </p>

            <nav className="space-y-2">
              <Link
                className={`block rounded-xl px-3 py-2 text-sm transition ${
                  pathname === '/dashboard'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                href="/dashboard"
              >
                Dashboard
              </Link>

              {navItems.map((item, index) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={`${item.href}-${index}`}
                    className={`block rounded-xl px-3 py-2 text-sm transition ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="col-span-12 space-y-6 md:col-span-9">{children}</main>
      </div>
    </div>
  );
}
