'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AlertBanner } from '@/components/ui/alert-banner';
import { isEmail, isPositiveIntegerString } from '@/lib/validators';

type RoleType = 'LECTURER' | 'STUDENT';
type FilterType = 'all' | 'LECTURER' | 'STUDENT';

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    ADMIN: 'bg-blue-100 text-blue-700',
    LECTURER: 'bg-green-100 text-green-700',
    STUDENT: 'bg-slate-100 text-slate-600',
  };
  const labels: Record<string, string> = { ADMIN: 'Admin', LECTURER: 'Dosen', STUDENT: 'Mahasiswa' };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[role] || 'bg-slate-100 text-slate-600'}`}>
      {labels[role] || role}
    </span>
  );
}

export default function AdminUsersPage() {
  const [role, setRole] = useState<RoleType>('LECTURER');
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [lecturers, setLecturers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const [editingType, setEditingType] = useState<RoleType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    nidn: '', department: 'Informatika',
    nim: '', studyProgram: 'Informatika', faculty: 'Fakultas Teknik', yearEntry: '2023',
  });

  const validationError = useMemo(() => {
    if (!form.name.trim()) return 'Nama wajib diisi.';
    if (!form.email.trim()) return 'Email wajib diisi.';
    if (!isEmail(form.email.trim())) return 'Format email tidak valid.';
    if (!editingId && !form.password.trim()) return 'Password wajib diisi.';
    if (form.password.trim() && form.password.trim().length < 6) return 'Password minimal 6 karakter.';
    if (role === 'LECTURER' && !form.nidn.trim()) return 'NIDN wajib diisi untuk dosen.';
    if (role === 'STUDENT') {
      if (!form.nim.trim()) return 'NIM wajib diisi untuk mahasiswa.';
      if (!form.studyProgram.trim()) return 'Program studi wajib diisi.';
      if (!form.faculty.trim()) return 'Fakultas wajib diisi.';
      if (!isPositiveIntegerString(form.yearEntry)) return 'Tahun masuk harus berupa angka.';
    }
    return '';
  }, [form, role, editingId]);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

  const resetForm = () => {
    setForm({ name: '', email: '', password: '', nidn: '', department: 'Informatika', nim: '', studyProgram: 'Informatika', faculty: 'Fakultas Teknik', yearEntry: '2023' });
    setEditingType(null);
    setEditingId(null);
    setShowForm(false);
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

  useEffect(() => { fetchUsers(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) return;
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      if (editingId && editingType === 'LECTURER') {
        await api.patch(`/users/lecturers/${editingId}`, { name: form.name.trim(), email: form.email.trim(), password: form.password || undefined, nidn: form.nidn.trim(), department: form.department.trim() }, { headers: getHeaders() });
        setSuccess('Akun dosen berhasil diperbarui.');
      } else if (editingId && editingType === 'STUDENT') {
        await api.patch(`/users/students/${editingId}`, { name: form.name.trim(), email: form.email.trim(), password: form.password || undefined, nim: form.nim.trim(), studyProgram: form.studyProgram.trim(), faculty: form.faculty.trim(), yearEntry: Number(form.yearEntry) }, { headers: getHeaders() });
        setSuccess('Akun mahasiswa berhasil diperbarui.');
      } else {
        const payload = role === 'LECTURER'
          ? { name: form.name.trim(), email: form.email.trim(), password: form.password, role, nidn: form.nidn.trim(), department: form.department.trim() }
          : { name: form.name.trim(), email: form.email.trim(), password: form.password, role, nim: form.nim.trim(), studyProgram: form.studyProgram.trim(), faculty: form.faculty.trim(), yearEntry: Number(form.yearEntry) };
        await api.post('/users/admin-register', payload, { headers: getHeaders() });
        setSuccess(`${role === 'LECTURER' ? 'Akun dosen' : 'Akun mahasiswa'} berhasil ditambahkan.`);
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
    setRole('LECTURER'); setEditingType('LECTURER'); setEditingId(item.id);
    setForm({ name: item.user?.name || '', email: item.user?.email || '', password: '', nidn: item.nidn || '', department: item.department || 'Informatika', nim: '', studyProgram: 'Informatika', faculty: 'Fakultas Teknik', yearEntry: '2023' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditStudent = (item: any) => {
    setRole('STUDENT'); setEditingType('STUDENT'); setEditingId(item.id);
    setForm({ name: item.user?.name || '', email: item.user?.email || '', password: '', nidn: '', department: 'Informatika', nim: item.nim || '', studyProgram: item.studyProgram || 'Informatika', faculty: item.faculty || 'Fakultas Teknik', yearEntry: String(item.yearEntry || '2023') });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLecturer = async (id: string, name: string) => {
    if (!window.confirm(`Hapus akun dosen "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      setError(''); setSuccess('');
      await api.delete(`/users/lecturers/${id}`, { headers: getHeaders() });
      setSuccess('Akun dosen berhasil dihapus.');
      await fetchUsers();
    } catch (err) { setError(getApiErrorMessage(err)); }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!window.confirm(`Hapus akun mahasiswa "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      setError(''); setSuccess('');
      await api.delete(`/users/students/${id}`, { headers: getHeaders() });
      setSuccess('Akun mahasiswa berhasil dihapus.');
      await fetchUsers();
    } catch (err) { setError(getApiErrorMessage(err)); }
  };

  // Combined user list for display
  const allUsers = useMemo(() => {
    const lect = lecturers.map((l) => ({ ...l, _type: 'LECTURER' as RoleType, _name: l.user?.name || '', _email: l.user?.email || '', _id2: l.nim || l.nidn || '' }));
    const stud = students.map((s) => ({ ...s, _type: 'STUDENT' as RoleType, _name: s.user?.name || '', _email: s.user?.email || '', _id2: s.nim || '' }));
    return [...lect, ...stud];
  }, [lecturers, students]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allUsers.filter((u) => {
      const matchFilter = filter === 'all' || u._type === filter;
      const matchSearch = !q || u._name.toLowerCase().includes(q) || u._email.toLowerCase().includes(q) || (u._id2 || '').toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [allUsers, filter, search]);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardShell>
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Kelola Akun</h1>
              <p className="mt-0.5 text-sm text-slate-500">Tambah, ubah, dan hapus akun dosen maupun mahasiswa.</p>
            </div>
            <button
              onClick={() => { setShowForm((p) => !p); if (editingId) resetForm(); }}
              className="flex-shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {showForm && !editingId ? 'Tutup Form' : '+ Tambah Akun'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Dosen</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{lecturers.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Mahasiswa</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{students.length}</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Akun</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{lecturers.length + students.length}</p>
            </div>
          </div>

          {error && <AlertBanner type="error" text={error} onClose={() => setError('')} />}
          {success && <AlertBanner type="success" text={success} onClose={() => setSuccess('')} />}

          {/* Form */}
          {(showForm || editingId) && (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="mb-4 font-semibold text-slate-900">{editingId ? 'Edit Akun' : 'Tambah Akun Baru'}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Jenis Akun</label>
                  <select value={role} onChange={(e) => setRole(e.target.value as RoleType)} disabled={!!editingId} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 disabled:bg-slate-100">
                    <option value="LECTURER">Dosen</option>
                    <option value="STUDENT">Mahasiswa</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama *</label>
                  <input name="name" value={form.name} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Email *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Password {editingId ? '(opsional)' : '*'}</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" placeholder={editingId ? 'Isi jika ingin mengganti password' : 'Minimal 6 karakter'} />
                </div>
                {role === 'LECTURER' ? (
                  <>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">NIDN *</label>
                      <input name="nidn" value={form.nidn} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Departemen</label>
                      <input name="department" value={form.department} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">NIM *</label>
                      <input name="nim" value={form.nim} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Program Studi *</label>
                      <input name="studyProgram" value={form.studyProgram} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Fakultas *</label>
                      <input name="faculty" value={form.faculty} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Tahun Masuk *</label>
                      <input name="yearEntry" type="number" value={form.yearEntry} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3" />
                    </div>
                  </>
                )}
              </div>
              {validationError && <p className="mt-3 text-sm text-amber-700">{validationError}</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="submit" disabled={submitting || !!validationError} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : `Tambah ${role === 'LECTURER' ? 'Dosen' : 'Mahasiswa'}`}
                </button>
                <button type="button" onClick={resetForm} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Batal
                </button>
              </div>
            </form>
          )}

          {/* Filter + search */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(['all', 'LECTURER', 'STUDENT'] as FilterType[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-2 text-sm font-medium transition ${filter === f ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                  {f === 'all' ? `Semua (${allUsers.length})` : f === 'LECTURER' ? `Dosen (${lecturers.length})` : `Mahasiswa (${students.length})`}
                </button>
              ))}
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, NIM, atau NIDN..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none sm:max-w-sm"
            />
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filteredUsers.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{item._name || '-'}</p>
                      <RoleBadge role={item._type} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{item._email || '-'}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {item._type === 'LECTURER' ? `NIDN: ${item.nidn || '-'} · ${item.department || '-'}` : `NIM: ${item.nim || '-'} · ${item.studyProgram || '-'}`}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => item._type === 'LECTURER' ? handleEditLecturer(item) : handleEditStudent(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                  <button onClick={() => item._type === 'LECTURER' ? handleDeleteLecturer(item.id, item._name) : handleDeleteStudent(item.id, item._name)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700">Hapus</button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          {filteredUsers.length > 0 && (
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {['Nama', 'Email', 'Role', 'NIM / NIDN', 'Program Studi / Dept', 'Aksi'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">{item._name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item._email || '-'}</td>
                      <td className="px-4 py-3"><RoleBadge role={item._type} /></td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item._type === 'LECTURER' ? (item.nidn || '-') : (item.nim || '-')}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item._type === 'LECTURER' ? (item.department || '-') : (item.studyProgram || '-')}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => item._type === 'LECTURER' ? handleEditLecturer(item) : handleEditStudent(item)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                          <button onClick={() => item._type === 'LECTURER' ? handleDeleteLecturer(item.id, item._name) : handleDeleteStudent(item.id, item._name)} className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredUsers.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center">
              <p className="text-sm text-slate-400">{allUsers.length === 0 ? 'Belum ada akun.' : 'Tidak ada akun yang cocok dengan filter.'}</p>
            </div>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
