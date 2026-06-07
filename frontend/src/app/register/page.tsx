'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getApiErrorMessage } from '@/lib/api';
import { AlertBanner } from '@/components/ui/alert-banner';
import { isEmail, isPositiveIntegerString } from '@/lib/validators';

export default function RegisterPage() {
  const router = useRouter();

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

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    nim: '',
    studyProgram: 'Informatika',
    faculty: 'Fakultas Teknik',
    yearEntry: '2024',
  });

  const validationError = useMemo(() => {
    if (!form.name.trim()) return 'Nama wajib diisi.';
    if (!form.email.trim()) return 'Email wajib diisi.';
    if (!isEmail(form.email.trim())) return 'Format email tidak valid.';
    if (!form.password.trim()) return 'Password wajib diisi.';
    if (form.password.trim().length < 6) return 'Password minimal 6 karakter.';
    if (!form.nim.trim()) return 'NIM wajib diisi.';
    if (!form.studyProgram.trim()) return 'Program studi wajib diisi.';
    if (!form.faculty.trim()) return 'Fakultas wajib diisi.';
    if (!isPositiveIntegerString(form.yearEntry)) {
      return 'Tahun masuk harus berupa angka bulat positif.';
    }
    return '';
  }, [form]);

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

      await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        nim: form.nim.trim(),
        studyProgram: form.studyProgram.trim(),
        faculty: form.faculty.trim(),
        yearEntry: Number(form.yearEntry),
      });

      setSuccess('Registrasi berhasil. Silakan login dengan akun mahasiswa Anda.');

      setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-transparent px-4 py-10">
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

      <div className="w-full max-w-2xl premium-card rounded-2xl p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Registrasi Mahasiswa
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Buat akun mahasiswa untuk mengakses LMS FT UNISMA.
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <AlertBanner type="error" text={error} onClose={() => setError('')} />
          </div>
        )}

        {success && (
          <div className="mb-4">
            <AlertBanner type="success" text={success} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nama Lengkap
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                placeholder="Nama lengkap"
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
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                placeholder="Minimal 6 karakter"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                NIM
              </label>
              <input
                name="nim"
                value={form.nim}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                placeholder="NIM"
                required
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
                placeholder="Informatika"
                required
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
                placeholder="Fakultas Teknik"
                required
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
                placeholder="2024"
                required
              />
            </div>
          </div>

          {validationError && <AlertBanner type="warning" text={validationError} />}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !!validationError}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {submitting ? 'Mendaftarkan...' : 'Daftar Mahasiswa'}
            </button>

            <Link
              href="/login"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Kembali ke Login
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
