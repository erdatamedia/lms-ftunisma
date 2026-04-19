'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { StatusMessage } from '@/components/ui/status-message';

function ProgressBar({ value, total, color = 'green' }: { value: number; total: number; color?: 'green' | 'blue' | 'amber' }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const colorMap = { green: 'bg-green-500', blue: 'bg-blue-500', amber: 'bg-amber-500' };
  const bgColor = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{value}/{total}</span>
        <span className="font-semibold text-slate-700">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all ${color === 'blue' ? 'bg-blue-500' : bgColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

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
          headers: { Authorization: `Bearer ${token}` },
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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Progress Saya</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Rekap kehadiran dan tugas pada kelas yang kamu ambil.
              </p>
            </div>
            <Link
              href="/student/classes"
              className="flex-shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              ← Kelas Saya
            </Link>
          </div>

          {loading && <StatusMessage type="info" text="Loading progress..." />}
          {error && <StatusMessage type="error" text={error} />}

          {data && (
            <div className="space-y-5">
              {/* Profil mahasiswa */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-bold text-white">
                    {(data.student?.user?.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold text-slate-900">
                      {data.student?.user?.name || '-'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {data.student?.nim || '-'} · {data.student?.studyProgram || '-'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {data.student?.faculty || '-'} · Angkatan {data.student?.yearEntry || '-'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="mt-1 truncate text-sm font-medium text-slate-800">
                      {data.student?.user?.email || '-'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Program Studi</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {data.student?.studyProgram || '-'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Fakultas</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {data.student?.faculty || '-'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Tahun Masuk</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {data.student?.yearEntry || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress per kelas */}
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Progress per Kelas
                </h2>

                <div className="space-y-4">
                  {data.classes?.map((classRow: any, index: number) => {
                    const totalMeetings = classRow.attendance?.totalMeetings || 0;
                    const entryCount = classRow.attendance?.entryCount || 0;
                    const exitCount = classRow.attendance?.exitCount || 0;
                    const totalAssignments = classRow.assignments?.totalAssignments || 0;
                    const submittedCount = classRow.assignments?.submittedCount || 0;
                    const avgScore = classRow.assignments?.averageScore;

                    return (
                      <div
                        key={classRow.class?.id || index}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        {/* Kelas header */}
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {classRow.class?.course?.name} — Kelas {classRow.class?.className}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {classRow.class?.academicYear} · {classRow.class?.semesterType} ·{' '}
                              {classRow.class?.lecturer?.user?.name || '-'}
                            </p>
                          </div>
                          {avgScore != null && (
                            <div className="rounded-xl bg-green-50 px-3 py-2 text-center">
                              <p className="text-xs text-green-600">Rata-rata Nilai</p>
                              <p className="text-xl font-bold text-green-700">{avgScore}</p>
                            </div>
                          )}
                        </div>

                        {/* Metrics grid */}
                        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                          <MetricCard label="Meeting" value={totalMeetings} />
                          <MetricCard label="Entry" value={entryCount} />
                          <MetricCard label="Exit" value={exitCount} />
                          <MetricCard label="Tugas" value={totalAssignments} />
                          <MetricCard label="Submitted" value={submittedCount} />
                          <MetricCard label="Avg Score" value={avgScore ?? '-'} />
                        </div>

                        {/* Progress bars */}
                        <div className="mt-4 space-y-3">
                          {totalMeetings > 0 && (
                            <div>
                              <p className="mb-1.5 text-xs font-medium text-slate-600">
                                Kehadiran Entry
                              </p>
                              <ProgressBar value={entryCount} total={totalMeetings} />
                            </div>
                          )}
                          {totalAssignments > 0 && (
                            <div>
                              <p className="mb-1.5 text-xs font-medium text-slate-600">
                                Pengumpulan Tugas
                              </p>
                              <ProgressBar value={submittedCount} total={totalAssignments} color="blue" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {!loading && data.classes?.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center">
                      <p className="text-sm text-slate-400">Belum ada data progress kelas.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
