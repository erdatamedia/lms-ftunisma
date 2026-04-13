'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusMessage } from '@/components/ui/status-message';

interface SubmissionReviewSectionProps {
  assignmentId: string;
}

export function SubmissionReviewSection({
  assignmentId,
}: SubmissionReviewSectionProps) {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [gradingId, setGradingId] = useState<string | null>(null);

  const [gradeForms, setGradeForms] = useState<
    Record<string, { score: string; feedback: string }>
  >({});

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setItems(data);

      const nextForms: Record<string, { score: string; feedback: string }> = {};
      data.forEach((item: any) => {
        nextForms[item.id] = {
          score: item.score !== null && item.score !== undefined ? String(item.score) : '',
          feedback: item.feedback || '',
        };
      });
      setGradeForms(nextForms);
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

  const setField = (submissionId: string, field: 'score' | 'feedback', value: string) => {
    setGradeForms((prev) => ({
      ...prev,
      [submissionId]: {
        score: prev[submissionId]?.score || '',
        feedback: prev[submissionId]?.feedback || '',
        [field]: value,
      },
    }));
  };

  const handleGrade = async (submissionId: string) => {
    try {
      setError('');
      setGradingId(submissionId);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Token tidak ditemukan. Silakan login ulang.');
        return;
      }

      const form = gradeForms[submissionId];
      if (!form?.score) {
        setError('Nilai wajib diisi.');
        return;
      }

      await api.patch(
        `/submissions/${submissionId}/grade`,
        {
          score: Number(form.score),
          feedback: form.feedback || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await fetchSubmissions();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setGradingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <h5 className="font-semibold text-slate-900">Review Submission</h5>
        <p className="mt-1 text-sm text-slate-500">
          Lihat file mahasiswa, beri nilai, dan feedback.
        </p>
      </div>

      {loading && <StatusMessage type="info" text="Loading submission..." />}
      {error && <StatusMessage type="error" text={error} />}

      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900">
                  {item.student?.user?.name || '-'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.student?.nim || '-'} · {item.student?.user?.email || '-'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Submit: {new Date(item.submittedAt).toLocaleString('id-ID')}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Status: {item.status}
                </p>
              </div>

              <div className="rounded-xl bg-white px-3 py-2 text-right ring-1 ring-slate-200">
                <p className="text-xs text-slate-400">Nilai Saat Ini</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {item.score ?? '-'}
                </p>
              </div>
            </div>

            {item.note && (
              <div className="mt-4 rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Catatan Mahasiswa
                </p>
                <p className="mt-1 text-sm text-slate-700">{item.note}</p>
              </div>
            )}

            <div className="mt-4">
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}${item.fileUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Download PDF Submission
              </a>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[140px_1fr]">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nilai
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={gradeForms[item.id]?.score || ''}
                  onChange={(e) => setField(item.id, 'score', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  placeholder="0 - 100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Feedback
                </label>
                <textarea
                  value={gradeForms[item.id]?.feedback || ''}
                  onChange={(e) => setField(item.id, 'feedback', e.target.value)}
                  className="min-h-[96px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  placeholder="Tulis feedback untuk mahasiswa"
                />
              </div>
            </div>

            <button
              onClick={() => handleGrade(item.id)}
              disabled={gradingId === item.id}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {gradingId === item.id ? 'Menyimpan Nilai...' : 'Simpan Nilai'}
            </button>
          </div>
        ))}

        {!loading && !error && items.length === 0 && (
          <EmptyState text="Belum ada submission untuk tugas ini." />
        )}
      </div>
    </div>
  );
}
