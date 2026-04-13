'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageCard } from '@/components/ui/page-card';
import { SectionCard } from '@/components/ui/section-card';
import { InfoGrid } from '@/components/ui/info-grid';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusMessage } from '@/components/ui/status-message';

export default function StudentProgressPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Token tidak ditemukan. Silakan login ulang.');
          return;
        }

        const response = await api.get('/students/me/progress', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setData(response.data);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardShell>
        <PageCard
          title="Progress Saya"
          description="Rekap kehadiran dan tugas pada kelas yang kamu ambil."
        >
          <Link
            href="/student/classes"
            className="mb-5 inline-flex text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← Kembali ke kelas saya
          </Link>

          {loading && <StatusMessage type="info" text="Loading progress..." />}
          {error && <StatusMessage type="error" text={error} />}

          {data && (
            <div className="space-y-6">
              <SectionCard
                title={data.student?.user?.name || 'Mahasiswa'}
                subtitle={`${data.student?.nim || '-'} · ${data.student?.studyProgram || '-'}`}
              >
                <InfoGrid
                  items={[
                    {
                      label: 'Email',
                      value: data.student?.user?.email || '-',
                    },
                    {
                      label: 'Fakultas',
                      value: data.student?.faculty || '-',
                    },
                    {
                      label: 'Tahun Masuk',
                      value: data.student?.yearEntry || '-',
                    },
                    {
                      label: 'Program Studi',
                      value: data.student?.studyProgram || '-',
                    },
                  ]}
                />
              </SectionCard>

              <SectionCard
                title="Progress per Kelas"
                subtitle="Ringkasan kehadiran dan tugas pada setiap kelas."
              >
                <div className="grid gap-4">
                  {data.classes?.map((classRow: any, index: number) => (
                    <div
                      key={classRow.class?.id || index}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {classRow.class?.course?.name} - Kelas {classRow.class?.className}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {classRow.class?.academicYear} · {classRow.class?.semesterType}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Dosen: {classRow.class?.lecturer?.user?.name || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-6">
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Meeting</p>
                          <p className="mt-1 font-medium">{classRow.attendance?.totalMeetings ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Entry</p>
                          <p className="mt-1 font-medium">{classRow.attendance?.entryCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Exit</p>
                          <p className="mt-1 font-medium">{classRow.attendance?.exitCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Tugas</p>
                          <p className="mt-1 font-medium">{classRow.assignments?.totalAssignments ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Submitted</p>
                          <p className="mt-1 font-medium">{classRow.assignments?.submittedCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Avg Score</p>
                          <p className="mt-1 font-medium">{classRow.assignments?.averageScore ?? '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!loading && data.classes?.length === 0 && (
                    <EmptyState text="Belum ada data progress kelas." />
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
