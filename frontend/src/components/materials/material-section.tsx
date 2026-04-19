'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { PdfDropzone } from '@/components/upload/pdf-dropzone';

interface MaterialSectionProps {
  meetingId: string;
  canCreate?: boolean;
}

export function MaterialSection({
  meetingId,
  canCreate = false,
}: MaterialSectionProps) {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Token tidak ditemukan. Silakan login ulang.');
        return;
      }

      const { data } = await api.get(`/meetings/${meetingId}/materials`, {
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
    fetchMaterials();
  }, [meetingId]);

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

      if (!file) {
        setError('File PDF wajib dipilih.');
        return;
      }

      const formData = new FormData();
      formData.append('title', title);
      if (description) formData.append('description', description);
      formData.append('file', file);

      await api.post(`/meetings/${meetingId}/materials`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTitle('');
      setDescription('');
      setFile(null);
      setCreating(false);
      await fetchMaterials();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3">
        <div>
          <h5 className="font-semibold text-slate-900">Materi</h5>
          <p className="text-sm text-slate-500">Materi pada meeting ini.</p>
        </div>

        {canCreate && (
          <button
            onClick={() => setCreating((prev) => !prev)}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {creating ? 'Tutup Form' : 'Tambah Materi'}
          </button>
        )}
      </div>

      {creating && canCreate && (
        <form onSubmit={handleCreate} className="mx-4 mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Judul materi"
            required
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[90px] w-full rounded-lg border px-3 py-2"
            placeholder="Deskripsi materi"
          />

          <PdfDropzone
            label="File Materi PDF"
            file={file}
            onFileChange={setFile}
            required
          />

          <button
            type="submit"
            disabled={submitLoading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {submitLoading ? 'Mengunggah...' : 'Simpan Materi'}
          </button>
        </form>
      )}

      {loading && <p className="px-4 pt-4 text-sm text-slate-500">Loading materi...</p>}
      {error && <p className="px-4 pt-4 text-sm text-red-500">{error}</p>}

      <div className="space-y-3 p-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-slate-500">{item.description || '-'}</p>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}${item.fileUrl}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            >
              {item.fileName || 'Buka file'}
            </a>
          </div>
        ))}

        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-slate-500">Belum ada materi.</p>
        )}
      </div>
    </div>
  );
}
