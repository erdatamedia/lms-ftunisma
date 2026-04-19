'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';

interface SubmissionReviewSectionProps {
  assignmentId: string;
}

type Filter = 'all' | 'ungraded' | 'graded';

function statusBadge(status: string, score: any) {
  if (score !== null && score !== undefined) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        Dinilai
      </span>
    );
  }
  if (status === 'LATE') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Terlambat
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
      Belum Dinilai
    </span>
  );
}

export function SubmissionReviewSection({ assignmentId }: SubmissionReviewSectionProps) {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [modalItem, setModalItem] = useState<any | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [logCounts, setLogCounts] = useState<Record<string, number>>({});
  const [modalLogs, setModalLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Token tidak ditemukan. Silakan login ulang.');
        return;
      }

      const { data } = await api.get(`/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setItems(data);

      const token2 = localStorage.getItem('accessToken');
      if (token2 && data.length > 0) {
        const counts: Record<string, number> = {};
        await Promise.all(
          data.map(async (sub: any) => {
            try {
              const { data: logs } = await api.get(`/submissions/${sub.id}/logs`, {
                headers: { Authorization: `Bearer ${token2}` },
              });
              counts[sub.id] = logs.filter((l: any) => l.action === 'UPDATED').length;
            } catch {
              counts[sub.id] = 0;
            }
          }),
        );
        setLogCounts(counts);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!assignmentId) return;
    fetchSubmissions();
  }, [assignmentId]);

  const openModal = async (item: any) => {
    setModalItem(item);
    setSaveError('');
    setModalLogs([]);
    setGradeForm({
      score: item.score !== null && item.score !== undefined ? String(item.score) : '',
      feedback: item.feedback || '',
    });

    setLogsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const { data: logs } = await api.get(`/submissions/${item.id}/logs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setModalLogs(logs);
      }
    } catch {
      setModalLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const closeModal = () => {
    setModalItem(null);
    setSaveError('');
    setModalLogs([]);
    setGradeForm({ score: '', feedback: '' });
  };

  const handleGrade = async () => {
    if (!modalItem) return;
    if (!gradeForm.score) {
      setSaveError('Nilai wajib diisi.');
      return;
    }

    try {
      setSaving(true);
      setSaveError('');

      const token = localStorage.getItem('accessToken');
      if (!token) { setSaveError('Token tidak ditemukan.'); return; }

      await api.patch(
        `/submissions/${modalItem.id}/grade`,
        { score: Number(gradeForm.score), feedback: gradeForm.feedback || undefined },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      await fetchSubmissions();
      closeModal();
    } catch (err) {
      setSaveError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const gradedCount = items.filter(
    (i) => i.score !== null && i.score !== undefined,
  ).length;

  const filteredItems = items.filter((item) => {
    if (filter === 'graded') return item.score !== null && item.score !== undefined;
    if (filter === 'ungraded') return item.score === null || item.score === undefined;
    return true;
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h5 className="font-semibold text-slate-900">Review Submission</h5>
            {!loading && (
              <p className="mt-0.5 text-xs text-slate-500">
                {gradedCount} sudah dinilai dari {items.length} submission
              </p>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        {!loading && items.length > 0 && (
          <div className="mt-3 flex gap-1">
            {(['all', 'ungraded', 'graded'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  filter === f
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'all' ? 'Semua' : f === 'ungraded' ? 'Belum Dinilai' : 'Sudah Dinilai'}
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                  {f === 'all'
                    ? items.length
                    : f === 'graded'
                    ? gradedCount
                    : items.length - gradedCount}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4">
        {loading && <p className="text-sm text-slate-500">Loading submission...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Desktop table */}
        {!loading && filteredItems.length > 0 && (
          <>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-4">Mahasiswa</th>
                    <th className="pb-2 pr-4">NIM</th>
                    <th className="pb-2 pr-4">Tgl Submit</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4 text-right">Nilai</th>
                    <th className="pb-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        <span>{item.student?.user?.name || '-'}</span>
                        {(logCounts[item.id] ?? 0) > 0 && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                            Diperbarui {logCounts[item.id]}×
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-slate-500">{item.student?.nim || '-'}</td>
                      <td className="py-3 pr-4 text-slate-500">
                        {new Date(item.submittedAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 pr-4">{statusBadge(item.status, item.score)}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-slate-900">
                        {item.score ?? '-'}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => openModal(item)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-900 hover:text-white hover:border-slate-900"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="space-y-3 md:hidden">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate font-medium text-slate-900">
                          {item.student?.user?.name || '-'}
                        </p>
                        {(logCounts[item.id] ?? 0) > 0 && (
                          <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                            Diperbarui {logCounts[item.id]}×
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{item.student?.nim || '-'}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(item.submittedAt).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {statusBadge(item.status, item.score)}
                      <span className="text-lg font-bold text-slate-900">
                        {item.score ?? '-'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => openModal(item)}
                    className="mt-3 w-full rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-900 hover:text-white hover:border-slate-900"
                  >
                    Review & Beri Nilai
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && filteredItems.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">
            {items.length === 0
              ? 'Belum ada submission untuk tugas ini.'
              : 'Tidak ada submission dengan filter ini.'}
          </p>
        )}
      </div>

      {/* Grading Modal */}
      {modalItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-lg rounded-t-2xl bg-white md:rounded-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="font-semibold text-slate-900">
                  {modalItem.student?.user?.name || '-'}
                </p>
                <p className="text-xs text-slate-500">{modalItem.student?.nim || '-'}</p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-4 px-5 py-4">
              {/* File info */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{modalItem.fileName || 'File submission'}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(modalItem.submittedAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}${modalItem.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-700"
                >
                  Download
                </a>
              </div>

              {modalItem.note && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Catatan Mahasiswa
                  </p>
                  <p className="text-sm text-slate-700">{modalItem.note}</p>
                </div>
              )}

              {/* Activity log timeline */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Riwayat Aktivitas
                </p>
                {logsLoading ? (
                  <p className="text-xs text-slate-400">Memuat riwayat...</p>
                ) : modalLogs.length === 0 ? (
                  <p className="text-xs text-slate-400">Belum ada riwayat aktivitas.</p>
                ) : (
                  <div className="space-y-0">
                    {modalLogs.map((log: any, idx: number) => (
                      <div key={log.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`h-3 w-3 rounded-full border-2 ${log.action === 'SUBMITTED' ? 'border-blue-500 bg-blue-100' : 'border-orange-500 bg-orange-100'}`} />
                          {idx < modalLogs.length - 1 && (
                            <div className="w-0.5 flex-1 bg-slate-200" />
                          )}
                        </div>
                        <div className="pb-3">
                          <p className="text-xs font-medium text-slate-700">
                            {log.action === 'SUBMITTED' ? 'Pertama kali mengumpulkan' : 'Memperbarui file submission'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {new Date(log.createdAt).toLocaleString('id-ID')}
                          </p>
                          {log.note && (
                            <p className="mt-0.5 text-[11px] text-slate-400">{log.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Score */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nilai <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={gradeForm.score}
                  onChange={(e) => setGradeForm((p) => ({ ...p, score: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-semibold focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  placeholder="0 – 100"
                />
              </div>

              {/* Feedback */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Feedback
                </label>
                <textarea
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm((p) => ({ ...p, feedback: e.target.value }))}
                  className="min-h-[100px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  placeholder="Tulis feedback untuk mahasiswa..."
                />
              </div>

              {saveError && (
                <p className="text-sm text-red-500">{saveError}</p>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 border-t border-slate-200 px-5 py-4">
              <button
                onClick={closeModal}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleGrade}
                disabled={saving}
                className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : 'Simpan Nilai'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
