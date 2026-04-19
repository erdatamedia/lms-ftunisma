'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { PdfDropzone } from '@/components/upload/pdf-dropzone';
import { SubmissionReviewSection } from '@/components/submissions/submission-review-section';

interface AssignmentSectionProps {
  classId: string;
  meetingId?: string;
  canCreate?: boolean;
  isStudent?: boolean;
}

export function AssignmentSection({
  classId,
  meetingId,
  canCreate = false,
  isStudent = false,
}: AssignmentSectionProps) {
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const filteredItems = meetingId
        ? data.filter((item: any) => item.meetingId === meetingId)
        : data;

      setItems(filteredItems);

      if (isStudent) {
        setSubmitForms((prev) => {
          const next = { ...prev };

          filteredItems.forEach((item: any) => {
            const mySubmission = item.submissions?.[0];

            if (mySubmission && !next[item.id]) {
              next[item.id] = {
                note: mySubmission.note || '',
                file: null,
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
      if (!token) {
        setError('Token tidak ditemukan. Silakan login ulang.');
        return;
      }

      const formData = new FormData();
      formData.append('title', title);
      if (description) formData.append('description', description);
      formData.append('dueDate', new Date(dueDate).toISOString());
      if (meetingId) formData.append('meetingId', meetingId);
      if (attachmentFile) formData.append('file', attachmentFile);

      await api.post(`/classes/${classId}/assignments`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      [assignmentId]: {
        ...(prev[assignmentId] || {}),
        [field]: value,
      },
    }));
  };

  const handleSubmitAssignment = async (assignmentId: string) => {
    try {
      setError('');

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Token tidak ditemukan. Silakan login ulang.');
        return;
      }

      const values = submitForms[assignmentId] || {};
      const assignment = items.find((item) => item.id === assignmentId);
      const mySubmission = assignment?.submissions?.[0];
      const isUpdating = Boolean(mySubmission);

      if (!isUpdating && !values.file) {
        setError('File PDF submission wajib dipilih.');
        return;
      }

      const formData = new FormData();
      formData.append('note', values.note || '');
      if (values.file) {
        formData.append('file', values.file);
      }

      if (isUpdating) {
        await api.patch(`/assignments/${assignmentId}/submission`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await api.post(`/assignments/${assignmentId}/submit`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      await fetchAssignments();
      setSubmitForms((prev) => ({
        ...prev,
        [assignmentId]: { note: values.note || '', file: null },
      }));
      alert(isUpdating ? 'Submission berhasil diperbarui' : 'Tugas berhasil dikumpulkan');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const renderSubmissionForm = (item: any) => {
    const mySubmission = item.submissions?.[0];
    const submissionForm = submitForms[item.id] || {};
    const isReviewed = mySubmission?.score !== null || mySubmission?.status === 'REVIEWED';

    return (
      <div className="mt-4 space-y-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
        {mySubmission && (
          <div className="space-y-1 text-sm">
            <p className="font-medium text-slate-900">
              Submission terakhir: {new Date(mySubmission.submittedAt).toLocaleString('id-ID')}
            </p>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}${mySubmission.fileUrl}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-blue-600 hover:underline"
            >
              {mySubmission.fileName || 'Lihat file submission'}
            </a>
            <p className="text-xs text-slate-500">
              {isReviewed
                ? 'Submission sudah dinilai dan tidak dapat diubah lagi.'
                : 'File salah diupload? Gunakan form di bawah untuk memperbarui file atau catatan submission Anda.'}
            </p>
          </div>
        )}

        <textarea
          value={submissionForm.note || ''}
          onChange={(e) =>
            handleSubmissionField(item.id, 'note', e.target.value)
          }
          className="min-h-[80px] w-full rounded-xl border border-slate-300 px-3 py-2"
          placeholder="Catatan submission"
          disabled={isReviewed}
        />

        <PdfDropzone
          label={mySubmission ? 'Ganti File Submission PDF' : 'File Submission PDF'}
          file={submissionForm.file || null}
          onFileChange={(file) =>
            handleSubmissionField(item.id, 'file', file)
          }
          required={!mySubmission}
          disabled={isReviewed}
        />

        <button
          onClick={() => handleSubmitAssignment(item.id)}
          disabled={isReviewed}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {mySubmission ? 'Update Submission' : 'Submit Tugas'}
        </button>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h5 className="font-semibold">Tugas</h5>
          <p className="text-sm text-slate-500">Daftar tugas pada class/meeting ini.</p>
        </div>

        {canCreate && (
          <button
            onClick={() => setCreating((prev) => !prev)}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            {creating ? 'Tutup Form' : 'Tambah Tugas'}
          </button>
        )}
      </div>

      {creating && canCreate && (
        <form onSubmit={handleCreate} className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Judul tugas"
            required
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[90px] w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Deskripsi tugas"
          />

          <div>
            <label className="mb-2 block text-sm font-medium">Deadline *</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
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
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitLoading ? 'Menyimpan...' : 'Simpan Tugas'}
          </button>
        </form>
      )}

      {loading && <p className="mt-4 text-sm">Loading tugas...</p>}
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.description || '-'}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Deadline: {new Date(item.dueDate).toLocaleString('id-ID')}
                </p>
              </div>

              <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                <p className="text-xs text-slate-400">Submission</p>
                <p className="mt-1 font-medium text-slate-900">
                  {item._count?.submissions ?? 0}
                </p>
              </div>
            </div>

            {item.attachmentUrl && (
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}${item.attachmentUrl}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-blue-600 hover:underline"
              >
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
        ))}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Belum ada tugas.
          </div>
        )}
      </div>
    </div>
  );
}
