'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageCard } from '@/components/ui/page-card';
import { AlertBanner } from '@/components/ui/alert-banner';
import { EmptyState } from '@/components/ui/empty-state';
import { isEmail, isPositiveIntegerString } from '@/lib/validators';

type RoleType = 'LECTURER' | 'STUDENT';

export default function AdminUsersPage() {
  const [role, setRole] = useState<RoleType>('LECTURER');
  const [tab, setTab] = useState<RoleType>('LECTURER');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [lecturers, setLecturers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const [editingType, setEditingType] = useState<RoleType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    nidn: '',
    department: 'Informatika',
    nim: '',
    studyProgram: 'Informatika',
    faculty: 'Fakultas Teknik',
    yearEntry: '2023',
  });

  const validationError = useMemo(() => {
    if (!form.name.trim()) return 'Nama wajib diisi.';
    if (!form.email.trim()) return 'Email wajib diisi.';
    if (!isEmail(form.email.trim())) return 'Format email tidak valid.';
    if (!editingId && !form.password.trim()) return 'Password wajib diisi.';
    if (form.password.trim() && form.password.trim().length < 6) {
      return 'Password minimal 6 karakter.';
    }

    if (role === 'LECTURER') {
      if (!form.nidn.trim()) return 'NIDN wajib diisi untuk dosen.';
    }

    if (role === 'STUDENT') {
      if (!form.nim.trim()) return 'NIM wajib diisi untuk mahasiswa.';
      if (!form.studyProgram.trim()) return 'Program studi wajib diisi.';
      if (!form.faculty.trim()) return 'Fakultas wajib diisi.';
      if (!isPositiveIntegerString(form.yearEntry)) {
        return 'Tahun masuk harus berupa angka bulat positif.';
      }
    }

    return '';
  }, [form, role, editingId]);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  });

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      password: '',
      nidn: '',
      department: 'Informatika',
      nim: '',
      studyProgram: 'Informatika',
      faculty: 'Fakultas Teknik',
      yearEntry: '2023',
    });
    setEditingType(null);
    setEditingId(null);
  };

  const fetchUsers = async () => {
    try {
      const [lecturersRes, studentsRes] = await Promise.all([
        api.get('/users/lecturers', { headers: getHeaders() }),
        api.get('/users/students', { headers: getHeaders() }),
      ]);

      setLecturers(lecturersRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      if (editingId && editingType === 'LECTURER') {
        await api.patch(
          `/users/lecturers/${editingId}`,
          {
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password || undefined,
            nidn: form.nidn.trim(),
            department: form.department.trim(),
          },
          { headers: getHeaders() },
        );
        setSuccess('Akun dosen berhasil diperbarui.');
      } else if (editingId && editingType === 'STUDENT') {
        await api.patch(
          `/users/students/${editingId}`,
          {
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password || undefined,
            nim: form.nim.trim(),
            studyProgram: form.studyProgram.trim(),
            faculty: form.faculty.trim(),
            yearEntry: Number(form.yearEntry),
          },
          { headers: getHeaders() },
        );
        setSuccess('Akun mahasiswa berhasil diperbarui.');
      } else {
        const payload =
          role === 'LECTURER'
            ? {
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
                role,
                nidn: form.nidn.trim(),
                department: form.department.trim(),
              }
            : {
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
                role,
                nim: form.nim.trim(),
                studyProgram: form.studyProgram.trim(),
                faculty: form.faculty.trim(),
                yearEntry: Number(form.yearEntry),
              };

        await api.post('/users/admin-register', payload, {
          headers: getHeaders(),
        });

        setSuccess(
          `${role === 'LECTURER' ? 'Akun dosen' : 'Akun mahasiswa'} berhasil ditambahkan.`,
        );
      }

      resetForm();
      await fetchUsers();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditLecturer = (item: any) => {
    setRole('LECTURER');
    setEditingType('LECTURER');
    setEditingId(item.id);
    setForm({
      name: item.user?.name || '',
      email: item.user?.email || '',
      password: '',
      nidn: item.nidn || '',
      department: item.department || 'Informatika',
      nim: '',
      studyProgram: 'Informatika',
      faculty: 'Fakultas Teknik',
      yearEntry: '2023',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditStudent = (item: any) => {
    setRole('STUDENT');
    setEditingType('STUDENT');
    setEditingId(item.id);
    setForm({
      name: item.user?.name || '',
      email: item.user?.email || '',
      password: '',
      nidn: '',
      department: 'Informatika',
      nim: item.nim || '',
      studyProgram: item.studyProgram || 'Informatika',
      faculty: item.faculty || 'Fakultas Teknik',
      yearEntry: String(item.yearEntry || '2023'),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLecturer = async (id: string) => {
    const ok = window.confirm('Hapus akun dosen ini?');
    if (!ok) return;

    try {
      setError('');
      setSuccess('');
      await api.delete(`/users/lecturers/${id}`, {
        headers: getHeaders(),
      });
      setSuccess('Akun dosen berhasil dihapus.');
      await fetchUsers();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDeleteStudent = async (id: string) => {
    const ok = window.confirm('Hapus akun mahasiswa ini?');
    if (!ok) return;

    try {
      setError('');
      setSuccess('');
      await api.delete(`/users/students/${id}`, {
        headers: getHeaders(),
      });
      setSuccess('Akun mahasiswa berhasil dihapus.');
      await fetchUsers();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardShell>
        <PageCard
          title="Kelola Akun"
          description="Admin dapat menambah, mengubah, dan menghapus akun dosen maupun mahasiswa."
        >
          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Total Dosen
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {lecturers.length}
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
                Mode Form
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {editingId
                  ? `Edit ${editingType === 'LECTURER' ? 'Dosen' : 'Mahasiswa'}`
                  : `Tambah ${role === 'LECTURER' ? 'Dosen' : 'Mahasiswa'}`}
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
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                {editingId ? 'Form Edit Akun' : 'Form Tambah Akun'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Gunakan form ini untuk mengelola akun dosen dan mahasiswa.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Jenis Akun
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleType)}
                  disabled={!!editingId}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-100"
                >
                  <option value="LECTURER">Dosen</option>
                  <option value="STUDENT">Mahasiswa</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nama
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Password {editingId ? '(opsional)' : ''}
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  placeholder={editingId ? 'Isi jika ingin mengganti password' : 'Minimal 6 karakter'}
                />
              </div>

              {role === 'LECTURER' ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      NIDN
                    </label>
                    <input
                      name="nidn"
                      value={form.nidn}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Departemen
                    </label>
                    <input
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      NIM
                    </label>
                    <input
                      name="nim"
                      value={form.nim}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Program Studi
                    </label>
                    <input
                      name="studyProgram"
                      value={form.studyProgram}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Fakultas
                    </label>
                    <input
                      name="faculty"
                      value={form.faculty}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Tahun Masuk
                    </label>
                    <input
                      name="yearEntry"
                      type="number"
                      value={form.yearEntry}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                    />
                  </div>
                </>
              )}
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
                  ? 'Menyimpan...'
                  : editingId
                  ? 'Simpan Perubahan'
                  : `Tambah ${role === 'LECTURER' ? 'Dosen' : 'Mahasiswa'}`}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                Reset Form
              </button>
            </div>
          </form>

          <div className="mt-8 flex gap-2">
            <button
              onClick={() => setTab('LECTURER')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                tab === 'LECTURER'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 bg-white text-slate-700'
              }`}
            >
              Data Dosen
            </button>
            <button
              onClick={() => setTab('STUDENT')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                tab === 'STUDENT'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 bg-white text-slate-700'
              }`}
            >
              Data Mahasiswa
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {tab === 'LECTURER' &&
              lecturers.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {item.user?.name || '-'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.user?.email || '-'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        NIDN: {item.nidn || '-'} · {item.department || '-'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditLecturer(item)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLecturer(item.id)}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {tab === 'STUDENT' &&
              students.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {item.user?.name || '-'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.user?.email || '-'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.nim || '-'} · {item.studyProgram || '-'} · {item.faculty || '-'} · {item.yearEntry || '-'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditStudent(item)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(item.id)}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {tab === 'LECTURER' && lecturers.length === 0 && (
              <EmptyState text="Belum ada akun dosen." />
            )}

            {tab === 'STUDENT' && students.length === 0 && (
              <EmptyState text="Belum ada akun mahasiswa." />
            )}
          </div>
        </PageCard>
      </DashboardShell>
    </ProtectedRoute>
  );
}
