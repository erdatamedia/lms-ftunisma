'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getApiErrorMessage } from '@/lib/api';
import { AlertBanner } from '@/components/ui/alert-banner';
import { isEmail, isPositiveIntegerString } from '@/lib/validators';

export default function RegisterPage() {
  const router = useRouter();

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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
