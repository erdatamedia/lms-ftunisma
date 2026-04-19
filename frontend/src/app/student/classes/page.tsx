'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { useAuthStore } from '@/store/auth';
import { AlertBanner } from '@/components/ui/alert-banner';

export default function StudentClassesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [search, setSearch] = useState('');
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
        headers: { Authorization: `Bearer ${accessToken}` },
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
        { enrollmentCode: joinCode.trim().toUpperCase() },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      setJoinCode('');
      setSuccess('Berhasil bergabung ke kelas!');
      await fetchClasses();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setJoining(false);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = normalizedSearch
    ? items.filter(
        (item) =>
          (item.course?.name || '').toLowerCase().includes(normalizedSearch) ||
          (item.course?.code || '').toLowerCase().includes(normalizedSearch) ||
          (item.className || '').toLowerCase().includes(normalizedSearch) ||
          (item.lecturer?.user?.name || '').toLowerCase().includes(normalizedSearch) ||
          (item.academicYear || '').toLowerCase().includes(normalizedSearch),
      )
    : items;

  const enrollmentStatus = (item: any) => item.enrollments?.[0]?.status || 'ACTIVE';

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardShell>
        <div className="space-y-5">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold text-slate-900">Kelas Saya</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Daftar kelas yang kamu ikuti. Gunakan kode enroll untuk bergabung ke kelas baru.
            </p>
          </div>

          {/* Join form */}
          <form
            onSubmit={handleJoinClass}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="mb-3 text-sm font-semibold text-slate-800">Gabung Kelas Baru</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Kode Enroll
                </label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: A1B2C3D4"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-sm uppercase tracking-[0.2em] focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  maxLength={20}
                />
              </div>
              <button
                type="submit"
                disabled={joining || !joinCode.trim()}
                className="flex-shrink-0 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 active:scale-[0.98]"
              >
                {joining ? 'Memproses...' : 'Gabung Kelas'}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Minta kode enroll dari dosen atau admin kelas.
            </p>
          </form>

          {success && (
            <AlertBanner type="success" text={success} onClose={() => setSuccess('')} />
          )}
          {error && (
            <AlertBanner type="error" text={error} onClose={() => setError('')} />
          )}

          {/* Class list */}
          <div>
            {/* Search bar */}
            {items.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  {filteredItems.length} dari {items.length} kelas
                </p>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari mata kuliah, dosen, periode..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 sm:max-w-xs"
                />
              </div>
            )}

            {loading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
                Loading kelas...
              </div>
            )}

            {!loading && filteredItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center">
                <p className="text-sm text-slate-400">
                  {items.length === 0
                    ? 'Belum ada kelas. Gunakan kode enroll untuk bergabung.'
                    : 'Tidak ada kelas yang cocok dengan pencarian.'}
                </p>
              </div>
            )}

            {/* Mobile card list */}
            {!loading && filteredItems.length > 0 && (
              <>
                <div className="space-y-3 md:hidden">
                  {filteredItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/student/classes/${item.id}`}
                      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md active:scale-[0.98]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {item.course?.name || '-'}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.course?.code || ''} · Kelas {item.className}
                          </p>
                        </div>
                        <span
                          className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                            enrollmentStatus(item) === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {enrollmentStatus(item)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>{item.academicYear} · {item.semesterType}</span>
                        <span>{item.lecturer?.user?.name || '-'}</span>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        {['Mata Kuliah', 'Periode', 'Dosen', 'Status', 'Aksi'].map((h) => (
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
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="transition hover:bg-slate-50">
                          <td className="px-4 py-4 text-sm">
                            <p className="font-semibold text-slate-900">{item.course?.name || '-'}</p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {item.course?.code || ''} · Kelas {item.className}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            <p>{item.academicYear || '-'}</p>
                            <p className="text-xs text-slate-400">{item.semesterType || '-'}</p>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {item.lecturer?.user?.name || '-'}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                enrollmentStatus(item) === 'ACTIVE'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {enrollmentStatus(item)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <Link
                              href={`/student/classes/${item.id}`}
                              className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                            >
                              Buka Kelas
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
