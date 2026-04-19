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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
    </svg>
  );
}

function MeetingStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PUBLISHED: 'bg-green-100 text-green-700',
    DRAFT: 'bg-slate-100 text-slate-600',
    CLOSED: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
        headers: { Authorization: `Bearer ${token}` },
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

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setForm({ meetingNumber: '', title: '', topic: '', description: '', date: '', startTime: '', endTime: '' });
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
      {/* Create form */}
      {creating && canCreate && (
        <form
          className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
          onSubmit={handleCreate}
        >
          <p className="mb-4 font-semibold text-slate-800">Form Tambah Meeting</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Meeting Ke *</label>
              <input
                name="meetingNumber"
                value={form.meetingNumber}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                placeholder="1"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Judul *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                placeholder="Pertemuan 1"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Topik</label>
              <input
                name="topic"
                value={form.topic}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                placeholder="Pengenalan Algoritma"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal *</label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Jam Mulai</label>
              <input
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                placeholder="08:00"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Jam Selesai</label>
              <input
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                placeholder="09:40"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">Deskripsi</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="min-h-[90px] w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
              placeholder="Deskripsi meeting"
            />
          </div>
          <button
            type="submit"
            disabled={submitLoading}
            className="mt-4 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitLoading ? 'Menyimpan...' : 'Simpan Meeting'}
          </button>
        </form>
      )}

      {loading && <StatusMessage type="info" text="Loading meetings..." />}
      {error && <StatusMessage type="error" text={error} />}

      {/* Accordion meeting list */}
      <div className="mt-4 space-y-3">
        {items.map((meeting) => {
          const isOpen = expandedIds.has(meeting.id);

          return (
            <div
              key={meeting.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              {/* Accordion header — always visible, clickable */}
              <button
                onClick={() => toggleExpand(meeting.id)}
                className="w-full text-left"
                type="button"
              >
                <div className="flex items-center gap-3 px-4 py-4 transition hover:bg-slate-50 sm:px-5">
                  {/* Meeting number badge */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    {meeting.meetingNumber}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 leading-tight">
                        {meeting.title}
                      </p>
                      <MeetingStatusBadge status={meeting.status} />
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                      <span>
                        {new Date(meeting.date).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {(meeting.startTime || meeting.endTime) && (
                        <span>
                          {meeting.startTime || '-'} – {meeting.endTime || '-'}
                        </span>
                      )}
                      {meeting.topic && (
                        <span className="hidden sm:inline truncate max-w-[200px]">
                          {meeting.topic}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Counts */}
                  <div className="hidden items-center gap-3 sm:flex">
                    <span className="text-xs text-slate-400">
                      {meeting.attendanceSessions?.length ?? 0} sesi
                    </span>
                  </div>

                  <ChevronIcon open={isOpen} />
                </div>
              </button>

              {/* Accordion body */}
              {isOpen && (
                <div className="border-t border-slate-100 px-4 py-4 sm:px-5 space-y-4">
                  {meeting.topic && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Topik:</span> {meeting.topic}
                    </p>
                  )}
                  {meeting.description && (
                    <p className="text-sm text-slate-600">{meeting.description}</p>
                  )}

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
              )}
            </div>
          );
        })}

        {!loading && !error && items.length === 0 && (
          <EmptyState text="Belum ada meeting." />
        )}
      </div>
    </PageCard>
  );
}
