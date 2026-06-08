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
      <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-500/10 px-2 py-0.5 text-xs font-bold text-green-700 dark:text-green-400">
        Dinilai
      </span>
    );
  }
  if (status === 'NOT_SUBMITTED') {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-500 dark:text-slate-400">
        Belum Kumpul
      </span>
    );
  }
  if (status === 'LATE') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-700 dark:text-red-400">
        Terlambat
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
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

  const [inlineScores, setInlineScores] = useState<Record<string, string>>({});
  const [inlineFeedbacks, setInlineFeedbacks] = useState<Record<string, string>>({});
  const [savingAll, setSavingAll] = useState(false);

  const isChanged = (item: any) => {
    const currentScore = inlineScores[item.id] ?? '';
    const dbScore = item.score !== null && item.score !== undefined ? String(item.score) : '';
    const currentFeedback = inlineFeedbacks[item.id] ?? '';
    const dbFeedback = item.feedback || '';
    return currentScore !== dbScore || currentFeedback !== dbFeedback;
  };

  const handleSaveAll = async () => {
    const changedItems = items.filter(isChanged);
    if (changedItems.length === 0) return;

    for (const item of changedItems) {
      const scoreStr = inlineScores[item.id];
      if (!scoreStr) {
        alert(`Nilai untuk ${item.student?.user?.name || 'Mahasiswa'} wajib diisi jika diubah.`);
        return;
      }
      const scoreNum = Number(scoreStr);
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
        alert(`Nilai untuk ${item.student?.user?.name || 'Mahasiswa'} harus berupa angka antara 0 - 100.`);
        return;
      }
    }

    try {
      setSavingAll(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Token tidak ditemukan.');
        return;
      }

      await Promise.all(
        changedItems.map(async (item) => {
          const score = Number(inlineScores[item.id]);
          const feedback = inlineFeedbacks[item.id] || '';
          const isDirectGrade = item.id && item.id.startsWith('not-submitted-');

          if (isDirectGrade) {
            await api.post(
              `/assignments/${assignmentId}/submissions/grade-student`,
              { studentId: item.studentId, score, feedback },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } else {
            await api.patch(
              `/submissions/${item.id}/grade`,
              { score, feedback },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        })
      );

      await fetchSubmissions();
      alert('Semua perubahan nilai berhasil disimpan!');
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setSavingAll(false);
    }
  };

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

      const scores: Record<string, string> = {};
      const feedbacks: Record<string, string> = {};
      data.forEach((sub: any) => {
        scores[sub.id] = sub.score !== null && sub.score !== undefined ? String(sub.score) : '';
        feedbacks[sub.id] = sub.feedback || '';
      });
      setInlineScores(scores);
      setInlineFeedbacks(feedbacks);

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

    if (item.id && !item.id.startsWith('not-submitted-')) {
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

      const isDirectGrade = modalItem.id && modalItem.id.startsWith('not-submitted-');

      if (isDirectGrade) {
        await api.post(
          `/assignments/${assignmentId}/submissions/grade-student`,
          {
            studentId: modalItem.studentId,
            score: Number(gradeForm.score),
            feedback: gradeForm.feedback || undefined,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else {
        await api.patch(
          `/submissions/${modalItem.id}/grade`,
          { score: Number(gradeForm.score), feedback: gradeForm.feedback || undefined },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }

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

  const changedItems = items.filter(isChanged);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h5 className="font-semibold text-slate-900 dark:text-white">Review Submission</h5>
            {!loading && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
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
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f === 'all' ? 'Semua' : f === 'ungraded' ? 'Belum Dinilai' : 'Sudah Dinilai'}
                <span className="ml-1.5 rounded-full bg-slate-900/10 dark:bg-white/20 px-1.5 py-0.5 text-[10px]">
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
        {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading submission...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Banner Simpan Semua */}
        {changedItems.length > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 p-3.5 text-green-800 dark:text-green-400">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="text-sm font-medium">
                Terdapat {changedItems.length} perubahan nilai belum disimpan.
              </span>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={savingAll}
              className="rounded-lg bg-green-600 dark:bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 dark:hover:bg-green-600 active:bg-green-800 dark:active:bg-green-700 disabled:opacity-50 transition"
            >
              {savingAll ? 'Menyimpan...' : 'Simpan Semua'}
            </button>
          </div>
        )}

        {/* Desktop table */}
        {!loading && filteredItems.length > 0 && (
          <>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-4">Mahasiswa</th>
                    <th className="pb-2 pr-4">NIM</th>
                    <th className="pb-2 pr-4">Tgl Submit</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4 w-24">Nilai</th>
                    <th className="pb-2 pr-4">Catatan / Feedback</th>
                    <th className="pb-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{item.student?.user?.name || '-'}</span>
                          {item.fileUrl && (
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL}${item.fileUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              title={item.fileName || 'Download berkas'}
                              className="text-slate-400 hover:text-red-500 transition"
                            >
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            </a>
                          )}
                        </div>
                        {(logCounts[item.id] ?? 0) > 0 && (
                          <span className="mt-0.5 inline-flex items-center rounded bg-orange-100 dark:bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:text-orange-400">
                            Diperbarui {logCounts[item.id]}×
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{item.student?.nim || '-'}</td>
                      <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">
                        {item.submittedAt ? (
                          new Date(item.submittedAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-normal">Belum kumpul</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">{statusBadge(item.status, item.score)}</td>
                      <td className="py-3 pr-4">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={inlineScores[item.id] ?? ''}
                          onChange={(e) =>
                            setInlineScores((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          placeholder="-"
                          className="w-16 rounded border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-2 py-1 text-center font-medium focus:border-slate-900 dark:focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 text-sm"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          type="text"
                          value={inlineFeedbacks[item.id] ?? ''}
                          onChange={(e) =>
                            setInlineFeedbacks((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          placeholder="Beri catatan..."
                          className="w-full min-w-[120px] max-w-xs rounded border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-2 py-1 text-left focus:border-slate-900 dark:focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 text-sm"
                        />
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => openModal(item)}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 hover:border-slate-900 dark:hover:border-white"
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
              {filteredItems.map((item) => {
                const changed = isChanged(item);
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 transition ${
                      changed
                        ? 'border-amber-300 bg-amber-50/30 dark:border-amber-500/30 dark:bg-amber-500/5'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate font-semibold text-slate-900 dark:text-white text-sm">
                            {item.student?.user?.name || '-'}
                          </p>
                          {item.fileUrl && (
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL}${item.fileUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              title={item.fileName || 'Download berkas'}
                              className="text-slate-400 hover:text-red-500 transition"
                            >
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            </a>
                          )}
                          {(logCounts[item.id] ?? 0) > 0 && (
                            <span className="inline-flex items-center rounded bg-orange-100 dark:bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:text-orange-400">
                              {logCounts[item.id]}×
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.student?.nim || '-'}</p>
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                          {item.submittedAt ? (
                            new Date(item.submittedAt).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          ) : (
                            'Belum mengumpulkan'
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {statusBadge(item.status, item.score)}
                        {changed && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-100 dark:bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 animate-pulse">
                            Belum Disimpan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score and Feedback Inputs */}
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Nilai
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={inlineScores[item.id] ?? ''}
                          onChange={(e) =>
                            setInlineScores((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          placeholder="-"
                          className="w-full rounded border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-2 py-1.5 text-center font-semibold focus:border-slate-900 dark:focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Catatan / Feedback
                        </label>
                        <input
                          type="text"
                          value={inlineFeedbacks[item.id] ?? ''}
                          onChange={(e) =>
                            setInlineFeedbacks((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          placeholder="Catatan..."
                          className="w-full rounded border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-2.5 py-1.5 text-left focus:border-slate-900 dark:focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 text-sm"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => openModal(item)}
                      className="mt-3 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 hover:border-slate-900 dark:hover:border-white"
                    >
                      Detail Review
                    </button>
                  </div>
                );
              })}
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
              {modalItem.fileUrl ? (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{modalItem.fileName || 'File submission'}</p>
                      {modalItem.submittedAt && (
                        <p className="text-xs text-slate-400">
                          {new Date(modalItem.submittedAt).toLocaleString('id-ID')}
                        </p>
                      )}
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
              ) : modalItem.id?.startsWith('not-submitted-') ? (
                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-500/10 p-3.5 text-amber-800 dark:text-amber-400">
                  <p className="text-xs font-extrabold uppercase tracking-wide">Pengumpulan Kolektif / Fisik / Offline</p>
                  <p className="mt-1 text-[11px] leading-relaxed opacity-95">
                    Mahasiswa belum mengumpulkan tugas secara digital di LMS. Anda dapat memberikan nilai langsung untuk mencatat nilai pengumpulan fisik atau kolektif.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50 dark:bg-slate-900/50">
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">Dikumpulkan secara digital tanpa berkas (hanya catatan)</p>
                </div>
              )}

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
