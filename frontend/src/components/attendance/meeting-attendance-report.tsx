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
    <div className="mt-6 border-t border-slate-100 dark:border-slate-800/40 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rekap Absensi</h5>
        <button
          onClick={fetchItems}
          className="rounded-xl border border-slate-200/50 px-3 py-1.5 text-xs font-bold text-slate-650 transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading rekap...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-slate-500">Belum ada sesi absensi dibuka.</p>
      )}

      {!loading && items.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {([entrySession, exitSession] as any[]).map((session) => {
            if (!session) return null;
            const count = session.attendances?.length ?? 0;
            return (
              <div key={session.id} className="rounded-2xl border border-slate-200/50 bg-slate-50/50 dark:border-slate-800/50 dark:bg-slate-900/20 p-4">
                {/* Session header + summary */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        session.type === 'ENTRY'
                          ? 'bg-green-150 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                          : 'bg-blue-150 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                      }`}
                    >
                      {session.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      Batas:{' '}
                      {new Date(session.expiresAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span className="rounded-full bg-white dark:bg-slate-900 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-350 border border-slate-200/50 dark:border-slate-800">
                    {count} Hadir
                    {totalEnrolled ? ` / ${totalEnrolled}` : ''}
                  </span>
                </div>

                {/* Attendance list */}
                <div className="space-y-2">
                  {session.attendances?.map((att: any) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-900/60 p-3 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                        {(att.student?.user?.name || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                          {att.student?.user?.name || '-'}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {att.student?.nim || '-'} ·{' '}
                          {new Date(att.scannedAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {count === 0 && (
                    <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
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
