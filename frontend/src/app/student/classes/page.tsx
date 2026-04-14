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
import { AlertBanner } from '@/components/ui/alert-banner';
import { SimpleDataTable } from '@/components/ui/simple-data-table';

export default function StudentClassesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const fetchClasses = async () => {
    if (!accessToken) return;

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

  useEffect(() => {
    if (!isHydrated || !user || !accessToken) return;
    fetchClasses();
  }, [isHydrated, user, accessToken]);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !accessToken) return;

    try {
      setJoining(true);
      setError('');
      setSuccess('');

      await api.post(
        '/enrollments/join',
        {
          enrollmentCode: joinCode.trim().toUpperCase(),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      setJoinCode('');
      setSuccess('Berhasil bergabung ke kelas.');
      await fetchClasses();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setJoining(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardShell>
        <PageCard
          title="Kelas Mahasiswa"
          description="Masukkan kode enroll untuk bergabung ke kelas lalu akses semua kelas yang kamu ambil."
        >
          <form
            onSubmit={handleJoinClass}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Kode Enroll Kelas
                </label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: A1B2C3D4"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 uppercase tracking-[0.2em]"
                  maxLength={20}
                />
              </div>

              <button
                type="submit"
                disabled={joining || !joinCode.trim()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {joining ? 'Memproses...' : 'Gabung Kelas'}
              </button>
            </div>

            <p className="mt-3 text-sm text-slate-500">
              Minta kode enroll dari dosen atau admin kelas, lalu masukkan di sini.
            </p>
          </form>

          {success && (
            <div className="mt-4">
              <AlertBanner
                type="success"
                text={success}
                onClose={() => setSuccess('')}
              />
            </div>
          )}

          {loading && <StatusMessage type="info" text="Loading kelas..." />}
          {error && (
            <div className="mt-4">
              <AlertBanner
                type="error"
                text={error}
                onClose={() => setError('')}
              />
            </div>
          )}

          <div className="mt-6">
            {!loading && !error && items.length === 0 ? (
              <EmptyState text="Belum ada kelas. Gunakan kode enroll untuk bergabung." />
            ) : (
              <SimpleDataTable<any>
                rows={items}
                searchPlaceholder="Cari mata kuliah, kelas, dosen, atau status"
                emptyText="Tidak ada kelas yang sesuai dengan pencarian."
                columns={[
                  {
                    key: 'course',
                    header: 'Mata Kuliah',
                    searchableValue: (item) =>
                      `${item.course?.code || ''} ${item.course?.name || ''} ${item.className || ''}`,
                    render: (item) => (
                      <div>
                        <p className="font-medium text-slate-900">
                          {item.course?.name || '-'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.course?.code || 'No Code'} · Kelas {item.className}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: 'period',
                    header: 'Periode',
                    searchableValue: (item) =>
                      `${item.academicYear || ''} ${item.semesterType || ''}`,
                    render: (item) => (
                      <div>
                        <p>{item.academicYear || '-'}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.semesterType || '-'}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: 'lecturer',
                    header: 'Dosen',
                    searchableValue: (item) => item.lecturer?.user?.name || '',
                    render: (item) => item.lecturer?.user?.name || '-',
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    searchableValue: (item) => item.enrollments?.[0]?.status || 'ACTIVE',
                    render: (item) => (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {item.enrollments?.[0]?.status || 'ACTIVE'}
                      </span>
                    ),
                  },
                  {
                    key: 'action',
                    header: 'Aksi',
                    className: 'w-32',
                    render: (item) => (
                      <Link
                        href={`/student/classes/${item.id}`}
                        className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white"
                      >
                        Buka Kelas
                      </Link>
                    ),
                  },
                ]}
              />
            )}
          </div>
        </PageCard>
      </DashboardShell>
    </ProtectedRoute>
  );
}
