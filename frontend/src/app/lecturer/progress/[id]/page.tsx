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

export default function LecturerProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [classId, setClassId] = useState('');
  const [data, setData] = useState<any>(null);
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

        const response = await api.get(`/classes/${classId}/progress`, {
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
  }, [classId]);

  return (
    <ProtectedRoute allowedRoles={['LECTURER']}>
      <DashboardShell>
        <PageCard
          title="Progress Kelas"
          description="Rekap meeting, tugas, dan performa mahasiswa."
        >
          <Link
            href={`/lecturer/classes/${classId}`}
            className="mb-5 inline-flex text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← Kembali ke detail kelas
          </Link>

          {loading && <StatusMessage type="info" text="Loading progress kelas..." />}
          {error && <StatusMessage type="error" text={error} />}

          {data && (
            <div className="space-y-6">
              <SectionCard
                title={`${data.class?.course?.name} - Kelas ${data.class?.className}`}
                subtitle={`${data.class?.academicYear} · ${data.class?.semesterType}`}
              >
                <InfoGrid
                  items={[
                    {
                      label: 'Total Mahasiswa',
                      value: data.summary?.totalStudents ?? 0,
                    },
                    {
                      label: 'Total Meeting',
                      value: data.summary?.totalMeetings ?? 0,
                    },
                    {
                      label: 'Total Materi',
                      value: data.summary?.totalMaterials ?? 0,
                    },
                    {
                      label: 'Total Tugas',
                      value: data.summary?.totalAssignments ?? 0,
                    },
                    {
                      label: 'Total Submission',
                      value: data.summary?.totalSubmissions ?? 0,
                    },
                    {
                      label: 'Dosen',
                      value: data.class?.lecturer?.user?.name || '-',
                    },
                  ]}
                />
              </SectionCard>

              <SectionCard
                title="Rekap Meeting"
                subtitle="Ringkasan kehadiran, materi, dan tugas per meeting."
              >
                <div className="grid gap-3">
                  {data.meetings?.map((meeting: any) => (
                    <div
                      key={meeting.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            Pertemuan {meeting.meetingNumber} - {meeting.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {meeting.topic || 'Tanpa topik'}
                          </p>
                        </div>
                        <p className="text-sm text-slate-500">
                          {new Date(meeting.date).toLocaleDateString('id-ID')}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Entry</p>
                          <p className="mt-1 font-medium">{meeting.attendance?.entryCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Exit</p>
                          <p className="mt-1 font-medium">{meeting.attendance?.exitCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Materi</p>
                          <p className="mt-1 font-medium">{meeting.materialsCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Tugas</p>
                          <p className="mt-1 font-medium">{meeting.assignmentsCount ?? 0}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!loading && data.meetings?.length === 0 && (
                    <EmptyState text="Belum ada rekap meeting." />
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="Rekap Tugas"
                subtitle="Submission dan rata-rata nilai per tugas."
              >
                <div className="grid gap-3">
                  {data.assignments?.map((assignment: any) => (
                    <div
                      key={assignment.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {assignment.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Deadline {new Date(assignment.dueDate).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Submission</p>
                          <p className="mt-1 font-medium">{assignment.submissionsCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Reviewed</p>
                          <p className="mt-1 font-medium">{assignment.reviewedCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Rata-rata</p>
                          <p className="mt-1 font-medium">
                            {assignment.averageScore ?? '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!loading && data.assignments?.length === 0 && (
                    <EmptyState text="Belum ada rekap tugas." />
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="Progress Mahasiswa"
                subtitle="Kehadiran dan performa tugas tiap mahasiswa."
              >
                <div className="grid gap-3">
                  {data.students?.map((studentRow: any, index: number) => (
                    <div
                      key={studentRow.student?.id || index}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {studentRow.student?.user?.name || '-'}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {studentRow.student?.nim || '-'} · {studentRow.student?.user?.email || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-6">
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Entry</p>
                          <p className="mt-1 font-medium">{studentRow.attendance?.entryCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Exit</p>
                          <p className="mt-1 font-medium">{studentRow.attendance?.exitCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Submitted</p>
                          <p className="mt-1 font-medium">{studentRow.assignments?.submittedCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Reviewed</p>
                          <p className="mt-1 font-medium">{studentRow.assignments?.reviewedCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Pending</p>
                          <p className="mt-1 font-medium">{studentRow.assignments?.pendingCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3">
                          <p className="text-xs text-slate-400">Avg Score</p>
                          <p className="mt-1 font-medium">{studentRow.assignments?.averageScore ?? '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!loading && data.students?.length === 0 && (
                    <EmptyState text="Belum ada data mahasiswa." />
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
