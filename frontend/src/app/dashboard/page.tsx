'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AlertBanner } from '@/components/ui/alert-banner';
import { useAuthStore } from '@/store/auth';

function StatCard({
  label,
  value,
  icon,
  color = 'slate',
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'slate' | 'blue' | 'green' | 'amber' | 'purple';
}) {
  const colorMap = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${colorMap[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

function AttendanceBar({ entry, exit, total }: { entry: number; exit: number; total: number }) {
  if (!total) return <p className="text-xs text-slate-400">Belum ada pertemuan</p>;
  const pct = Math.round((entry / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Kehadiran Entry</span>
        <span className="font-medium text-slate-700">{entry}/{total} ({pct}%)</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400">Exit: {exit}/{total}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminData, setAdminData] = useState({
    classes: [] as any[],
    courses: [] as any[],
    lecturers: [] as any[],
    students: [] as any[],
  });
  const [lecturerClasses, setLecturerClasses] = useState<any[]>([]);
  const [studentProgress, setStudentProgress] = useState<any>(null);

  const getToken = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Token tidak ditemukan. Silakan login ulang.');
    return token;
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');

        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };

        if (user?.role === 'ADMIN') {
          const [classesRes, coursesRes, lecturersRes, studentsRes] = await Promise.all([
            api.get('/classes', { headers }),
            api.get('/courses', { headers }),
            api.get('/users/lecturers', { headers }),
            api.get('/users/students', { headers }),
          ]);
          setAdminData({
            classes: classesRes.data,
            courses: coursesRes.data,
            lecturers: lecturersRes.data,
            students: studentsRes.data,
          });
        }

        if (user?.role === 'LECTURER') {
          const classesRes = await api.get('/classes', { headers });
          setLecturerClasses(classesRes.data);
        }

        if (user?.role === 'STUDENT') {
          const progressRes = await api.get('/students/me/progress', { headers });
          setStudentProgress(progressRes.data);
        }
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (user) run();
  }, [user]);

  const adminSummary = useMemo(() => {
    const activeClasses = adminData.classes.filter((item) => item.isActive).length;
    const totalEnrollments = adminData.classes.reduce(
      (sum, item) => sum + (item.enrollments?.length || 0),
      0,
    );
    return {
      totalClasses: adminData.classes.length,
      activeClasses,
      totalCourses: adminData.courses.length,
      totalLecturers: adminData.lecturers.length,
      totalStudents: adminData.students.length,
      totalEnrollments,
    };
  }, [adminData]);

  const lecturerSummary = useMemo(() => {
    const totalStudents = lecturerClasses.reduce(
      (sum, item) => sum + (item.enrollments?.length || 0),
      0,
    );
    return {
      totalClasses: lecturerClasses.length,
      activeClasses: lecturerClasses.filter((item) => item.isActive).length,
      totalStudents,
    };
  }, [lecturerClasses]);

  const studentSummary = useMemo(() => {
    const classes = studentProgress?.classes || [];
    const totalMeetings = classes.reduce(
      (sum: number, item: any) => sum + (item.attendance?.totalMeetings || 0),
      0,
    );
    const totalSubmitted = classes.reduce(
      (sum: number, item: any) => sum + (item.assignments?.submittedCount || 0),
      0,
    );
    return { totalClasses: classes.length, totalMeetings, totalSubmitted };
  }, [studentProgress]);

  // Icons
  const IconClass = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
  const IconBook = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
  const IconUsers = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
  const IconEnroll = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
    </svg>
  );
  const IconCheck = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
  const IconCalendar = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
  const IconChart = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'LECTURER', 'STUDENT']}>
      <DashboardShell>
        <div className="space-y-6">
          {/* Page title */}
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Selamat datang, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {user?.role === 'ADMIN'
                ? 'Ringkasan data sistem LMS.'
                : user?.role === 'LECTURER'
                ? 'Ringkasan kelas yang kamu ampu.'
                : 'Ringkasan progress belajar kamu.'}
            </p>
          </div>

          {error && (
            <AlertBanner type="error" text={error} onClose={() => setError('')} />
          )}

          {loading && (
            <AlertBanner type="info" text="Memuat ringkasan dashboard..." />
          )}

          {/* ── ADMIN ── */}
          {!loading && user?.role === 'ADMIN' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StatCard label="Total Kelas" value={adminSummary.totalClasses} icon={IconClass} color="blue" />
                <StatCard label="Kelas Aktif" value={adminSummary.activeClasses} icon={IconCheck} color="green" />
                <StatCard label="Mata Kuliah" value={adminSummary.totalCourses} icon={IconBook} color="purple" />
                <StatCard label="Total Dosen" value={adminSummary.totalLecturers} icon={IconUsers} color="amber" />
                <StatCard label="Total Mahasiswa" value={adminSummary.totalStudents} icon={IconUsers} color="slate" />
                <StatCard label="Total Enroll" value={adminSummary.totalEnrollments} icon={IconEnroll} color="blue" />
              </div>

              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Aksi Cepat
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <QuickLink href="/admin/classes" title="Kelola Kelas" description="Buat, ubah, dan kelola class." icon={IconClass} />
                  <QuickLink href="/admin/courses" title="Kelola Courses" description="Kelola master data mata kuliah." icon={IconBook} />
                  <QuickLink href="/admin/users" title="Register Users" description="Daftarkan dosen dan mahasiswa." icon={IconUsers} />
                  <QuickLink href="/admin/enrollments" title="Enroll Mahasiswa" description="Masukkan mahasiswa ke class." icon={IconEnroll} />
                </div>
              </div>
            </div>
          )}

          {/* ── LECTURER ── */}
          {!loading && user?.role === 'LECTURER' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StatCard label="Total Kelas" value={lecturerSummary.totalClasses} icon={IconClass} color="blue" />
                <StatCard label="Kelas Aktif" value={lecturerSummary.activeClasses} icon={IconCheck} color="green" />
                <StatCard label="Total Mahasiswa" value={lecturerSummary.totalStudents} icon={IconUsers} color="amber" />
              </div>

              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Kelas Saya
                </h2>
                <div className="space-y-3">
                  {lecturerClasses.map((item) => (
                    <Link
                      key={item.id}
                      href={`/lecturer/classes/${item.id}`}
                      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {item.course?.name} — Kelas {item.className}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {item.academicYear} · {item.semesterType}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {item.enrollments?.length || 0} mahasiswa
                        </span>
                      </div>
                    </Link>
                  ))}

                  {lecturerClasses.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 py-8 text-center">
                      <p className="text-sm text-slate-400">Belum ada kelas yang diampu.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── STUDENT ── */}
          {!loading && user?.role === 'STUDENT' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StatCard label="Kelas Diikuti" value={studentSummary.totalClasses} icon={IconClass} color="blue" />
                <StatCard label="Total Meeting" value={studentSummary.totalMeetings} icon={IconCalendar} color="purple" />
                <StatCard label="Tugas Terkumpul" value={studentSummary.totalSubmitted} icon={IconCheck} color="green" />
              </div>

              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Kelas Saya
                </h2>
                <div className="space-y-3">
                  {(studentProgress?.classes || []).map((item: any, index: number) => (
                    <Link
                      key={item.class?.id || index}
                      href={`/student/classes/${item.class?.id}`}
                      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">
                            {item.class?.course?.name} — Kelas {item.class?.className}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {item.class?.academicYear} · {item.class?.semesterType}
                          </p>
                          <div className="mt-3">
                            <AttendanceBar
                              entry={item.attendance?.entryCount || 0}
                              exit={item.attendance?.exitCount || 0}
                              total={item.attendance?.totalMeetings || 0}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {item.assignments?.submittedCount || 0} tugas
                          </span>
                          {item.assignments?.averageScore != null && (
                            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                              Avg: {item.assignments.averageScore}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}

                  {(studentProgress?.classes || []).length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 py-8 text-center">
                      <p className="text-sm text-slate-400">Belum ada kelas. Bergabung via kode enroll.</p>
                      <Link
                        href="/student/classes"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600"
                      >
                        Gabung Kelas →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
