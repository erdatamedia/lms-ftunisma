'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageCard } from '@/components/ui/page-card';
import { AlertBanner } from '@/components/ui/alert-banner';
import { useAuthStore } from '@/store/auth';

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
          const [classesRes, coursesRes, lecturersRes, studentsRes] =
            await Promise.all([
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

    if (user) {
      run();
    }
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

    return {
      totalClasses: classes.length,
      totalMeetings,
      totalSubmitted,
    };
  }, [studentProgress]);

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'LECTURER', 'STUDENT']}>
      <DashboardShell>
        <PageCard
          title="Dashboard"
          description="Ringkasan cepat sesuai role yang sedang login."
        >
          {error && (
            <div className="mb-4">
              <AlertBanner type="error" text={error} onClose={() => setError('')} />
            </div>
          )}

          {loading && (
            <div className="mb-4">
              <AlertBanner type="info" text="Memuat ringkasan dashboard..." />
            </div>
          )}

          {!loading && user?.role === 'ADMIN' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard label="Total Classes" value={adminSummary.totalClasses} />
                <SummaryCard label="Class Aktif" value={adminSummary.activeClasses} />
                <SummaryCard label="Total Courses" value={adminSummary.totalCourses} />
                <SummaryCard label="Total Dosen" value={adminSummary.totalLecturers} />
                <SummaryCard label="Total Mahasiswa" value={adminSummary.totalStudents} />
                <SummaryCard label="Total Enrollment" value={adminSummary.totalEnrollments} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <QuickLink
                  href="/admin/classes"
                  title="Kelola Kelas"
                  description="Buat, ubah, dan kelola class."
                />
                <QuickLink
                  href="/admin/courses"
                  title="Kelola Courses"
                  description="Kelola master data mata kuliah."
                />
                <QuickLink
                  href="/admin/users"
                  title="Register Users"
                  description="Daftarkan dosen dan mahasiswa."
                />
                <QuickLink
                  href="/admin/enrollments"
                  title="Enroll Mahasiswa"
                  description="Masukkan mahasiswa ke class."
                />
              </div>
            </div>
          )}

          {!loading && user?.role === 'LECTURER' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard label="Total Classes" value={lecturerSummary.totalClasses} />
                <SummaryCard label="Class Aktif" value={lecturerSummary.activeClasses} />
                <SummaryCard label="Total Mahasiswa" value={lecturerSummary.totalStudents} />
              </div>

              <div className="grid gap-4">
                {lecturerClasses.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {item.course?.name} - Kelas {item.className}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.academicYear} · {item.semesterType}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          Mahasiswa: {item.enrollments?.length || 0}
                        </p>
                      </div>

                      <Link
                        href={`/lecturer/classes/${item.id}`}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                      >
                        Buka Kelas
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && user?.role === 'STUDENT' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard label="Total Classes" value={studentSummary.totalClasses} />
                <SummaryCard label="Total Meetings" value={studentSummary.totalMeetings} />
                <SummaryCard label="Tugas Terkumpul" value={studentSummary.totalSubmitted} />
              </div>

              <div className="grid gap-4">
                {(studentProgress?.classes || []).map((item: any, index: number) => (
                  <div
                    key={item.class?.id || index}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {item.class?.course?.name} - Kelas {item.class?.className}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.class?.academicYear} · {item.class?.semesterType}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          Entry: {item.attendance?.entryCount || 0} · Exit: {item.attendance?.exitCount || 0}
                        </p>
                        <p className="text-sm text-slate-600">
                          Submitted: {item.assignments?.submittedCount || 0} · Avg Score: {item.assignments?.averageScore ?? '-'}
                        </p>
                      </div>

                      <Link
                        href={`/student/classes/${item.class?.id}`}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                      >
                        Buka Kelas
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </PageCard>
      </DashboardShell>
    </ProtectedRoute>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </Link>
  );
}
