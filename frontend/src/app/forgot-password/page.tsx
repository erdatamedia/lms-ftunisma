'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { isEmail } from '@/lib/validators';

function FieldError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
      <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      {message}
    </p>
  );
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [apiError, setApiError] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setApiError('');

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Email wajib diisi.');
      return;
    }
    if (!isEmail(trimmed)) {
      setEmailError('Format email tidak valid.');
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post('/auth/forgot-password/verify', { email: trimmed });
      setUserId(data.userId);
      setStep(2);
    } catch (err) {
      setApiError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setConfirmError('');
    setApiError('');

    if (newPassword.length < 6) {
      setPasswordError('Password minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmError('Konfirmasi password tidak cocok.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/auth/forgot-password/reset', {
        userId,
        newPassword,
      });
      setStep(3);
    } catch (err) {
      setApiError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-transparent px-4 pb-10 pt-10">
      {/* Floating Theme Toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition shadow-sm active:scale-95"
          type="button"
        >
          {theme === 'dark' ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M9.75 9.75l-1.5-1.5m11.25 11.25-1.5-1.5M21 12h-2.25M5.25 12H3m14.25-6.25-1.5 1.5M8.25 15.75l-1.5 1.5M12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>
          )}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">LMS UNISMA</h1>
          <p className="mt-1 text-sm text-slate-500">Informatika FT Universitas Islam Malang</p>
        </div>

        <div className="premium-card rounded-2xl p-6">
          {/* Step 1: Verify Email */}
          {step === 1 && (
            <>
              <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">Lupa Password</h2>
              <p className="mb-6 text-sm text-slate-500">Masukkan email Anda untuk mencari data akun.</p>

              {apiError && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  <p>{apiError}</p>
                </div>
              )}

              <form onSubmit={handleVerifyEmail} className="space-y-4" noValidate>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
                      emailError
                        ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                        : 'border-slate-300 bg-white focus:border-slate-900 focus:ring-slate-100'
                    }`}
                    placeholder="email@example.com"
                  />
                  <FieldError message={emailError} />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting ? 'Memproses...' : 'Cari Akun'}
                </button>
              </form>
            </>
          )}

          {/* Step 2: Input Password Baru */}
          {step === 2 && (
            <>
              <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">Ubah Password Baru</h2>
              <p className="mb-6 text-sm text-slate-500">Akun ditemukan. Masukkan password baru Anda.</p>

              {apiError && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  <p>{apiError}</p>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
                      passwordError
                        ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                        : 'border-slate-300 bg-white focus:border-slate-900 focus:ring-slate-100'
                    }`}
                    placeholder="Minimal 6 karakter"
                  />
                  <FieldError message={passwordError} />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
                      confirmError
                        ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                        : 'border-slate-300 bg-white focus:border-slate-900 focus:ring-slate-100'
                    }`}
                    placeholder="Ulangi password baru"
                  />
                  <FieldError message={confirmError} />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
              </form>
            </>
          )}

          {/* Step 3: Success Screen */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Password Berhasil Diubah</h2>
              <p className="mb-6 text-sm text-slate-500">
                Password Anda telah berhasil diperbarui. Silakan kembali login dengan password baru Anda.
              </p>
              <Link
                href="/login"
                className="block w-full text-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-3 text-sm font-semibold transition active:scale-[0.98]"
              >
                Kembali ke Login
              </Link>
            </div>
          )}

          {step !== 3 && (
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-center">
              <Link href="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:underline">
                Kembali ke Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
