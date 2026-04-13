'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageCard } from '@/components/ui/page-card';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertBanner } from '@/components/ui/alert-banner';
import { isAcademicYear } from '@/lib/validators';

type ClassForm = {
  courseId: string;
  lecturerId: string;
  className: string;
  academicYear: string;
  semesterType: 'GANJIL' | 'GENAP';
  isActive: boolean;
};

const initialForm: ClassForm = {
  courseId: '',
  lecturerId: '',
  className: '',
  academicYear: '',
  semesterType: 'GANJIL',
  isActive: true,
};

export default function AdminClassesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClassForm>(initialForm);

  const validationError = useMemo(() => {
    if (!form.courseId) return 'Course wajib dipilih.';
    if (!form.lecturerId) return 'Dosen wajib dipilih.';
    if (!form.className.trim()) return 'Nama kelas wajib diisi.';
    if (!form.academicYear.trim()) return 'Tahun akademik wajib diisi.';
    if (!isAcademicYear(form.academicYear.trim())) {
      return 'Format tahun akademik harus seperti 2025/2026.';
    }
    return '';
  }, [form]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === form.courseId),
    [courses, form.courseId],
  );

  const selectedLecturer = useMemo(
    () => lecturers.find((lecturer) => lecturer.id === form.lecturerId),
    [lecturers, form.lecturerId],
  );

  const activeCount = useMemo(
    () => items.filter((item) => item.isActive).length,
    [items],
  );

  const inactiveCount = useMemo(
    () => items.filter((item) => !item.isActive).length,
    [items],
  );

  const getToken = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Token tidak ditemukan. Silakan login ulang.');
    return token;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();

      const [classesRes, coursesRes, lecturersRes] = await Promise.all([
        api.get('/classes', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/courses', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/users/lecturers', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setItems(classesRes.data);
      setCourses(coursesRes.data);
      setLecturers(lecturersRes.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const token = getToken();

      const payload = {
        courseId: form.courseId,
        lecturerId: form.lecturerId,
        className: form.className.trim(),
        academicYear: form.academicYear.trim(),
        semesterType: form.semesterType,
        isActive: form.isActive,
      };

      if (editingId) {
        await api.patch(`/classes/${editingId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSuccess('Class berhasil diperbarui.');
      } else {
        await api.post('/classes', payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSuccess('Class berhasil ditambahkan.');
      }

      resetForm();
      await fetchData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      courseId: item.courseId || '',
      lecturerId: item.lecturerId || '',
      className: item.className || '',
      academicYear: item.academicYear || '',
      semesterType: item.semesterType || 'GANJIL',
      isActive: Boolean(item.isActive),
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm('Hapus class ini?');
    if (!ok) return;

    try {
      setDeletingId(id);
      setError('');
      setSuccess('');

      const token = getToken();

      await api.delete(`/classes/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (editingId === id) {
        resetForm();
      }

      setSuccess('Class berhasil dihapus.');
      await fetchData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardShell>
        <PageCard
          title="Kelola Kelas"
          description="Tambah, ubah, dan hapus class dari panel admin."
        >
          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Total Class
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {items.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-green-50 p-4">
              <p className="text-xs uppercase tracking-wide text-green-600">
                Class Aktif
              </p>
              <p className="mt-2 text-2xl font-semibold text-green-700">
                {activeCount}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Class Nonaktif
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-700">
                {inactiveCount}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4">
              <AlertBanner
                type="error"
                text={error}
                onClose={() => setError('')}
              />
            </div>
          )}

          {success && (
            <div className="mb-4">
              <AlertBanner
                type="success"
                text={success}
                onClose={() => setSuccess('')}
              />
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                {editingId ? 'Edit Class' : 'Tambah Class'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Pilih course, dosen, dan isi identitas kelas dengan benar.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Course
                </label>
                <select
                  name="courseId"
                  value={form.courseId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  required
                >
                  <option value="">Pilih course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Dosen
                </label>
                <select
                  name="lecturerId"
                  value={form.lecturerId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  required
                >
                  <option value="">Pilih dosen</option>
                  {lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.user?.name} ({lecturer.user?.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nama Kelas
                </label>
                <input
                  name="className"
                  value={form.className}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  placeholder="A / B / TI-1A"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tahun Akademik
                </label>
                <input
                  name="academicYear"
                  value={form.academicYear}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  placeholder="2025/2026"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Semester Type
                </label>
                <select
                  name="semesterType"
                  value={form.semesterType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  required
                >
                  <option value="GANJIL">GANJIL</option>
                  <option value="GENAP">GENAP</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-7">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-slate-700"
                >
                  Class aktif
                </label>
              </div>
            </div>

            {(selectedCourse || selectedLecturer) && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {selectedCourse && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Course Terpilih
                    </p>
                    <p className="mt-2 font-medium text-slate-900">
                      {selectedCourse.code} - {selectedCourse.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedCourse.credits} SKS
                    </p>
                  </div>
                )}

                {selectedLecturer && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Dosen Terpilih
                    </p>
                    <p className="mt-2 font-medium text-slate-900">
                      {selectedLecturer.user?.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedLecturer.user?.email}
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

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting || !!validationError}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting
                  ? editingId
                    ? 'Menyimpan...'
                    : 'Menambahkan...'
                  : editingId
                  ? 'Simpan Perubahan'
                  : 'Tambah Class'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>

          {loading && (
            <div className="mt-6">
              <AlertBanner type="info" text="Loading classes..." />
            </div>
          )}

          <div className="mt-6 grid gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {item.course?.name} - Kelas {item.className}
                      </h3>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {item.course?.code || 'No Code'}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.semesterType === 'GANJIL'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {item.semesterType}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {item.academicYear}
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Dosen
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {item.lecturer?.user?.name || '-'}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Mahasiswa
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {item.enrollments?.length || 0} orang
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Status
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {item.isActive ? 'Class aktif' : 'Class nonaktif'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/classes/${item.id}`}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      Detail
                    </Link>
                    <button
                      onClick={() => handleEdit(item)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {deletingId === item.id ? 'Menghapus...' : 'Hapus'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!loading && items.length === 0 && (
              <EmptyState text="Belum ada class." />
            )}
          </div>
        </PageCard>
      </DashboardShell>
    </ProtectedRoute>
  );
}
