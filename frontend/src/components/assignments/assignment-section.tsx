'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { PdfDropzone } from '@/components/upload/pdf-dropzone';
import { SubmissionReviewSection } from '@/components/submissions/submission-review-section';

interface AssignmentSectionProps {
  classId: string;
  meetingId?: string;
  canCreate?: boolean;
  isStudent?: boolean;
}

function SubmissionStatusBadge({ submission }: { submission: any }) {
  if (!submission) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
        Belum Submit
      </span>
    );
  }
  if (submission.score !== null && submission.score !== undefined) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Dinilai ({submission.score})
      </span>
    );
  }
  if (submission.status === 'LATE') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
        Terlambat
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
      Sudah Submit
    </span>
  );
}

export function AssignmentSection({
  classId,
  meetingId,
  canCreate = false,
  isStudent = false,
}: AssignmentSectionProps) {
  const currentUser = useAuthStore((state) => state.user);
  const studentId = currentUser?.student?.id as string | undefined;

  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const [submitForms, setSubmitForms] = useState<
    Record<string, { note?: string; file?: File | null }>
  >({});

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Token tidak ditemukan. Silakan login ulang.');
        return;
      }

      const { data } = await api.get(`/classes/${classId}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const filteredItems = meetingId
        ? data.filter((item: any) => item.meetingId === meetingId)
        : data;

      setItems(filteredItems);

      if (isStudent) {
        setSubmitForms((prev) => {
          const next = { ...prev };
          filteredItems.forEach((item: any) => {
            const mySubmission = studentId
              ? item.submissions?.find((s: any) => s.studentId === studentId)
              : item.submissions?.[0];
            if (mySubmission) {
              next[item.id] = {
                note: mySubmission.note || '',
                file: prev[item.id]?.file ?? null,
              };
            }
          });
          return next;
        });
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!classId) return;
    fetchAssignments();
  }, [classId, meetingId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      if (!token) { setError('Token tidak ditemukan. Silakan login ulang.'); return; }

      const formData = new FormData();
      formData.append('title', title);
      if (description) formData.append('description', description);
      formData.append('dueDate', new Date(dueDate).toISOString());
      if (meetingId) formData.append('meetingId', meetingId);
      if (attachmentFile) formData.append('file', attachmentFile);

      await api.post(`/classes/${classId}/assignments`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTitle('');
      setDescription('');
      setDueDate('');
      setAttachmentFile(null);
      setCreating(false);
      await fetchAssignments();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmissionField = (
    assignmentId: string,
    field: string,
    value: string | File | null,
  ) => {
    setSubmitForms((prev) => ({
      ...prev,
      [assignmentId]: { ...(prev[assignmentId] || {}), [field]: value },
    }));
  };

  const handleSubmitAssignment = async (assignmentId: string) => {
    try {
      setError('');

      const token = localStorage.getItem('accessToken');
      if (!token) { setError('Token tidak ditemukan. Silakan login ulang.'); return; }

      const values = submitForms[assignmentId] || {};
      const assignment = items.find((item) => item.id === assignmentId);
      const mySubmission = studentId
        ? assignment?.submissions?.find((s: any) => s.studentId === studentId)
        : assignment?.submissions?.[0];
      const isUpdating = Boolean(mySubmission);

      if (!isUpdating && !values.file) {
        setError('File PDF submission wajib dipilih.');
        return;
      }

      const formData = new FormData();
      formData.append('note', values.note || '');
      if (values.file) formData.append('file', values.file);

      if (isUpdating) {
        await api.patch(`/submissions/${mySubmission.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post(`/assignments/${assignmentId}/submit`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await fetchAssignments();
      setSubmitForms((prev) => ({
        ...prev,
        [assignmentId]: { note: values.note || '', file: null },
      }));
      alert(isUpdating ? 'Submission berhasil diperbarui!' : 'Tugas berhasil dikumpulkan!');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const isDeadlinePassed = (dueDate: string) => new Date() > new Date(dueDate);

  const renderSubmissionForm = (item: any) => {
    const mySubmission = studentId
      ? item.submissions?.find((s: any) => s.studentId === studentId)
      : item.submissions?.[0];
    const submissionForm = submitForms[item.id] || {};
    const isReviewed =
      mySubmission?.score !== null &&
      mySubmission?.score !== undefined ||
      mySubmission?.status === 'REVIEWED';

    return (
      <div className="mt-5 space-y-4 rounded-xl bg-white p-4 ring-1 ring-slate-200">
        {/* Existing submission info */}
        {mySubmission && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Submission Terakhir
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(mySubmission.submittedAt).toLocaleString('id-ID')}
                </p>
              </div>
              <SubmissionStatusBadge submission={mySubmission} />
            </div>

            <div className="mt-2 flex items-center gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
              </svg>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}${mySubmission.fileUrl}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 truncate text-sm font-medium text-blue-600 hover:underline"
              >
                {mySubmission.fileName || 'Lihat file submission'}
              </a>
            </div>

            {isReviewed && mySubmission.feedback && (
              <div className="mt-2 rounded-lg bg-green-50 p-2">
                <p className="text-xs font-medium text-green-700">Feedback Dosen:</p>
                <p className="mt-0.5 text-xs text-green-600">{mySubmission.feedback}</p>
              </div>
            )}
          </div>
        )}

        {/* Update info banner */}
        {mySubmission && !isReviewed && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-sm font-medium text-amber-800">
              Anda sudah mengumpulkan tugas ini. Isi form di bawah untuk memperbarui submission Anda.
            </p>
          </div>
        )}

        {/* Reviewed notice */}
        {isReviewed && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
            <p className="text-sm font-medium text-green-800">
              Submission Anda sudah dinilai oleh dosen dan tidak dapat diubah lagi.
            </p>
          </div>
        )}

        {/* Form */}
        {!isReviewed && (
          <>
            <textarea
              value={submissionForm.note || ''}
              onChange={(e) => handleSubmissionField(item.id, 'note', e.target.value)}
              className="min-h-[80px] w-full rounded-xl border border-slate-300 px-3 py-3"
              placeholder="Catatan submission (opsional)"
            />

            <PdfDropzone
              label={mySubmission ? 'Ganti File Submission PDF' : 'File Submission PDF'}
              file={submissionForm.file || null}
              onFileChange={(file) => handleSubmissionField(item.id, 'file', file)}
              required={!mySubmission}
            />

            <button
              onClick={() => handleSubmitAssignment(item.id)}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
            >
              {mySubmission ? 'Update Submission' : 'Submit Tugas'}
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3">
        <div>
          <h5 className="font-semibold text-slate-900">Tugas</h5>
          <p className="text-sm text-slate-500">Daftar tugas pada class/meeting ini.</p>
        </div>

        {canCreate && (
          <button
            onClick={() => setCreating((prev) => !prev)}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {creating ? 'Tutup Form' : 'Tambah Tugas'}
          </button>
        )}
      </div>

      {creating && canCreate && (
        <form
          onSubmit={handleCreate}
          className="mx-4 mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-3"
            placeholder="Judul tugas"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[90px] w-full rounded-xl border border-slate-300 px-3 py-3"
            placeholder="Deskripsi tugas"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Deadline *
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-3"
              required
            />
          </div>
          <PdfDropzone
            label="Lampiran Tugas PDF"
            file={attachmentFile}
            onFileChange={setAttachmentFile}
          />
          <button
            type="submit"
            disabled={submitLoading}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitLoading ? 'Menyimpan...' : 'Simpan Tugas'}
          </button>
        </form>
      )}

      {loading && <p className="px-4 pt-4 text-sm text-slate-500">Loading tugas...</p>}
      {error && <p className="px-4 pt-4 text-sm text-red-500">{error}</p>}

      <div className="space-y-4 p-4">
        {items.map((item) => {
          const mySubmission = studentId
            ? item.submissions?.find((s: any) => s.studentId === studentId)
            : item.submissions?.[0];
          const deadlinePassed = isDeadlinePassed(item.dueDate);

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.description || '-'}</p>
                  <p className={`mt-1.5 text-xs font-medium ${deadlinePassed ? 'text-red-600' : 'text-slate-500'}`}>
                    Deadline: {new Date(item.dueDate).toLocaleString('id-ID')}
                    {deadlinePassed && ' — Sudah lewat'}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {isStudent && <SubmissionStatusBadge submission={mySubmission} />}
                  {!isStudent && (
                    <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                      <p className="text-xs text-slate-400">Submission</p>
                      <p className="mt-0.5 text-center font-semibold text-slate-900">
                        {item._count?.submissions ?? 0}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {item.attachmentUrl && (
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}${item.attachmentUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                >
                  <svg className="h-4 w-4 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                  </svg>
                  {item.attachmentName || 'Lihat lampiran'}
                </a>
              )}

              {isStudent && renderSubmissionForm(item)}

              {canCreate && !isStudent && (
                <div className="mt-4">
                  <SubmissionReviewSection assignmentId={item.id} />
                </div>
              )}
            </div>
          );
        })}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Belum ada tugas.
          </div>
        )}
      </div>
    </div>
  );
}
