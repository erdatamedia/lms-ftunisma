'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { useAuthStore } from '@/store/auth';
import { PageCard } from '@/components/ui/page-card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusMessage } from '@/components/ui/status-message';

export default function StudentClassesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated || !user || !accessToken) return;

    const run = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await api.get('/classes', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setItems(data);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [isHydrated, user, accessToken]);

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardShell>
        <PageCard
          title="Kelas Mahasiswa"
          description="Menampilkan kelas yang kamu ambil."
        >
          {loading && <StatusMessage type="info" text="Loading kelas..." />}
          {error && <StatusMessage type="error" text={error} />}

          <div className="mt-6 grid gap-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/student/classes/${item.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {item.course?.name} - Kelas {item.className}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.academicYear} · {item.semesterType}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {item.course?.code || 'No Code'}
                  </span>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Dosen
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {item.lecturer?.user?.name || '-'}
                  </p>
                </div>
              </Link>
            ))}

            {!loading && !error && items.length === 0 && (
              <EmptyState text="Belum ada kelas." />
            )}
          </div>
        </PageCard>
      </DashboardShell>
    </ProtectedRoute>
  );
}
