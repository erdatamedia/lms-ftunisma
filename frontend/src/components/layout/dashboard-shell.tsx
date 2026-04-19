'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function IconBook({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function IconUserPlus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
    </svg>
  );
}

function IconGraduate({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
  );
}

interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.replace('/login');
  };

  const allNavItems: NavItem[] =
    user?.role === 'ADMIN'
      ? [
          { href: '/dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: IconHome },
          { href: '/admin/classes', label: 'Kelola Kelas', shortLabel: 'Kelas', icon: IconBuilding },
          { href: '/admin/courses', label: 'Kelola Mata Kuliah', shortLabel: 'Courses', icon: IconBook },
          { href: '/admin/users', label: 'Kelola Akun', shortLabel: 'Akun', icon: IconUsers },
          { href: '/admin/enrollments', label: 'Kelola Enroll', shortLabel: 'Enroll', icon: IconUserPlus },
        ]
      : user?.role === 'LECTURER'
      ? [
          { href: '/dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: IconHome },
          { href: '/lecturer/classes', label: 'Kelas Saya', shortLabel: 'Kelas', icon: IconBook },
          { href: '/lecturer/classes', label: 'Progress Kelas', shortLabel: 'Progress', icon: IconChart },
        ]
      : [
          { href: '/dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: IconHome },
          { href: '/student/classes', label: 'Kelas Saya', shortLabel: 'Kelas', icon: IconBook },
          { href: '/student/progress', label: 'Progress Saya', shortLabel: 'Progress', icon: IconChart },
        ];

  // Bottom nav: admin gets 4 items (skip Courses), others get 3
  const bottomNavItems =
    user?.role === 'ADMIN'
      ? [
          { href: '/dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: IconHome },
          { href: '/admin/classes', label: 'Kelola Kelas', shortLabel: 'Kelas', icon: IconBuilding },
          { href: '/admin/users', label: 'Kelola Akun', shortLabel: 'Akun', icon: IconUsers },
          { href: '/admin/enrollments', label: 'Kelola Enroll', shortLabel: 'Enroll', icon: IconUserPlus },
        ]
      : allNavItems.slice(0, 3);

  const roleLabel =
    user?.role === 'ADMIN' ? 'Administrator' : user?.role === 'LECTURER' ? 'Dosen' : 'Mahasiswa';

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col border-r border-slate-200 bg-white">
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900">
            <IconGraduate className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">LMS UNISMA</p>
            <p className="text-xs text-slate-500">{roleLabel}</p>
          </div>
        </div>

        {/* User info */}
        <div className="border-b border-slate-100 px-5 py-3">
          <p className="truncate text-xs font-semibold text-slate-800">{user?.name}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {allNavItems.map((item, i) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={`${item.href}-${i}`}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-200 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <IconLogout className="h-4 w-4 flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Content area (offset on desktop) ── */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900">
              <IconGraduate className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">LMS UNISMA</p>
              <p className="max-w-[160px] truncate text-xs text-slate-500">{user?.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Logout
          </button>
        </header>

        {/* Desktop sub-header */}
        <header className="sticky top-0 z-20 hidden border-b border-slate-200 bg-white/95 backdrop-blur lg:flex lg:items-center lg:justify-end lg:px-6 lg:py-3">
          <p className="text-sm text-slate-500">
            {user?.name} ·{' '}
            <span className="font-semibold text-slate-800">{roleLabel}</span>
          </p>
        </header>

        {/* Main content */}
        <main className="mx-auto max-w-7xl p-4 pb-24 lg:p-6 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white lg:hidden">
        <div
          className={`grid h-16 ${
            bottomNavItems.length === 4 ? 'grid-cols-4' : 'grid-cols-3'
          }`}
        >
          {bottomNavItems.map((item, i) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={`bn-${item.href}-${i}`}
                href={item.href}
                className="relative flex flex-col items-center justify-center gap-1"
              >
                {active && (
                  <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-b-full bg-slate-900" />
                )}
                <Icon
                  className={`h-5 w-5 ${active ? 'text-slate-900' : 'text-slate-400'}`}
                />
                <span
                  className={`text-[10px] font-medium leading-none ${
                    active ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {item.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
