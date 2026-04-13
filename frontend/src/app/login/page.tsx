'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getApiErrorMessage } from '@/lib/api';
import { AlertBanner } from '@/components/ui/alert-banner';
import { isEmail } from '@/lib/validators';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validationError = useMemo(() => {
    if (!form.email.trim()) return 'Email wajib diisi.';
    if (!isEmail(form.email.trim())) return 'Format email tidak valid.';
    if (!form.password.trim()) return 'Password wajib diisi.';
    return '';
  }, [form]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) return;

    try {
      setSubmitting(true);
      setError('');

      const { data } = await api.post('/auth/login', {
        email: form.email.trim(),
        password: form.password,
      });

      setAuth(data.accessToken, data.user);

      if (data.user?.role === 'ADMIN') {
        router.replace('/dashboard');
        return;
      }

      if (data.user?.role === 'LECTURER') {
        router.replace('/dashboard');
        return;
      }

      if (data.user?.role === 'STUDENT') {
        router.replace('/dashboard');
        return;
      }

      router.replace('/dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Login LMS</h1>
          <p className="mt-2 text-sm text-slate-500">
            Masuk ke sistem LMS Informatika FT UNISMA.
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <AlertBanner type="error" text={error} onClose={() => setError('')} />
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="Masukkan password"
              required
            />
          </div>

          {validationError && <AlertBanner type="warning" text={validationError} />}

          <button
            type="submit"
            disabled={submitting || !!validationError}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? 'Masuk...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">
            Belum punya akun mahasiswa?
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Daftar mandiri untuk akun mahasiswa melalui halaman registrasi.
          </p>

          <Link
            href="/register"
            className="mt-3 inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
          >
            Daftar Mahasiswa
          </Link>
        </div>
      </div>
    </main>
  );
}
