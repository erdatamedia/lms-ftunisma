'use client';

import { useState } from 'react';
import { api, getApiErrorMessage, API_URL } from '@/lib/api';
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

export default function LecturerProfilePage() {
  const { user, accessToken, setAuth } = useAuthStore();
  const lecturer = user?.lecturer;

  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Tipe berkas tidak didukung. Harap pilih JPG, JPEG, PNG, atau WEBP.');
      setAvatarSuccess('');
      return;
    }

    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      setAvatarError('Ukuran berkas tidak boleh lebih dari 2MB.');
      setAvatarSuccess('');
      return;
    }

    try {
      setUploading(true);
      setAvatarError('');
      setAvatarSuccess('');

      const token = accessToken || localStorage.getItem('accessToken') || '';
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/auth/avatar', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedUser = response.data.user;
      setAuth(token, updatedUser);
      setAvatarSuccess('Foto profil berhasil diperbarui.');
    } catch (err) {
      setAvatarError(getApiErrorMessage(err));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

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
    <ProtectedRoute allowedRoles={['LECTURER']}>
      <DashboardShell>
        <div className="mx-auto max-w-lg space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Profil Saya</h1>
            <p className="mt-0.5 text-sm text-slate-500">Informasi akun dan ubah password.</p>
          </div>

          {/* Foto Profil Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Foto Profil</h2>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
              <div className="relative group">
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
                <label htmlFor="avatar-upload" className="cursor-pointer block relative">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-emerald-500/20 transition-all duration-300 group-hover:ring-emerald-500/50">
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 text-white backdrop-blur-[2px] z-10">
                        <svg className="h-6 w-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 text-white text-[10px] font-semibold z-10">
                      <svg className="h-5 w-5 mb-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Ubah Foto
                    </div>

                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${API_URL}${user.avatarUrl}`}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-400 to-green-600 text-3xl font-extrabold text-white">
                        {(user?.name || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
                <p className="text-xs text-slate-500">
                  Peran: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Dosen</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Format: JPG, JPEG, PNG, WEBP. Maks 2MB.
                </p>
                
                {avatarError && <p className="text-xs font-semibold text-red-500 mt-1">{avatarError}</p>}
                {avatarSuccess && <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{avatarSuccess}</p>}
              </div>
            </div>
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
                <dt className="text-sm text-slate-500">NIDN</dt>
                <dd className="text-sm font-medium text-slate-900 text-right">{lecturer?.nidn || '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sm text-slate-500">Departemen</dt>
                <dd className="text-sm font-medium text-slate-900 text-right">{lecturer?.department || '-'}</dd>
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
