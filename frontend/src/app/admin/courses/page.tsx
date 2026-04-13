'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageCard } from '@/components/ui/page-card';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertBanner } from '@/components/ui/alert-banner';
import { isPositiveIntegerString } from '@/lib/validators';

type CourseForm = {
  code: string;
  name: string;
  credits: string;
  semester: string;
  description: string;
};

const initialForm: CourseForm = {
  code: '',
  name: '',
  credits: '',
  semester: '',
  description: '',
};

export default function AdminCoursesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CourseForm>(initialForm);

  const validationError = useMemo(() => {
    if (!form.code.trim()) return 'Kode course wajib diisi.';
    if (!form.name.trim()) return 'Nama course wajib diisi.';
    if (!isPositiveIntegerString(form.credits)) {
      return 'SKS harus berupa angka bulat positif.';
    }
    if (form.semester && !isPositiveIntegerString(form.semester)) {
      return 'Semester harus berupa angka bulat positif.';
    }
    return '';
  }, [form]);

  const classCountByCourseId = useMemo(() => {
    const map: Record<string, number> = {};

    for (const item of classes) {
      if (!item?.courseId) continue;
      map[item.courseId] = (map[item.courseId] || 0) + 1;
    }

    return map;
  }, [classes]);

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

      const [coursesRes, classesRes] = await Promise.all([
        api.get('/courses', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        api.get('/classes', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      setItems(coursesRes.data);
      setClasses(classesRes.data);
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
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
        code: form.code.trim(),
        name: form.name.trim(),
        credits: Number(form.credits),
        semester: form.semester ? Number(form.semester) : undefined,
        description: form.description.trim() || undefined,
      };

      if (editingId) {
        await api.patch(`/courses/${editingId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSuccess('Course berhasil diperbarui.');
      } else {
        await api.post('/courses', payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSuccess('Course berhasil ditambahkan.');
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
      code: item.code || '',
      name: item.name || '',
      credits: item.credits ? String(item.credits) : '',
      semester: item.semester ? String(item.semester) : '',
      description: item.description || '',
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (item: any) => {
    const courseUsageCount = classCountByCourseId[item.id] || 0;

    const message =
      courseUsageCount > 0
        ? `Course ini sedang dipakai oleh ${courseUsageCount} class. Hapus class yang terkait terlebih dahulu.`
        : `Hapus course "${item.name}"?`;

    const ok = window.confirm(message);
    if (!ok) return;

    try {
      setDeletingId(item.id);
      setError('');
      setSuccess('');

      const token = getToken();

      await api.delete(`/courses/${item.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (editingId === item.id) {
        resetForm();
      }

      setSuccess('Course berhasil dihapus.');
      await fetchData();
    } catch (err: any) {
      const message = getApiErrorMessage(err);

      if (
        message.toLowerCase().includes('masih digunakan') ||
        message.toLowerCase().includes('foreign key') ||
        message.toLowerCase().includes('constraint')
      ) {
        const usageCount = classCountByCourseId[item.id] || 0;
        setError(
          usageCount > 0
            ? `Course "${item.name}" tidak bisa dihapus karena masih dipakai oleh ${usageCount} class. Hapus atau pindahkan class yang terkait terlebih dahulu.`
            : `Course "${item.name}" tidak bisa dihapus karena masih dipakai oleh class.`
        );
      } else {
        setError(message);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardShell>
        <PageCard
          title="Kelola Courses"
          description="Tambah, ubah, dan hapus master data course."
        >
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
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Kode Course
                </label>
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  placeholder="IF101"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nama Course
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  placeholder="Algoritma dan Pemrograman"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  SKS
                </label>
                <input
                  name="credits"
                  type="number"
                  min="1"
                  value={form.credits}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  placeholder="3"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Semester
                </label>
                <input
                  name="semester"
                  type="number"
                  min="1"
                  value={form.semester}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  placeholder="1"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Deskripsi
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="min-h-[100px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                placeholder="Deskripsi course"
              />
            </div>

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
                  : 'Tambah Course'}
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
              <AlertBanner type="info" text="Loading courses..." />
            </div>
          )}

          <div className="mt-6 grid gap-4">
            {items.map((item) => {
              const usageCount = classCountByCourseId[item.id] || 0;
              const isUsed = usageCount > 0;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {item.name}
                        </h3>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {item.code}
                        </span>

                        {isUsed ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                            Dipakai {usageCount} class
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            Belum dipakai
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {item.credits} SKS · Semester {item.semester || '-'}
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        {item.description || 'Tanpa deskripsi'}
                      </p>

                      {isUsed && (
                        <p className="mt-3 text-sm text-amber-700">
                          Course ini tidak bisa dihapus sebelum semua class yang
                          memakainya dihapus atau dipindahkan.
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                      >
                        {deletingId === item.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && items.length === 0 && (
              <EmptyState text="Belum ada course." />
            )}
          </div>
        </PageCard>
      </DashboardShell>
    </ProtectedRoute>
  );
}
