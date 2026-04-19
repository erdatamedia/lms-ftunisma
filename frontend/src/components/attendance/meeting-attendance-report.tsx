'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';

export function MeetingAttendanceReport({ meetingId }: { meetingId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalEnrolled, setTotalEnrolled] = useState<number | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Token tidak ditemukan. Silakan login ulang.');
        return;
      }

      const { data } = await api.get(`/meetings/${meetingId}/attendance`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setItems(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!meetingId) return;
    fetchItems();
  }, [meetingId]);

  const entrySession = items.find((s) => s.type === 'ENTRY');
  const exitSession = items.find((s) => s.type === 'EXIT');

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h5 className="font-semibold text-slate-900">Rekap Absensi</h5>
        <button
          onClick={fetchItems}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading rekap...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-slate-400">Belum ada sesi absensi dibuka.</p>
      )}

      {!loading && items.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {([entrySession, exitSession] as any[]).map((session) => {
            if (!session) return null;
            const count = session.attendances?.length ?? 0;
            return (
              <div key={session.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                {/* Session header + summary */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        session.type === 'ENTRY'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {session.type}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(session.expiresAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {count} hadir
                    {totalEnrolled ? ` dari ${totalEnrolled}` : ''}
                  </span>
                </div>

                {/* Attendance list */}
                <div className="space-y-1.5">
                  {session.attendances?.map((att: any) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100"
                    >
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {(att.student?.user?.name || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {att.student?.user?.name || '-'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {att.student?.nim || '-'} ·{' '}
                          {new Date(att.scannedAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {count === 0 && (
                    <p className="py-2 text-center text-xs text-slate-400">
                      Belum ada mahasiswa yang scan.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
