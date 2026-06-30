'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage, API_URL } from '@/lib/api';

interface ManualAttendanceEditorProps {
  meetingId: string;
}

export function ManualAttendanceEditor({ meetingId }: ManualAttendanceEditorProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingIdType, setUpdatingIdType] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Token tidak ditemukan. Silakan login ulang.');
        return;
      }

      const { data } = await api.get(`/meetings/${meetingId}/attendance/manual`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (studentId: string, type: 'ENTRY' | 'EXIT', currentPresent: boolean) => {
    const actionKey = `${studentId}-${type}`;
    try {
      setUpdatingIdType(actionKey);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      await api.post(
        `/meetings/${meetingId}/attendance/manual`,
        {
          studentId,
          type,
          present: !currentPresent,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Update state locally
      setStudents((prev) =>
        prev.map((s) =>
          s.studentId === studentId
            ? { ...s, [type === 'ENTRY' ? 'entry' : 'exit']: !currentPresent }
            : s,
        ),
      );
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setUpdatingIdType(null);
    }
  };

  useEffect(() => {
    if (meetingId) {
      fetchStudents();
    }
  }, [meetingId]);

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.nim.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Presensi Manual oleh Dosen</h5>
          <p className="text-[11px] text-slate-500">Centang mahasiswa yang hadir secara langsung tanpa menunggu scan QR.</p>
        </div>
        <button
          onClick={fetchStudents}
          disabled={loading}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-650 transition hover:bg-slate-100 disabled:opacity-50 shrink-0 self-end sm:self-auto"
        >
          {loading ? 'Refreshing...' : 'Segarkan Daftar'}
        </button>
      </div>

      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
        <svg className="h-4 w-4 text-slate-400 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari mahasiswa berdasarkan nama atau NIM..."
          className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {loading && students.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">Memuat daftar mahasiswa...</p>
      ) : error ? (
        <p className="text-sm text-red-500 py-2">{error}</p>
      ) : filteredStudents.length === 0 ? (
        <p className="text-sm text-slate-550 py-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          {searchQuery ? 'Tidak ada mahasiswa yang cocok dengan pencarian.' : 'Tidak ada mahasiswa terdaftar di kelas ini.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[500px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-500">
                <th className="px-4 py-3">Mahasiswa</th>
                <th className="px-4 py-3">NIM</th>
                <th className="px-4 py-3 text-center w-36">Presensi Masuk (ENTRY)</th>
                <th className="px-4 py-3 text-center w-36">Presensi Keluar (EXIT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const entryKey = `${student.studentId}-ENTRY`;
                const exitKey = `${student.studentId}-EXIT`;
                const isEntryUpdating = updatingIdType === entryKey;
                const isExitUpdating = updatingIdType === exitKey;

                return (
                  <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {student.avatarUrl ? (
                          <img
                            src={student.avatarUrl.startsWith('http') ? student.avatarUrl : `${API_URL}${student.avatarUrl}`}
                            alt={student.name}
                            className="h-7 w-7 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-150 font-bold text-slate-700 text-[10px]">
                            {student.name[0].toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold text-slate-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-medium">{student.nim}</td>
                    <td className="px-4 py-3.5 text-center">
                      <label className="inline-flex items-center justify-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={student.entry}
                          disabled={updatingIdType !== null}
                          onChange={() => handleToggle(student.studentId, 'ENTRY', student.entry)}
                          className="h-4.5 w-4.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
                        />
                        {isEntryUpdating && (
                          <span className="ml-1 text-[10px] text-slate-400 animate-pulse">Saving...</span>
                        )}
                      </label>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <label className="inline-flex items-center justify-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={student.exit}
                          disabled={updatingIdType !== null}
                          onChange={() => handleToggle(student.studentId, 'EXIT', student.exit)}
                          className="h-4.5 w-4.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
                        />
                        {isExitUpdating && (
                          <span className="ml-1 text-[10px] text-slate-400 animate-pulse">Saving...</span>
                        )}
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
