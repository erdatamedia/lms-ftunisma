'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';

function MiniProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const color = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{value}/{total}</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ProgressBar({ value, total, color = 'auto' }: { value: number; total: number; color?: 'auto' | 'blue' }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const autoColor = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const barColor = color === 'blue' ? 'bg-blue-500' : autoColor;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{value}/{total}</span>
        <span className="font-semibold text-slate-700">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

type FilterMode = 'all' | 'low_attendance' | 'missing_assignments';

export default function LecturerProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [classId, setClassId] = useState('');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'attendance' | 'score'>('name');

  useEffect(() => {
    params.then((resolved) => setClassId(resolved.id));
  }, [params]);

  useEffect(() => {
    if (!classId) return;
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('accessToken');
        if (!token) { setError('Token tidak ditemukan. Silakan login ulang.'); return; }
        const response = await api.get(`/classes/${classId}/progress`, {
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
  }, [classId]);

  const totalMeetings = data?.summary?.totalMeetings ?? 0;
  const totalAssignments = data?.summary?.totalAssignments ?? 0;

  const processedStudents = useMemo(() => {
    if (!data?.students) return [];
    const normalizedSearch = search.trim().toLowerCase();

    let list = data.students.filter((s: any) => {
      const name = (s.student?.user?.name || '').toLowerCase();
      const nim = (s.student?.nim || '').toLowerCase();
      if (normalizedSearch && !name.includes(normalizedSearch) && !nim.includes(normalizedSearch)) {
        return false;
      }
      if (filter === 'low_attendance') {
        const entryCount = s.attendance?.entryCount ?? 0;
        const pct = totalMeetings > 0 ? (entryCount / totalMeetings) * 100 : 0;
        return pct < 75;
      }
      if (filter === 'missing_assignments') {
        const submitted = s.assignments?.submittedCount ?? 0;
        return submitted < totalAssignments;
      }
      return true;
    });

    list.sort((a: any, b: any) => {
      if (sortBy === 'name') {
        return (a.student?.user?.name || '').localeCompare(b.student?.user?.name || '');
      }
      if (sortBy === 'attendance') {
        const pctA = totalMeetings > 0 ? (a.attendance?.entryCount ?? 0) / totalMeetings : 0;
        const pctB = totalMeetings > 0 ? (b.attendance?.entryCount ?? 0) / totalMeetings : 0;
        return pctB - pctA;
      }
      if (sortBy === 'score') {
        return (b.assignments?.averageScore ?? 0) - (a.assignments?.averageScore ?? 0);
      }
      return 0;
    });

    return list;
  }, [data, filter, search, sortBy, totalMeetings, totalAssignments]);

  const filterTabs: { key: FilterMode; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'low_attendance', label: 'Kehadiran < 75%' },
    { key: 'missing_assignments', label: 'Tugas Belum Lengkap' },
  ];

  return (
    <ProtectedRoute allowedRoles={['LECTURER']}>
      <DashboardShell>
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Progress Kelas</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Rekap kehadiran dan performa tugas tiap mahasiswa.
              </p>
            </div>
            {classId && (
              <Link
                href={`/lecturer/classes/${classId}`}
                className="flex-shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                ← Detail Kelas
              </Link>
            )}
          </div>

          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
              Loading progress kelas...
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {data && (
            <div className="space-y-5">
              {/* Class info */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="font-semibold text-slate-900">
                  {data.class?.course?.name} — Kelas {data.class?.className}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {data.class?.academicYear} · {data.class?.semesterType} ·{' '}
                  {data.class?.lecturer?.user?.name || '-'}
                </p>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                <StatCard label="Mahasiswa" value={data.summary?.totalStudents ?? 0} />
                <StatCard label="Meeting" value={totalMeetings} />
                <StatCard label="Materi" value={data.summary?.totalMaterials ?? 0} />
                <StatCard label="Tugas" value={totalAssignments} />
                <StatCard label="Submission" value={data.summary?.totalSubmissions ?? 0} />
                <StatCard label="Dinilai" value={data.summary?.totalReviewed ?? 0} />
              </div>

              {/* Student progress section */}
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-slate-900">Progress per Mahasiswa</h2>
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="name">Urut: Nama</option>
                      <option value="attendance">Urut: Kehadiran</option>
                      <option value="score">Urut: Nilai</option>
                    </select>
                  </div>
                </div>

                {/* Filter tabs */}
                <div className="mb-3 flex flex-wrap gap-2">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        filter === tab.key
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="mb-4">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama atau NIM..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 sm:max-w-xs"
                  />
                </div>

                {processedStudents.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center">
                    <p className="text-sm text-slate-400">
                      {data.students?.length === 0
                        ? 'Belum ada data mahasiswa.'
                        : 'Tidak ada mahasiswa yang sesuai filter.'}
                    </p>
                  </div>
                )}

                {processedStudents.length > 0 && (
                  <>
                    {/* Mobile cards */}
                    <div className="space-y-3 md:hidden">
                      {processedStudents.map((studentRow: any, index: number) => {
                        const entryCount = studentRow.attendance?.entryCount ?? 0;
                        const exitCount = studentRow.attendance?.exitCount ?? 0;
                        const submittedCount = studentRow.assignments?.submittedCount ?? 0;
                        const avgScore = studentRow.assignments?.averageScore;

                        return (
                          <div
                            key={studentRow.student?.id || index}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                                {(studentRow.student?.user?.name || '?')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-slate-900">
                                  {studentRow.student?.user?.name || '-'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {studentRow.student?.nim || '-'}
                                </p>
                              </div>
                              {avgScore != null && (
                                <div className="flex-shrink-0 rounded-xl bg-green-50 px-2.5 py-1.5 text-center">
                                  <p className="text-xs text-green-600">Nilai</p>
                                  <p className="text-base font-bold text-green-700">{avgScore}</p>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="rounded-lg bg-slate-50 p-2">
                                <p className="text-slate-400">Entry</p>
                                <p className="mt-0.5 font-bold text-slate-900">{entryCount}</p>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2">
                                <p className="text-slate-400">Exit</p>
                                <p className="mt-0.5 font-bold text-slate-900">{exitCount}</p>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-2">
                                <p className="text-slate-400">Tugas</p>
                                <p className="mt-0.5 font-bold text-slate-900">{submittedCount}/{totalAssignments}</p>
                              </div>
                            </div>

                            {totalMeetings > 0 && (
                              <div className="mt-3">
                                <p className="mb-1 text-xs font-medium text-slate-600">Kehadiran Entry</p>
                                <ProgressBar value={entryCount} total={totalMeetings} />
                              </div>
                            )}
                            {totalAssignments > 0 && (
                              <div className="mt-2">
                                <p className="mb-1 text-xs font-medium text-slate-600">Pengumpulan Tugas</p>
                                <ProgressBar value={submittedCount} total={totalAssignments} color="blue" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            {['Mahasiswa', 'Kehadiran Entry', 'Kehadiran Exit', 'Pengumpulan Tugas', 'Avg Nilai'].map((h) => (
                              <th
                                key={h}
                                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {processedStudents.map((studentRow: any, index: number) => {
                            const entryCount = studentRow.attendance?.entryCount ?? 0;
                            const exitCount = studentRow.attendance?.exitCount ?? 0;
                            const submittedCount = studentRow.assignments?.submittedCount ?? 0;
                            const avgScore = studentRow.assignments?.averageScore;

                            return (
                              <tr key={studentRow.student?.id || index} className="transition hover:bg-slate-50">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                                      {(studentRow.student?.user?.name || '?')[0].toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {studentRow.student?.user?.name || '-'}
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        {studentRow.student?.nim || '-'}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 w-36">
                                  {totalMeetings > 0 ? (
                                    <MiniProgressBar value={entryCount} total={totalMeetings} />
                                  ) : (
                                    <span className="text-xs text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 w-36">
                                  {totalMeetings > 0 ? (
                                    <MiniProgressBar value={exitCount} total={totalMeetings} />
                                  ) : (
                                    <span className="text-xs text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 w-36">
                                  {totalAssignments > 0 ? (
                                    <div className="space-y-0.5">
                                      <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>{submittedCount}/{totalAssignments}</span>
                                        <span className="font-semibold">
                                          {Math.round((submittedCount / totalAssignments) * 100)}%
                                        </span>
                                      </div>
                                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                        <div
                                          className="h-full rounded-full bg-blue-500"
                                          style={{
                                            width: `${Math.round((submittedCount / totalAssignments) * 100)}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {avgScore != null ? (
                                    <span className="rounded-lg bg-green-50 px-2.5 py-1 text-sm font-bold text-green-700">
                                      {avgScore}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-400">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Meeting summary */}
              {data.meetings?.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold text-slate-900">Rekap Meeting</h2>
                  <div className="space-y-3">
                    {data.meetings.map((meeting: any) => (
                      <div
                        key={meeting.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">
                              Pertemuan {meeting.meetingNumber}
                              {meeting.title ? ` — ${meeting.title}` : ''}
                            </p>
                            {meeting.topic && (
                              <p className="mt-0.5 text-xs text-slate-500">{meeting.topic}</p>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {meeting.date
                              ? new Date(meeting.date).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '-'}
                          </p>
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                          {[
                            { label: 'Entry', value: meeting.attendance?.entryCount ?? 0 },
                            { label: 'Exit', value: meeting.attendance?.exitCount ?? 0 },
                            { label: 'Materi', value: meeting.materialsCount ?? 0 },
                            { label: 'Tugas', value: meeting.assignmentsCount ?? 0 },
                          ].map((m) => (
                            <div key={m.label} className="rounded-lg bg-slate-50 p-2">
                              <p className="text-slate-400">{m.label}</p>
                              <p className="mt-0.5 font-bold text-slate-900">{m.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
