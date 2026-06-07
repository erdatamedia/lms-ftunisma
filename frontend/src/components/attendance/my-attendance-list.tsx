'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';

export function MyAttendanceList({ meetingId }: { meetingId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Token tidak ditemukan. Silakan login ulang.');
        return;
      }

      const { data } = await api.get(`/meetings/${meetingId}/my-attendance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  return (
    <div className="mt-6 border-t border-slate-100 dark:border-slate-800/40 pt-6">
      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Absensi Saya</h5>

      {loading && <p className="text-sm text-slate-500">Loading absensi...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-800/50 p-3.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40"
          >
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{item.attendanceSession?.type}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 dark:text-slate-500">
                Device: {item.deviceInfo || '-'}
              </p>
            </div>
            <div className="text-left sm:text-right mt-1.5 sm:mt-0">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                {new Date(item.scannedAt).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        ))}

        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-slate-500">Belum ada absensi pada meeting ini.</p>
        )}
      </div>
    </div>
  );
}
