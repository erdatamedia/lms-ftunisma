'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage, API_URL } from '@/lib/api';
import { motion } from 'framer-motion';
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

interface MeetingDetailsProps {
  meeting: any;
  classId: string;
  canCreate: boolean;
  isStudent: boolean;
}

function MeetingDetails({ meeting, classId, canCreate, isStudent }: MeetingDetailsProps) {
  const [activeTab, setActiveTab] = useState<'materials' | 'assignments' | 'attendance'>('materials');

  return (
    <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-5 sm:px-5 bg-slate-50/10 dark:bg-slate-900/10">
      {/* Meeting topic/description */}
      {(meeting.topic || meeting.description) && (
        <div className="mb-6 rounded-xl bg-slate-100/40 dark:bg-slate-800/20 p-4 border border-slate-200/40 dark:border-slate-700/30">
          {meeting.topic && (
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              Topik: {meeting.topic}
            </h4>
          )}
          {meeting.description && (
            <p className="text-xs text-slate-500 mt-1 dark:text-slate-400 whitespace-pre-wrap">{meeting.description}</p>
          )}
        </div>
      )}

      {/* Tabs Header - Styled Pill Buttons */}
      <div className="flex border-b border-slate-200/20 pb-px mb-6 gap-2 overflow-x-auto scrollbar-none">
        {(
          [
            {
              id: 'materials' as const,
              label: 'Materi & Bahan Ajar',
              icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              ),
            },
            {
              id: 'assignments' as const,
              label: 'Tugas Kelas',
              icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              ),
            },
            {
              id: 'attendance' as const,
              label: 'Presensi / Absensi',
              icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
          ]
        ).map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap active:scale-95 border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-white dark:text-slate-950 dark:border-white'
                  : 'text-slate-500 border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-950 dark:hover:text-white'
              }`}
              type="button"
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tabs Content Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm min-h-[160px]">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="space-y-4"
        >
          {activeTab === 'materials' && (
            <>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Materi & Bahan Ajar</h5>
              <MaterialSection meetingId={meeting.id} canCreate={canCreate} />
            </>
          )}

          {activeTab === 'assignments' && (
            <>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Daftar Tugas</h5>
              <AssignmentSection
                classId={classId}
                meetingId={meeting.id}
                canCreate={canCreate}
                isStudent={isStudent}
              />
            </>
          )}

          {activeTab === 'attendance' && (
            <>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Presensi Kelas</h5>
              {canCreate && (
                <div className="space-y-5">
                  <AttendanceManager meetingId={meeting.id} />
                  <MeetingAttendanceReport meetingId={meeting.id} />
                </div>
              )}
              {isStudent && (
                <div className="space-y-5">
                  <AttendanceScanner />
                  <MyAttendanceList meetingId={meeting.id} />
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
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
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    meetingNumber: '',
    title: '',
    topic: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
  });

  const handleThumbnailChange = async (meetingId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipe file tidak didukung. Harap pilih JPG, JPEG, PNG, atau WEBP.');
      return;
    }

    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      alert('Ukuran file maksimal 2MB.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken') || '';
      const formData = new FormData();
      formData.append('thumbnail', file);

      await api.post(`/meetings/${meetingId}/thumbnail`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      await fetchMeetings();
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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

      const response = await api.post(
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

      const createdMeeting = response.data;

      if (thumbnailFile) {
        const formData = new FormData();
        formData.append('thumbnail', thumbnailFile);
        await api.post(`/meetings/${createdMeeting.id}/thumbnail`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      setForm({ meetingNumber: '', title: '', topic: '', description: '', date: '', startTime: '', endTime: '' });
      setThumbnailFile(null);
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
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Thumbnail / Cover Pertemuan (Opsional)</label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
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
      <div className="mt-6 space-y-6 pb-4">
        {items.map((meeting) => {
          const isOpen = expandedIds.has(meeting.id);
          const gradientMap = [
            'from-emerald-500/10 to-teal-500/20 text-emerald-600 dark:text-emerald-400',
            'from-blue-500/10 to-indigo-500/20 text-blue-600 dark:text-blue-400',
            'from-purple-500/10 to-pink-500/20 text-purple-600 dark:text-purple-400',
            'from-orange-500/10 to-amber-500/20 text-orange-600 dark:text-orange-400',
            'from-rose-500/10 to-red-500/20 text-rose-600 dark:text-rose-400',
          ];
          const grad = gradientMap[meeting.meetingNumber % gradientMap.length];

          return (
            <div key={meeting.id} className="relative group/stack">
              {/* Bottom-most background card */}
              <div className="absolute inset-x-4 -bottom-3 h-10 rounded-2xl bg-slate-200/40 dark:bg-slate-800/10 border border-slate-300/10 dark:border-slate-700/10 transition-all duration-300 group-hover/stack:-bottom-4 group-hover/stack:scale-[0.97] -z-20" />
              {/* Middle background card */}
              <div className="absolute inset-x-2 -bottom-1.5 h-10 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-300/25 dark:border-slate-700/20 transition-all duration-300 group-hover/stack:-bottom-2.5 group-hover/stack:scale-[0.985] -z-10" />

              {/* Main Card */}
              <div className="premium-card relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300">
                {/* File Input for thumbnail */}
                {canCreate && (
                  <input
                    type="file"
                    id={`thumb-upload-${meeting.id}`}
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={(e) => handleThumbnailChange(meeting.id, e)}
                  />
                )}

                {/* Accordion header — always visible, clickable */}
                <button
                  onClick={() => toggleExpand(meeting.id)}
                  className="w-full text-left"
                  type="button"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-4 py-4 transition hover:bg-slate-50/50 sm:px-5">
                    {/* Left: Thumbnail area */}
                    <div className="relative h-24 w-full sm:w-40 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-100 dark:bg-slate-800">
                      {meeting.thumbnailUrl ? (
                        <img
                          src={meeting.thumbnailUrl.startsWith('http') ? meeting.thumbnailUrl : `${API_URL}${meeting.thumbnailUrl}`}
                          alt={meeting.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover/stack:scale-105"
                        />
                      ) : (
                        <div className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${grad}`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Pertemuan</span>
                          <span className="text-3xl font-black">{meeting.meetingNumber}</span>
                        </div>
                      )}

                      {canCreate && (
                        <label
                          htmlFor={`thumb-upload-${meeting.id}`}
                          className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/65 opacity-0 transition-opacity duration-300 hover:opacity-100 cursor-pointer text-white font-semibold text-[10px] uppercase tracking-wider z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <svg className="h-5 w-5 mb-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Ganti Cover
                        </label>
                      )}
                    </div>

                    {/* Middle: Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-base text-slate-900 leading-tight">
                          {meeting.title}
                        </p>
                        <MeetingStatusBadge status={meeting.status} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5 text-slate-450" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(meeting.date).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {(meeting.startTime || meeting.endTime) && (
                          <span className="flex items-center gap-1">
                            <svg className="h-3.5 w-3.5 text-slate-450" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {meeting.startTime || '-'} – {meeting.endTime || '-'}
                          </span>
                        )}
                        {meeting.topic && (
                          <span className="hidden sm:inline truncate max-w-[200px] bg-slate-100 dark:bg-slate-800 text-slate-650 px-2 py-0.5 rounded text-[10px] font-bold">
                            {meeting.topic}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Counts */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-slate-150 sm:border-0">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600">
                          {meeting.attendanceSessions?.length ?? 0} Sesi Hadir
                        </span>
                      </div>
                      <ChevronIcon open={isOpen} />
                    </div>
                  </div>
                </button>

                {/* Accordion body */}
                {isOpen && (
                  <MeetingDetails
                    meeting={meeting}
                    classId={classId}
                    canCreate={canCreate}
                    isStudent={isStudent}
                  />
                )}
            </div>
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
