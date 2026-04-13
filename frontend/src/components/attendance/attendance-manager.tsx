'use client';

import { useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { QrImage } from './qr-image';

interface AttendanceManagerProps {
  meetingId: string;
}

export function AttendanceManager({ meetingId }: AttendanceManagerProps) {
  const [error, setError] = useState('');
  const [loadingType, setLoadingType] = useState<'ENTRY' | 'EXIT' | null>(null);
  const [session, setSession] = useState<any>(null);

  const openSession = async (type: 'ENTRY' | 'EXIT') => {
    try {
      setError('');
      setLoadingType(type);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Token tidak ditemukan. Silakan login ulang.');
        return;
      }

      const { data } = await api.post(
        `/meetings/${meetingId}/attendance-sessions/open`,
        {
          type,
          expiresInMinutes: 15,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSession(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => openSession('ENTRY')}
          disabled={loadingType !== null}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {loadingType === 'ENTRY' ? 'Membuka ENTRY...' : 'Buka QR ENTRY'}
        </button>

        <button
          onClick={() => openSession('EXIT')}
          disabled={loadingType !== null}
          className="rounded-md bg-slate-700 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {loadingType === 'EXIT' ? 'Membuka EXIT...' : 'Buka QR EXIT'}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      {session && (
        <div className="mt-6 grid gap-4 md:grid-cols-[260px_1fr]">
          <div>
            <QrImage value={session.qrToken} />
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">Tipe Sesi</p>
              <p className="font-medium">{session.type}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">QR Token</p>
              <div className="rounded-lg bg-slate-50 p-3 text-xs break-all">
                {session.qrToken}
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500">Kadaluarsa</p>
              <p className="font-medium">
                {new Date(session.expiresAt).toLocaleString('id-ID')}
              </p>
            </div>

            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              Tampilkan QR ini ke mahasiswa untuk scan absensi {session.type}.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
