'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { MaterialSection } from '@/components/materials/material-section';
import { AssignmentSection } from '@/components/assignments/assignment-section';
import { AttendanceManager } from '@/components/attendance/attendance-manager';
import { AttendanceScanner } from '@/components/attendance/attendance-scanner';
import { MyAttendanceList } from '@/components/attendance/my-attendance-list';
import { MeetingAttendanceReport } from '@/components/attendance/meeting-attendance-report';
import { PageCard } from '@/components/ui/page-card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusMessage } from '@/components/ui/status-message';

interface MeetingSectionProps {
  classId: string;
  canCreate?: boolean;
  isStudent?: boolean;
}

export function MeetingSection({
  classId,
  canCreate = false,
  isStudent = false,
}: MeetingSectionProps) {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [form, setForm] = useState({
    meetingNumber: '',
    title: '',
    topic: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
  });

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Token tidak ditemukan. Silakan login ulang.');
        return;
      }

      const { data } = await api.get(`/classes/${classId}/meetings`, {
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
    if (!classId) return;
    fetchMeetings();
  }, [classId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

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

      await api.post(
        `/classes/${classId}/meetings`,
        {
          meetingNumber: Number(form.meetingNumber),
          title: form.title,
          topic: form.topic || undefined,
          description: form.description || undefined,
          date: new Date(form.date).toISOString(),
          startTime: form.startTime || undefined,
          endTime: form.endTime || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setForm({
        meetingNumber: '',
        title: '',
        topic: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
      });

      setCreating(false);
      await fetchMeetings();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <PageCard
      title="Meetings"
      description="Daftar pertemuan pada kelas ini."
      action={
        canCreate ? (
          <button
            onClick={() => setCreating((prev) => !prev)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {creating ? 'Tutup Form' : 'Tambah Meeting'}
          </button>
        ) : null
      }
    >
      {creating && canCreate && (
        <form className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5" onSubmit={handleCreate}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Meeting Ke
              </label>
              <input
                name="meetingNumber"
                value={form.meetingNumber}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                placeholder="1"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Judul
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                placeholder="Pertemuan 1"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Topik
              </label>
              <input
                name="topic"
                value={form.topic}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                placeholder="Pengenalan Algoritma"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tanggal
              </label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Jam Mulai
              </label>
              <input
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                placeholder="08:00"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Jam Selesai
              </label>
              <input
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                placeholder="09:40"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Deskripsi
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="min-h-[100px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              placeholder="Deskripsi meeting"
            />
          </div>

          <button
            type="submit"
            disabled={submitLoading}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitLoading ? 'Menyimpan...' : 'Simpan Meeting'}
          </button>
        </form>
      )}

      {loading && <StatusMessage type="info" text="Loading meetings..." />}
      {error && <StatusMessage type="error" text={error} />}

      <div className="mt-6 space-y-5">
        {items.map((meeting) => (
          <div
            key={meeting.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    Pertemuan {meeting.meetingNumber} - {meeting.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {meeting.topic || 'Tanpa topik'}
                  </p>
                </div>

                <div className="rounded-xl bg-white px-4 py-3 text-right shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-medium text-slate-800">
                    {new Date(meeting.date).toLocaleDateString('id-ID')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {meeting.startTime || '-'} - {meeting.endTime || '-'}
                  </p>
                </div>
              </div>

              {meeting.description && (
                <p className="mt-3 max-w-3xl text-sm text-slate-600">
                  {meeting.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                  Attendance sessions: {meeting.attendanceSessions?.length || 0}
                </span>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5">
              {canCreate && <AttendanceManager meetingId={meeting.id} />}
              {canCreate && <MeetingAttendanceReport meetingId={meeting.id} />}

              {isStudent && (
                <>
                  <AttendanceScanner />
                  <MyAttendanceList meetingId={meeting.id} />
                </>
              )}

              <MaterialSection meetingId={meeting.id} canCreate={canCreate} />
              <AssignmentSection
                classId={classId}
                meetingId={meeting.id}
                canCreate={canCreate}
                isStudent={isStudent}
              />
            </div>
          </div>
        ))}

        {!loading && !error && items.length === 0 && (
          <EmptyState text="Belum ada meeting." />
        )}
      </div>
    </PageCard>
  );
}
