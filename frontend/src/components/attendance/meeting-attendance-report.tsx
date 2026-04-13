'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';

export function MeetingAttendanceReport({ meetingId }: { meetingId: string }) {
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

      const { data } = await api.get(`/meetings/${meetingId}/attendance`, {
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
      <h5 className="font-semibold">Rekap Absensi Meeting</h5>

      {loading && <p className="mt-3 text-sm">Loading rekap...</p>}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-4 space-y-4">
        {items.map((session) => (
          <div key={session.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">{session.type}</p>
              <p className="text-xs text-slate-500">
                {new Date(session.expiresAt).toLocaleString('id-ID')}
              </p>
            </div>

            <div className="mt-3 space-y-2">
              {session.attendances?.map((attendance: any) => (
                <div key={attendance.id} className="rounded-md bg-slate-50 p-3">
                  <p className="font-medium">
                    {attendance.student?.user?.name || '-'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {attendance.student?.nim || '-'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(attendance.scannedAt).toLocaleString('id-ID')}
                  </p>
                </div>
              ))}

              {session.attendances?.length === 0 && (
                <p className="text-sm text-slate-500">Belum ada yang scan.</p>
              )}
            </div>
          </div>
        ))}

        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-slate-500">Belum ada sesi absensi.</p>
        )}
      </div>
    </div>
  );
}
