'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageCard } from '@/components/ui/page-card';
import { AlertBanner } from '@/components/ui/alert-banner';
import { EmptyState } from '@/components/ui/empty-state';

export default function AdminEnrollmentsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const validationError = useMemo(() => {
    if (!classId) return 'Kelas wajib dipilih.';
    if (!studentId) return 'Mahasiswa wajib dipilih.';
    return '';
  }, [classId, studentId]);

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === classId),
    [classes, classId],
  );

  const selectedStudent = useMemo(
    () => students.find((item) => item.id === studentId),
    [students, studentId],
  );

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
        api.get('/classes', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/users/students', {
          headers: { Authorization: `Bearer ${token}` },
        }),
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

  const fetchEnrollments = async (selectedClassId: string) => {
    if (!selectedClassId) {
      setEnrollments([]);
      return;
    }

    try {
      setError('');
      const token = getToken();

      const { data } = await api.get(`/classes/${selectedClassId}/enrollments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEnrollments(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    if (classId) {
      fetchEnrollments(classId);
    }
  }, [classId]);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const token = getToken();

      await api.post(
        '/enrollments',
        {
          classId,
          studentId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSuccess('Mahasiswa berhasil dimasukkan ke kelas.');
      setStudentId('');
      await fetchEnrollments(classId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (enrollmentId: string) => {
    const ok = window.confirm('Hapus mahasiswa dari kelas ini?');
    if (!ok) return;

    try {
      setError('');
      setSuccess('');

      const token = getToken();

      await api.delete(`/enrollments/${enrollmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        <PageCard
          title="Kelola Enroll Mahasiswa"
          description="Masukkan mahasiswa ke kelas dan kelola data enroll dari panel admin."
        >
          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Total Kelas
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {classes.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Total Mahasiswa
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {students.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Total Enroll di Kelas Terpilih
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {enrollments.length}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4">
              <AlertBanner type="error" text={error} onClose={() => setError('')} />
            </div>
          )}

          {success && (
            <div className="mb-4">
              <AlertBanner type="success" text={success} onClose={() => setSuccess('')} />
            </div>
          )}

          <form
            onSubmit={handleEnroll}
            className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Form Enroll Mahasiswa
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Pilih kelas dan mahasiswa yang akan dimasukkan.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Pilih Kelas
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  required
                >
                  <option value="">Pilih kelas</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.course?.code} - {item.course?.name} - Kelas {item.className}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Pilih Mahasiswa
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  required
                >
                  <option value="">Pilih mahasiswa</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.nim} - {student.user?.name} ({student.user?.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(selectedClass || selectedStudent) && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {selectedClass && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Kelas Terpilih
                    </p>
                    <p className="mt-2 font-medium text-slate-900">
                      {selectedClass.course?.code} - {selectedClass.course?.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Kelas {selectedClass.className} · {selectedClass.academicYear}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Kode enroll: {selectedClass.enrollmentCode || '-'}
                    </p>
                  </div>
                )}

                {selectedStudent && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Mahasiswa Terpilih
                    </p>
                    <p className="mt-2 font-medium text-slate-900">
                      {selectedStudent.user?.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedStudent.nim} · {selectedStudent.user?.email}
                    </p>
                  </div>
                )}
              </div>
            )}

            {validationError && (
              <div className="mt-4">
                <AlertBanner type="warning" text={validationError} />
              </div>
            )}

            <div className="mt-4">
              <button
                type="submit"
                disabled={submitting || !!validationError}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Enroll Mahasiswa'}
              </button>
            </div>
          </form>

          {loading && (
            <div className="mt-6">
              <AlertBanner type="info" text="Memuat data kelas dan mahasiswa..." />
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Daftar Mahasiswa di Kelas
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Mahasiswa yang saat ini terdaftar pada kelas terpilih.
            </p>

            <div className="mt-4 grid gap-3">
              {enrollments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {item.student?.user?.name || '-'}
                        </p>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {item.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.student?.nim || '-'} · {item.student?.user?.email || '-'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}

              {!loading && enrollments.length === 0 && (
                <EmptyState text="Belum ada mahasiswa yang di-enroll pada kelas ini." />
              )}
            </div>
          </div>
        </PageCard>
      </DashboardShell>
    </ProtectedRoute>
  );
}
