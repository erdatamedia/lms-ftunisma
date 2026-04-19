'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AlertBanner } from '@/components/ui/alert-banner';
import { isPositiveIntegerString } from '@/lib/validators';

type CourseForm = {
  code: string;
  name: string;
  credits: string;
  semester: string;
  description: string;
};

const initialForm: CourseForm = { code: '', name: '', credits: '', semester: '', description: '' };

export default function AdminCoursesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CourseForm>(initialForm);

  const validationError = useMemo(() => {
    if (!form.code.trim()) return 'Kode course wajib diisi.';
    if (!form.name.trim()) return 'Nama course wajib diisi.';
    if (!isPositiveIntegerString(form.credits)) return 'SKS harus berupa angka bulat positif.';
    if (form.semester && !isPositiveIntegerString(form.semester)) return 'Semester harus berupa angka bulat positif.';
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

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        (item.code || '').toLowerCase().includes(q) ||
        (item.name || '').toLowerCase().includes(q),
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
      const [coursesRes, classesRes] = await Promise.all([
        api.get('/courses', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/classes', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setItems(coursesRes.data);
      setClasses(classesRes.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
        code: form.code.trim(),
        name: form.name.trim(),
        credits: Number(form.credits),
        semester: form.semester ? Number(form.semester) : undefined,
        description: form.description.trim() || undefined,
      };
      if (editingId) {
        await api.patch(`/courses/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        setSuccess('Course berhasil diperbarui.');
      } else {
        await api.post('/courses', payload, { headers: { Authorization: `Bearer ${token}` } });
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
    setShowForm(true);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (item: any) => {
    const usageCount = classCountByCourseId[item.id] || 0;
    if (usageCount > 0) {
      alert(`Course "${item.name}" tidak bisa dihapus karena masih dipakai oleh ${usageCount} class. Hapus class yang terkait terlebih dahulu.`);
      return;
    }
    if (!window.confirm(`Hapus course "${item.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      setDeletingId(item.id);
      setError('');
      setSuccess('');
      const token = getToken();
      await api.delete(`/courses/${item.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (editingId === item.id) resetForm();
      setSuccess('Course berhasil dihapus.');
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
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Kelola Mata Kuliah</h1>
              <p className="mt-0.5 text-sm text-slate-500">Tambah, ubah, dan hapus master data mata kuliah.</p>
            </div>
            <button
              onClick={() => { setShowForm((p) => !p); if (editingId) resetForm(); }}
              className="flex-shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {showForm && !editingId ? 'Tutup Form' : '+ Tambah Mata Kuliah'}
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{items.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Dipakai</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {items.filter((i) => (classCountByCourseId[i.id] || 0) > 0).length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 col-span-2 sm:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Belum Dipakai</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {items.filter((i) => (classCountByCourseId[i.id] || 0) === 0).length}
              </p>
            </div>
          </div>

          {error && <AlertBanner type="error" text={error} onClose={() => setError('')} />}
          {success && <AlertBanner type="success" text={success} onClose={() => setSuccess('')} />}

          {/* Form */}
          {(showForm || editingId) && (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="mb-4 font-semibold text-slate-900">{editingId ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah Baru'}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Kode MK *</label>
                  <input name="code" value={form.code} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" placeholder="IF101" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Mata Kuliah *</label>
                  <input name="name" value={form.name} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" placeholder="Algoritma dan Pemrograman" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">SKS *</label>
                  <input name="credits" type="number" min="1" value={form.credits} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" placeholder="3" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Semester</label>
                  <input name="semester" type="number" min="1" value={form.semester} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" placeholder="1" />
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Deskripsi</label>
                <textarea name="description" value={form.description} onChange={handleChange} className="min-h-[80px] w-full rounded-xl border border-slate-300 bg-white px-3 py-3" placeholder="Deskripsi mata kuliah" />
              </div>
              {validationError && <p className="mt-3 text-sm text-amber-700">{validationError}</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="submit" disabled={submitting || !!validationError} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Mata Kuliah'}
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
                <p className="text-sm text-slate-500">{filteredItems.length} dari {items.length} mata kuliah</p>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari kode atau nama mata kuliah..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none sm:max-w-xs"
                />
              </div>
            )}

            {loading && <p className="text-sm text-slate-500">Loading mata kuliah...</p>}

            {/* Mobile cards */}
            {!loading && (
              <div className="space-y-3 md:hidden">
                {filteredItems.map((item) => {
                  const usageCount = classCountByCourseId[item.id] || 0;
                  return (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{item.code} · {item.credits} SKS{item.semester ? ` · Semester ${item.semester}` : ''}</p>
                          {item.description && <p className="mt-1 text-xs text-slate-400 line-clamp-2">{item.description}</p>}
                        </div>
                        <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${usageCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {usageCount > 0 ? `${usageCount} kelas` : 'Belum dipakai'}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => handleEdit(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                        <button onClick={() => handleDelete(item)} disabled={deletingId === item.id} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60 hover:bg-red-700">
                          {deletingId === item.id ? 'Menghapus...' : 'Hapus'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Desktop table */}
            {!loading && filteredItems.length > 0 && (
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Kode MK', 'Nama Mata Kuliah', 'SKS', 'Semester', 'Dipakai', 'Aksi'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => {
                      const usageCount = classCountByCourseId[item.id] || 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-800">{item.code}</td>
                          <td className="px-4 py-3 text-sm">
                            <p className="font-medium text-slate-900">{item.name}</p>
                            {item.description && <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">{item.description}</p>}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.credits}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.semester || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${usageCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                              {usageCount > 0 ? `${usageCount} kelas` : 'Belum dipakai'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <button onClick={() => handleEdit(item)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                              <button onClick={() => handleDelete(item)} disabled={deletingId === item.id} className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60 hover:bg-red-700">
                                {deletingId === item.id ? '...' : 'Hapus'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center">
                <p className="text-sm text-slate-400">{items.length === 0 ? 'Belum ada mata kuliah.' : 'Tidak ada yang cocok dengan pencarian.'}</p>
              </div>
            )}
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
