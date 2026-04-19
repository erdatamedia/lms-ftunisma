'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
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

function StatCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${accent ? 'text-green-600' : 'text-slate-400'}`}>{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent ? 'text-green-700' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

export default function AdminClassesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClassForm>(initialForm);

  const validationError = useMemo(() => {
    if (!form.courseId) return 'Course wajib dipilih.';
    if (!form.lecturerId) return 'Dosen wajib dipilih.';
    if (!form.className.trim()) return 'Nama kelas wajib diisi.';
    if (!form.academicYear.trim()) return 'Tahun akademik wajib diisi.';
    if (!isAcademicYear(form.academicYear.trim())) return 'Format tahun akademik harus seperti 2025/2026.';
    return '';
  }, [form]);

  const activeCount = useMemo(() => items.filter((i) => i.isActive).length, [items]);
  const inactiveCount = useMemo(() => items.filter((i) => !i.isActive).length, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        (item.course?.name || '').toLowerCase().includes(q) ||
        (item.course?.code || '').toLowerCase().includes(q) ||
        (item.className || '').toLowerCase().includes(q) ||
        (item.lecturer?.user?.name || '').toLowerCase().includes(q) ||
        (item.academicYear || '').toLowerCase().includes(q),
    );
  }, [items, search]);

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
        api.get('/classes', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/courses', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/users/lecturers', { headers: { Authorization: `Bearer ${token}` } }),
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

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
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
        await api.patch(`/classes/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        setSuccess('Class berhasil diperbarui.');
      } else {
        await api.post('/classes', payload, { headers: { Authorization: `Bearer ${token}` } });
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
    setShowForm(true);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus class "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      setDeletingId(id);
      setError('');
      setSuccess('');
      const token = getToken();
      await api.delete(`/classes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (editingId === id) resetForm();
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
        <div className="space-y-5">
          {/* Page header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Kelola Kelas</h1>
              <p className="mt-0.5 text-sm text-slate-500">Tambah, ubah, dan hapus class dari panel admin.</p>
            </div>
            <button
              onClick={() => { setShowForm((p) => !p); if (editingId) resetForm(); }}
              className="flex-shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
            >
              {showForm && !editingId ? 'Tutup Form' : '+ Tambah Kelas'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total" value={items.length} />
            <StatCard label="Aktif" value={activeCount} accent />
            <StatCard label="Nonaktif" value={inactiveCount} />
          </div>

          {/* Alerts */}
          {error && <AlertBanner type="error" text={error} onClose={() => setError('')} />}
          {success && <AlertBanner type="success" text={success} onClose={() => setSuccess('')} />}

          {/* Form */}
          {(showForm || editingId) && (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="mb-4 font-semibold text-slate-900">
                {editingId ? 'Edit Class' : 'Tambah Class Baru'}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Course *</label>
                  <select name="courseId" value={form.courseId} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" required>
                    <option value="">Pilih course</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Dosen *</label>
                  <select name="lecturerId" value={form.lecturerId} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" required>
                    <option value="">Pilih dosen</option>
                    {lecturers.map((l) => <option key={l.id} value={l.id}>{l.user?.name} ({l.user?.email})</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Kelas *</label>
                  <input name="className" value={form.className} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" placeholder="A / B / TI-1A" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Tahun Akademik *</label>
                  <input name="academicYear" value={form.academicYear} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" placeholder="2025/2026" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Semester</label>
                  <select name="semesterType" value={form.semesterType} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3">
                    <option value="GANJIL">GANJIL</option>
                    <option value="GENAP">GENAP</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input id="isActive" name="isActive" type="checkbox" checked={form.isActive} onChange={handleChange} className="h-4 w-4 rounded" />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Class aktif</label>
                </div>
              </div>
              {validationError && <p className="mt-3 text-sm text-amber-700">{validationError}</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="submit" disabled={submitting || !!validationError} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Class'}
                </button>
                <button type="button" onClick={resetForm} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Batal
                </button>
              </div>
            </form>
          )}

          {/* Search + list */}
          <div>
            {items.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{filteredItems.length} dari {items.length} kelas</p>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama kelas, dosen, course..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none sm:max-w-xs"
                />
              </div>
            )}

            {loading && <p className="text-sm text-slate-500">Loading kelas...</p>}

            {/* Mobile cards */}
            {!loading && (
              <div className="space-y-3 md:hidden">
                {filteredItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{item.course?.name} — Kelas {item.className}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{item.course?.code} · {item.academicYear} · {item.semesterType}</p>
                        <p className="mt-1 text-xs text-slate-500">Dosen: {item.lecturer?.user?.name || '-'}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{item.enrollments?.length || 0} mahasiswa</p>
                      </div>
                      <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {item.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/admin/classes/${item.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Detail</Link>
                      <button onClick={() => handleEdit(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                      <button onClick={() => handleDelete(item.id, `${item.course?.name} Kelas ${item.className}`)} disabled={deletingId === item.id} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60 hover:bg-red-700">
                        {deletingId === item.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Desktop table */}
            {!loading && filteredItems.length > 0 && (
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Nama Kelas', 'Mata Kuliah', 'Semester', 'Dosen', 'Mahasiswa', 'Status', 'Aksi'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">Kelas {item.className}</td>
                        <td className="px-4 py-3 text-sm">
                          <p className="text-slate-800">{item.course?.name || '-'}</p>
                          <p className="text-xs text-slate-400">{item.course?.code || ''}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          <p>{item.academicYear}</p>
                          <p className="text-xs text-slate-400">{item.semesterType}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.lecturer?.user?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.enrollments?.length || 0}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {item.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <Link href={`/admin/classes/${item.id}`} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Detail</Link>
                            <button onClick={() => handleEdit(item)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                            <button onClick={() => handleDelete(item.id, `${item.course?.name} Kelas ${item.className}`)} disabled={deletingId === item.id} className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60 hover:bg-red-700">
                              {deletingId === item.id ? '...' : 'Hapus'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center">
                <p className="text-sm text-slate-400">{items.length === 0 ? 'Belum ada class.' : 'Tidak ada kelas yang cocok dengan pencarian.'}</p>
              </div>
            )}
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
