'use client';

import { useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { QrImage } from './qr-image';

interface AttendanceManagerProps {
  meetingId: string;
}

type SessionType = 'ENTRY' | 'EXIT';

function SessionBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Aktif
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Belum dibuka
    </span>
  );
}

export function AttendanceManager({ meetingId }: AttendanceManagerProps) {
  const [error, setError] = useState('');
  const [loadingType, setLoadingType] = useState<SessionType | null>(null);
  const [sessions, setSessions] = useState<Partial<Record<SessionType, any>>>({});
  const [activeView, setActiveView] = useState<SessionType | null>(null);

  const openSession = async (type: SessionType) => {
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
        { type, expiresInMinutes: 15 },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setSessions((prev) => ({ ...prev, [type]: data }));
      setActiveView(type);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoadingType(null);
    }
  };

  const activeSession = activeView ? sessions[activeView] : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h5 className="mb-4 font-semibold text-slate-900">Buka Sesi Absensi</h5>

      {/* Buttons with status badges */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(['ENTRY', 'EXIT'] as SessionType[]).map((type) => {
          const session = sessions[type];
          const isLoading = loadingType === type;
          const isOpened = Boolean(session);

          return (
            <div
              key={type}
              className={`rounded-xl border p-3 transition ${
                activeView === type ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">QR {type}</span>
                <SessionBadge active={isOpened} />
              </div>
              <button
                onClick={() => openSession(type)}
                disabled={loadingType !== null}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-60 ${
                  type === 'ENTRY' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-blue-700 hover:bg-blue-800'
                }`}
              >
                {isLoading
                  ? `Membuka ${type}...`
                  : isOpened
                  ? `Buka Ulang QR ${type}`
                  : `Buka QR ${type}`}
              </button>
              {isOpened && (
                <button
                  onClick={() => setActiveView(activeView === type ? null : type)}
                  className="mt-2 w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  {activeView === type ? 'Sembunyikan QR' : 'Tampilkan QR'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {/* QR Display */}
      {activeSession && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-slate-900">QR Absensi — {activeView}</p>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
              Kadaluarsa:{' '}
              {new Date(activeSession.expiresAt).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* QR besar + info — dua kolom di desktop */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* QR Code — memenuhi lebar di mobile */}
            <div className="flex justify-center lg:block">
              <QrImage value={activeSession.qrToken} />
            </div>

            <div className="space-y-3 lg:flex-1">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Tipe Sesi
                </p>
                <p className="font-semibold text-slate-900">{activeSession.type}</p>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Token QR
                </p>
                <p className="break-all rounded-lg bg-slate-50 p-2 font-mono text-xs text-slate-600">
                  {activeSession.qrToken}
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-800">
                  Tampilkan QR ini ke mahasiswa untuk scan absensi {activeSession.type}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
