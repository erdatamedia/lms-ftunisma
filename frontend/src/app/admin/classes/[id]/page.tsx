'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { MeetingSection } from '@/components/meetings/meeting-section';
import { PageCard } from '@/components/ui/page-card';
import { SectionCard } from '@/components/ui/section-card';
import { InfoGrid } from '@/components/ui/info-grid';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusMessage } from '@/components/ui/status-message';

export default function AdminClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [classId, setClassId] = useState('');
  const [item, setItem] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((resolved) => {
      setClassId(resolved.id);
    });
  }, [params]);

  useEffect(() => {
    if (!classId) return;

    const run = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Token tidak ditemukan. Silakan login ulang.');
          return;
        }

        const { data } = await api.get(`/classes/${classId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setItem(data);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [classId]);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardShell>
        <PageCard
          title="Detail Kelas"
          description="Informasi lengkap kelas untuk admin."
          action={
            classId ? (
              <Link
                href={`/admin/progress/${classId}`}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Lihat Progress
              </Link>
            ) : null
          }
        >
          <Link
            href="/admin/classes"
            className="mb-5 inline-flex text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← Kembali ke daftar kelas
          </Link>

          {loading && <StatusMessage type="info" text="Loading detail kelas..." />}
          {error && <StatusMessage type="error" text={error} />}

          {item && (
            <div className="space-y-6">
              <SectionCard
                title={`${item.course?.name} - Kelas ${item.className}`}
                subtitle={`${item.academicYear} · ${item.semesterType}`}
              >
                <InfoGrid
                  items={[
                    {
                      label: 'Dosen',
                      value: item.lecturer?.user?.name || '-',
                    },
                    {
                      label: 'Email Dosen',
                      value: item.lecturer?.user?.email || '-',
                    },
                    {
                      label: 'Jumlah Mahasiswa',
                      value: `${item.enrollments?.length || 0} orang`,
                    },
                    {
                      label: 'Kode Mata Kuliah',
                      value: item.course?.code || '-',
                    },
                  ]}
                />
              </SectionCard>

              {classId && <MeetingSection classId={classId} canCreate />}

              <SectionCard
                title="Daftar Mahasiswa"
                subtitle="Mahasiswa yang terdaftar di kelas ini."
              >
                <div className="grid gap-3">
                  {item?.enrollments?.map((enrollment: any) => (
                    <div
                      key={enrollment.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="font-medium text-slate-900">
                        {enrollment.student?.user?.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {enrollment.student?.nim}
                      </p>
                      <p className="text-sm text-slate-500">
                        {enrollment.student?.user?.email}
                      </p>
                    </div>
                  ))}

                  {!loading && item?.enrollments?.length === 0 && (
                    <EmptyState text="Belum ada mahasiswa." />
                  )}
                </div>
              </SectionCard>
            </div>
          )}
        </PageCard>
      </DashboardShell>
    </ProtectedRoute>
  );
}
