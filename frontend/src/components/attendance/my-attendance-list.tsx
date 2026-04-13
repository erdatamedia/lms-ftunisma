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
    <div className="rounded-lg border p-4">
      <h5 className="font-semibold">Absensi Saya</h5>

      {loading && <p className="mt-3 text-sm">Loading absensi...</p>}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border p-3">
            <p className="font-medium">{item.attendanceSession?.type}</p>
            <p className="text-sm text-slate-500">
              {new Date(item.scannedAt).toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-slate-500">
              {item.deviceInfo || '-'}
            </p>
          </div>
        ))}

        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-slate-500">Belum ada absensi pada meeting ini.</p>
        )}
      </div>
    </div>
  );
}
