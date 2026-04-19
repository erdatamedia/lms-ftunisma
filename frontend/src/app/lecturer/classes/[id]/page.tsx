'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { MeetingSection } from '@/components/meetings/meeting-section';
import { StatusMessage } from '@/components/ui/status-message';

function EnrollStatusBadge({ status }: { status: string }) {
  const isActive = status === 'ACTIVE';
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {status}
    </span>
  );
}

function StudentList({ enrollments }: { enrollments: any[] }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'nim'>('name');

  const processed = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    let list = normalized
      ? enrollments.filter(
          (e) =>
            (e.student?.user?.name || '').toLowerCase().includes(normalized) ||
            (e.student?.nim || '').toLowerCase().includes(normalized),
        )
      : enrollments;

    list = [...list].sort((a, b) => {
      if (sortBy === 'nim') {
        return (a.student?.nim || '').localeCompare(b.student?.nim || '');
      }
      return (a.student?.user?.name || '').localeCompare(b.student?.user?.name || '');
    });

    return list;
  }, [enrollments, search, sortBy]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          {processed.length} dari {enrollments.length} mahasiswa
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau NIM..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 sm:w-56"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'nim')}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="name">Urut: Nama</option>
            <option value="nim">Urut: NIM</option>
          </select>
        </div>
      </div>

      {processed.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center">
          <p className="text-sm text-slate-400">
            {enrollments.length === 0
              ? 'Belum ada mahasiswa yang terdaftar di kelas ini.'
              : 'Tidak ada mahasiswa yang sesuai pencarian.'}
          </p>
        </div>
      )}

      {processed.length > 0 && (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {processed.map((item, index) => (
              <div
                key={item.id || index}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    {(item.student?.user?.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {item.student?.user?.name || '-'}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">
                      {item.student?.nim || '-'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {item.student?.user?.email || '-'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {item.student?.studyProgram || '-'}
                    </p>
                    <div className="mt-2">
                      <EnrollStatusBadge status={item.status || '-'} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Mahasiswa', 'NIM', 'Email', 'Program Studi', 'Status'].map((h) => (
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
                {processed.map((item, index) => (
                  <tr key={item.id || index} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                          {(item.student?.user?.name || '?')[0].toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {item.student?.user?.name || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-600">
                      {item.student?.nim || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.student?.user?.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.student?.studyProgram || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <EnrollStatusBadge status={item.status || '-'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function LecturerClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [classId, setClassId] = useState('');
  const [item, setItem] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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
        const { data } = await api.get(`/classes/${classId}`, {
          headers: { Authorization: `Bearer ${token}` },
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
    <ProtectedRoute allowedRoles={['LECTURER']}>
      <DashboardShell>
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Detail Kelas</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Kelola meeting, materi, tugas, dan absensi dari sini.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/lecturer/classes"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                ← Daftar Kelas
              </Link>
              {classId && (
                <Link
                  href={`/lecturer/progress/${classId}`}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Lihat Progress
                </Link>
              )}
            </div>
          </div>

          {loading && <StatusMessage type="info" text="Loading detail kelas..." />}
          {error && <StatusMessage type="error" text={error} />}

          {item && (
            <div className="space-y-5">
              {/* Class info card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-lg font-bold text-slate-900">
                  {item.course?.name} — Kelas {item.className}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {item.academicYear} · {item.semesterType}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Kode MK', value: item.course?.code || '-' },
                    { label: 'Jumlah Mahasiswa', value: `${item.enrollments?.length || 0} orang` },
                    { label: 'Kode Enroll', value: item.enrollmentCode || '-' },
                    { label: 'Dosen', value: item.lecturer?.user?.name || '-' },
                    { label: 'Email Dosen', value: item.lecturer?.user?.email || '-' },
                  ].map((info) => (
                    <div key={info.label} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">{info.label}</p>
                      <p className="mt-1 text-sm font-medium text-slate-800 break-all">
                        {info.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meetings */}
              {classId && <MeetingSection classId={classId} canCreate />}

              {/* Student list */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-slate-900">Daftar Mahasiswa</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Mahasiswa yang mengikuti kelas ini.
                  </p>
                </div>
                <StudentList enrollments={item.enrollments || []} />
              </div>
            </div>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
