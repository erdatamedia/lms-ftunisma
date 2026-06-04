'use client';

import { useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AlertBanner } from '@/components/ui/alert-banner';
import { useAuthStore } from '@/store/auth';

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

export default function StudentProfilePage() {
  const { user } = useAuthStore();
  const student = user?.student;

  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const validationError = (() => {
    if (!form.oldPassword) return 'Password lama wajib diisi.';
    if (!form.newPassword) return 'Password baru wajib diisi.';
    if (form.newPassword.length < 6) return 'Password baru minimal 6 karakter.';
    if (form.newPassword !== form.confirmPassword) return 'Konfirmasi password tidak cocok.';
    return '';
  })();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('accessToken');
      await api.patch(
        '/auth/change-password',
        { oldPassword: form.oldPassword, newPassword: form.newPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setSuccess('Password berhasil diubah.');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardShell>
        <div className="mx-auto max-w-lg space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Profil Saya</h1>
            <p className="mt-0.5 text-sm text-slate-500">Informasi akun dan ubah password.</p>
          </div>

          {/* Profile info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Informasi Akun</h2>
            <dl className="space-y-3">
              <div className="flex justify-between gap-4">
                <dt className="text-sm text-slate-500">Nama</dt>
                <dd className="text-sm font-medium text-slate-900 text-right">{user?.name || '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sm text-slate-500">Email</dt>
                <dd className="text-sm font-medium text-slate-900 text-right">{user?.email || '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sm text-slate-500">NIM</dt>
                <dd className="text-sm font-medium text-slate-900 text-right">{student?.nim || '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sm text-slate-500">Program Studi</dt>
                <dd className="text-sm font-medium text-slate-900 text-right">{student?.studyProgram || '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sm text-slate-500">Fakultas</dt>
                <dd className="text-sm font-medium text-slate-900 text-right">{student?.faculty || '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sm text-slate-500">Angkatan</dt>
                <dd className="text-sm font-medium text-slate-900 text-right">{student?.yearEntry || '-'}</dd>
              </div>
            </dl>
          </div>

          {/* Change password */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Ubah Password</h2>

            {success && <AlertBanner type="success" text={success} onClose={() => setSuccess('')} />}
            {error && <AlertBanner type="error" text={error} onClose={() => setError('')} />}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {(
                [
                  { name: 'oldPassword', label: 'Password Lama', key: 'old' as const },
                  { name: 'newPassword', label: 'Password Baru', key: 'new' as const },
                  { name: 'confirmPassword', label: 'Konfirmasi Password Baru', key: 'confirm' as const },
                ] as const
              ).map(({ name, label, key }) => (
                <div key={name}>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
                  <div className="relative">
                    <input
                      name={name}
                      type={show[key] ? 'text' : 'password'}
                      value={form[name]}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 pr-10 text-sm focus:border-slate-900 focus:outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((prev) => ({ ...prev, [key]: !prev[key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <EyeIcon open={show[key]} />
                    </button>
                  </div>
                </div>
              ))}

              {validationError && form.oldPassword && (
                <p className="text-sm text-amber-700">{validationError}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !!validationError}
                className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Password'}
              </button>
            </form>
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
