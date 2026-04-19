'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AlertBanner } from '@/components/ui/alert-banner';

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
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

export default function AdminEnrollmentsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [search, setSearch] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = classId && studentId;

  const selectedClass = useMemo(() => classes.find((c) => c.id === classId), [classes, classId]);
  const selectedStudent = useMemo(() => students.find((s) => s.id === studentId), [students, studentId]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredEnrollments = normalizedSearch
    ? enrollments.filter(
        (e) =>
          (e.student?.user?.name || '').toLowerCase().includes(normalizedSearch) ||
          (e.student?.nim || '').toLowerCase().includes(normalizedSearch) ||
          (e.student?.user?.email || '').toLowerCase().includes(normalizedSearch),
      )
    : enrollments;

  const getToken = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Token tidak ditemukan. Silakan login ulang.');
    return token;
  };

  const fetchBaseData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getToken();
      const [classesRes, studentsRes] = await Promise.all([
        api.get('/classes', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/users/students', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setClasses(classesRes.data);
      setStudents(studentsRes.data);
      if (!classId && classesRes.data.length > 0) {
        setClassId(classesRes.data[0].id);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async (cid: string) => {
    if (!cid) { setEnrollments([]); return; }
    try {
      setError('');
      const token = getToken();
      const { data } = await api.get(`/classes/${cid}/enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnrollments(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  useEffect(() => { fetchBaseData(); }, []);
  useEffect(() => { if (classId) fetchEnrollments(classId); }, [classId]);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const studentName = selectedStudent?.user?.name || studentId;
    const className = selectedClass
      ? `${selectedClass.course?.name} - Kelas ${selectedClass.className}`
      : classId;

    const ok = window.confirm(
      `Enroll "${studentName}" ke kelas "${className}"?\n\nLanjutkan?`,
    );
    if (!ok) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      const token = getToken();
      await api.post('/enrollments', { classId, studentId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(`${studentName} berhasil dimasukkan ke kelas.`);
      setStudentId('');
      await fetchEnrollments(classId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (enrollmentId: string, studentName: string) => {
    const ok = window.confirm(`Hapus "${studentName}" dari kelas ini?`);
    if (!ok) return;
    try {
      setError('');
      setSuccess('');
      const token = getToken();
      await api.delete(`/enrollments/${enrollmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Data enroll mahasiswa berhasil dihapus.');
      await fetchEnrollments(classId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardShell>
        <div className="space-y-5">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold text-slate-900">Enroll Mahasiswa</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Masukkan mahasiswa ke kelas dan kelola data enroll.
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Total Kelas" value={classes.length} />
            <StatCard label="Total Mahasiswa" value={students.length} />
            <StatCard label="Enroll di Kelas Ini" value={enrollments.length} />
          </div>

          {/* Alerts */}
          {success && <AlertBanner type="success" text={success} onClose={() => setSuccess('')} />}
          {error && <AlertBanner type="error" text={error} onClose={() => setError('')} />}

          {/* Enroll form */}
          <form
            onSubmit={handleEnroll}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="mb-4 text-sm font-semibold text-slate-800">Form Enroll Mahasiswa</p>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Kelas */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Pilih Kelas <span className="text-red-500">*</span>
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">— Pilih kelas —</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course?.code} · {c.course?.name} · Kelas {c.className}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mahasiswa */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Pilih Mahasiswa <span className="text-red-500">*</span>
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">— Pilih mahasiswa —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nim} · {s.user?.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview selection */}
            {(selectedClass || selectedStudent) && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {selectedClass && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Kelas Terpilih
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900">
                      {selectedClass.course?.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {selectedClass.course?.code} · Kelas {selectedClass.className} · {selectedClass.academicYear}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Kode: {selectedClass.enrollmentCode || '-'}
                    </p>
                  </div>
                )}
                {selectedStudent && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Mahasiswa Terpilih
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900">
                      {selectedStudent.user?.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {selectedStudent.nim} · {selectedStudent.user?.email}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting || !canSubmit}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98]"
              >
                {submitting ? 'Memproses...' : 'Enroll Mahasiswa'}
              </button>
              {!canSubmit && (
                <p className="text-xs text-slate-400">Pilih kelas dan mahasiswa terlebih dahulu.</p>
              )}
            </div>
          </form>

          {/* Enrollment list */}
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Daftar Mahasiswa di Kelas Terpilih
                </h2>
                {!loading && (
                  <p className="mt-0.5 text-xs text-slate-400">
                    {filteredEnrollments.length} dari {enrollments.length} mahasiswa
                  </p>
                )}
              </div>
              {enrollments.length > 0 && (
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, NIM, email..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 sm:max-w-xs"
                />
              )}
            </div>

            {loading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
                Memuat data enrollment...
              </div>
            )}

            {!loading && filteredEnrollments.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center">
                <p className="text-sm text-slate-400">
                  {enrollments.length === 0
                    ? 'Belum ada mahasiswa yang di-enroll pada kelas ini.'
                    : 'Tidak ada hasil yang cocok dengan pencarian.'}
                </p>
              </div>
            )}

            {!loading && filteredEnrollments.length > 0 && (
              <>
                {/* Mobile cards */}
                <div className="space-y-3 md:hidden">
                  {filteredEnrollments.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                              {(item.student?.user?.name || '?')[0].toUpperCase()}
                            </div>
                            <p className="font-semibold text-slate-900">
                              {item.student?.user?.name || '-'}
                            </p>
                          </div>
                          <p className="mt-1.5 text-xs text-slate-500">
                            {item.student?.nim || '-'} · {item.student?.user?.email || '-'}
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <StatusBadge status={item.status} />
                            <span className="text-xs text-slate-400">
                              {item.enrolledAt
                                ? new Date(item.enrolledAt).toLocaleDateString('id-ID')
                                : '-'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(item.id, item.student?.user?.name || '-')}
                          className="flex-shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        {['Mahasiswa', 'NIM', 'Tanggal Enroll', 'Status', 'Aksi'].map((h) => (
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
                      {filteredEnrollments.map((item) => (
                        <tr key={item.id} className="transition hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                                {(item.student?.user?.name || '?')[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {item.student?.user?.name || '-'}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {item.student?.user?.email || '-'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-sm text-slate-600">
                            {item.student?.nim || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.enrolledAt
                              ? new Date(item.enrolledAt).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDelete(item.id, item.student?.user?.name || '-')}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              Hapus
                            </button>
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
