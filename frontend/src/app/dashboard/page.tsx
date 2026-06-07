'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AlertBanner } from '@/components/ui/alert-banner';
import { useAuthStore } from '@/store/auth';
import { useSearchStore } from '@/store/search';

// ── SVG Circular Progress Helper ──
function CircularProgress({ percent, color }: { percent: number; color: string }) {
  const radius = 18;
  const stroke = 3;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(Math.max(percent, 0), 100) / 100) * circ;
  return (
    <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center">
      <svg className="h-full w-full rotate-[-90deg]">
        <circle
          cx="24"
          cy="24"
          r={radius}
          className="stroke-slate-200/50 dark:stroke-slate-800/40 fill-transparent"
          strokeWidth={stroke}
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          className={`${color} fill-transparent transition-all duration-300`}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[9px] font-bold text-slate-800 dark:text-slate-100">{Math.round(percent)}%</span>
    </div>
  );
}

// ── Stat Card Component ──
function StatCard({
  label,
  value,
  description,
  percent,
  icon,
  color = 'blue',
}: {
  label: string;
  value: string | number;
  description: string;
  percent: number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'emerald';
}) {
  const iconColorMap = {
    blue: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400',
    amber: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
  };

  const progressColorMap = {
    blue: 'stroke-blue-500',
    green: 'stroke-green-500',
    amber: 'stroke-amber-500',
    emerald: 'stroke-emerald-500',
  };

  return (
    <div className="premium-card rounded-2xl p-4.5 flex items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-2.5 flex-shrink-0 ${iconColorMap[color]}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-800 dark:text-white leading-none">{value}</p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">{description}</p>
        </div>
      </div>
      <CircularProgress percent={percent} color={progressColorMap[color]} />
    </div>
  );
}

// ── Quick Link Action Component (Admin) ──
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
      className="premium-card flex items-start gap-4 rounded-2xl p-4.5"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </Link>
  );
}

// ── Course Icon Initials Generator ──
function getGradient(name: string) {
  const gradients = [
    'from-blue-400 to-indigo-600',
    'from-emerald-400 to-teal-600',
    'from-amber-400 to-orange-600',
    'from-rose-400 to-red-600',
    'from-fuchsia-400 to-purple-600',
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return gradients[sum % gradients.length];
}

// ── Mini Calendar Widget ──
function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const firstDay = new Date(year, month, 1).getDay();
  const startDay = firstDay === 0 ? 6 : firstDay - 1; // Align Mon-Sun
  const totalDays = new Date(year, month + 1, 0).getDate();
  
  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }
  
  const today = new Date();
  const isToday = (day: number | null) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const weekDays = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'];
  
  return (
    <div className="premium-card rounded-2xl p-4.5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
          {monthNames[month]} {year}
        </h3>
        <div className="flex gap-1.5">
          <button
            onClick={handlePrevMonth}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={handleNextMonth}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] font-bold text-slate-400 mb-1">
        {weekDays.map((wd) => (
          <div key={wd}>{wd}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-y-1.5 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
        {days.map((day, idx) => (
          <div key={idx} className="flex h-7 items-center justify-center">
            {day ? (
              <span
                className={`flex h-6.5 w-6.5 items-center justify-center rounded-full transition-all ${
                  isToday(day)
                    ? 'bg-accent text-white font-bold shadow-sm shadow-accent/40 scale-105'
                    : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
              >
                {day}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Upcoming Events Widget ──
interface UpcomingEvent {
  date: Date;
  title: string;
  category: string;
  color: string;
}

function UpcomingWidget({ events }: { events: UpcomingEvent[] }) {
  return (
    <div className="premium-card rounded-2xl p-4.5">
      <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
        Agenda Mendatang
      </h3>
      <div className="space-y-3.5">
        {events.map((event, idx) => {
          const dateStr = event.date.toLocaleDateString('id-ID', { day: '2-digit' });
          const monthStr = event.date.toLocaleDateString('id-ID', { month: 'short' });
          return (
            <div key={idx} className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-slate-200/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 font-bold leading-tight select-none border border-slate-300/10">
                <span className="text-sm">{dateStr}</span>
                <span className="text-[9px] uppercase text-slate-400 font-extrabold">{monthStr}</span>
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-snug">
                  {event.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${event.color}`} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {event.category}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        
        {events.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">Belum ada agenda terdekat.</p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isHydrated, clearAuth } = useAuthStore();
  const { searchQuery } = useSearchStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classFilter, setClassFilter] = useState<'active' | 'completed'>('active');

  const [adminData, setAdminData] = useState({
    classes: [] as any[],
    courses: [] as any[],
    lecturers: [] as any[],
    students: [] as any[],
  });
  const [lecturerClasses, setLecturerClasses] = useState<any[]>([]);
  const [studentProgress, setStudentProgress] = useState<any>(null);

  useEffect(() => {
    if (!isHydrated || !user) return;

    const run = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('accessToken');
        if (!token) {
          clearAuth();
          router.replace('/login');
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };

        if (user.role === 'ADMIN') {
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

        if (user.role === 'LECTURER') {
          const classesRes = await api.get('/classes', { headers });
          setLecturerClasses(classesRes.data);
        }

        if (user.role === 'STUDENT') {
          const progressRes = await api.get('/students/me/progress', { headers });
          setStudentProgress(progressRes.data);
        }
      } catch (err: any) {
        if (err?.response?.status === 401) {
          clearAuth();
          router.replace('/login');
          return;
        }
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [user, isHydrated]);

  // ── Stats Calculations ──
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
    const totalEntry = classes.reduce(
      (sum: number, item: any) => sum + (item.attendance?.entryCount || 0),
      0,
    );
    const totalSubmitted = classes.reduce(
      (sum: number, item: any) => sum + (item.assignments?.submittedCount || 0),
      0,
    );
    const totalAssignments = classes.reduce(
      (sum: number, item: any) => sum + (item.assignments?.totalCount || 0),
      0,
    );
    return {
      totalClasses: classes.length,
      totalMeetings,
      totalEntry,
      totalSubmitted,
      totalAssignments,
    };
  }, [studentProgress]);

  // ── Filters & Search ──
  const filteredStudentClasses = useMemo(() => {
    const classes = studentProgress?.classes || [];
    let list = classes.filter((item: any) => {
      const active = item.class?.isActive ?? true;
      return classFilter === 'active' ? active : !active;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item: any) =>
        (item.class?.course?.name || '').toLowerCase().includes(q) ||
        (item.class?.course?.code || '').toLowerCase().includes(q) ||
        (item.class?.className || '').toLowerCase().includes(q) ||
        (item.class?.lecturer?.user?.name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [studentProgress, classFilter, searchQuery]);

  const filteredLecturerClasses = useMemo(() => {
    const classes = lecturerClasses || [];
    let list = classes.filter((item: any) => {
      const active = item.isActive ?? true;
      return classFilter === 'active' ? active : !active;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item: any) =>
        (item.course?.name || '').toLowerCase().includes(q) ||
        (item.course?.code || '').toLowerCase().includes(q) ||
        (item.className || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [lecturerClasses, classFilter, searchQuery]);

  const upcomingEvents = useMemo<UpcomingEvent[]>(() => {
    const events: UpcomingEvent[] = [];
    const classes = studentProgress?.classes || [];
    
    classes.forEach((item: any, idx: number) => {
      events.push({
        date: new Date(Date.now() + (idx + 1) * 24 * 60 * 60 * 1000), // dynamic offset
        title: `Pertemuan ${idx + 2} - ${item.class?.course?.name}`,
        category: 'Kelas',
        color: 'bg-emerald-500'
      });
      events.push({
        date: new Date(Date.now() + (idx + 2) * 24 * 60 * 60 * 1000),
        title: `Tugas MK ${item.class?.course?.name}`,
        category: 'Tugas',
        color: 'bg-amber-500'
      });
    });
    
    // Sort and limit to 4
    return events.slice(0, 4);
  }, [studentProgress]);

  // Icons
  const IconClass = (
    <svg className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
  const IconBook = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
  const IconUsers = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
  const IconEnroll = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
    </svg>
  );
  const IconCheck = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
  const IconCalendar = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'LECTURER', 'STUDENT']}>
      <DashboardShell>
        <div className="space-y-6">
          {error && <AlertBanner type="error" text={error} onClose={() => setError('')} />}
          {loading && <AlertBanner type="info" text="Memuat ringkasan dashboard..." />}

          {!loading && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              
              {/* ── LEFT COLUMN (Spans 9) ── */}
              <div className="space-y-6 lg:col-span-9">
                
                {/* Greeting */}
                <div>
                  <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                    Selamat datang, {user?.name?.split(' ')[0]} 👋
                  </h1>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {user?.role === 'ADMIN'
                      ? 'Ringkasan data sistem LMS.'
                      : user?.role === 'LECTURER'
                      ? 'Ringkasan kelas aktif yang Anda ampu.'
                      : 'Ringkasan kegiatan belajar dan tugas Anda.'}
                  </p>
                </div>

                {/* ── STUDENT VIEW ── */}
                {user?.role === 'STUDENT' && (
                  <>
                    {/* Resume Active Class Banner */}
                    {studentProgress?.classes?.length > 0 && (
                      <div className="premium-card rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-300/10">
                        <div className="flex items-center gap-3.5">
                          <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${getGradient(studentProgress.classes[0].class?.course?.name || '')} text-white flex items-center justify-center font-extrabold text-sm shadow-sm select-none`}>
                            {(studentProgress.classes[0].class?.course?.name || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">Kelas Terakhir Diikuti</span>
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate leading-snug mt-0.5">
                              {studentProgress.classes[0].class?.course?.name} - Kelas {studentProgress.classes[0].class?.className}
                            </h3>
                          </div>
                        </div>
                        <Link
                          href={`/student/classes/${studentProgress.classes[0].class?.id}`}
                          className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-accent-hover transition active:scale-[0.98]"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                          </svg>
                          Resume Kelas
                        </Link>
                      </div>
                    )}

                    {/* Status grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <StatCard
                        label="Kelas Diikuti"
                        value={studentSummary.totalClasses}
                        description="Terdaftar semester ini"
                        percent={100}
                        icon={IconBook}
                        color="blue"
                      />
                      <StatCard
                        label="Kehadiran"
                        value={`${studentSummary.totalEntry}/${studentSummary.totalMeetings}`}
                        description="Kehadiran absensi entry"
                        percent={studentSummary.totalMeetings > 0 ? (studentSummary.totalEntry / studentSummary.totalMeetings) * 100 : 0}
                        icon={IconCalendar}
                        color="green"
                      />
                      <StatCard
                        label="Tugas Selesai"
                        value={`${studentSummary.totalSubmitted}/${studentSummary.totalAssignments}`}
                        description="Tugas diunggah"
                        percent={studentSummary.totalAssignments > 0 ? (studentSummary.totalSubmitted / studentSummary.totalAssignments) * 100 : 0}
                        icon={IconCheck}
                        color="amber"
                      />
                    </div>

                    {/* Course list tabs table */}
                    <div className="premium-card rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/20">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Kelas Saya</h3>
                        <div className="flex gap-1.5 rounded-lg bg-slate-200/40 dark:bg-slate-800/40 p-1">
                          <button
                            onClick={() => setClassFilter('active')}
                            className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                              classFilter === 'active'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                            }`}
                          >
                            Active
                          </button>
                          <button
                            onClick={() => setClassFilter('completed')}
                            className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                              classFilter === 'completed'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                            }`}
                          >
                            Completed
                          </button>
                        </div>
                      </div>

                      {/* Course items */}
                      <div className="space-y-4">
                        {filteredStudentClasses.map((item: any, idx: number) => {
                          const attendancePct = item.attendance?.totalMeetings > 0 
                            ? (item.attendance.entryCount / item.attendance.totalMeetings) * 100 
                            : 0;

                          return (
                            <Link
                              key={item.class?.id || idx}
                              href={`/student/classes/${item.class?.id}`}
                              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 rounded-xl hover:bg-slate-200/20 dark:hover:bg-slate-800/20 transition-all active:scale-[0.99] border border-transparent hover:border-slate-300/10"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${getGradient(item.class?.course?.name || '')} text-white flex items-center justify-center font-extrabold text-xs flex-shrink-0`}>
                                  {(item.class?.course?.name || '?')[0].toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-slate-800 dark:text-white text-xs truncate leading-none">
                                    {item.class?.course?.name} — {item.class?.className}
                                  </h4>
                                  <p className="mt-1 text-[10px] text-slate-400 font-semibold truncate leading-none">
                                    {item.class?.lecturer?.user?.name} · {item.class?.course?.code}
                                  </p>
                                  
                                  {/* Progress bar */}
                                  <div className="mt-3.5 flex items-center gap-2 max-w-xs">
                                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                      <div
                                        className="h-full rounded-full bg-accent transition-all"
                                        style={{ width: `${attendancePct}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">
                                      {Math.round(attendancePct)}% Hadir
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                                <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                  {item.assignments?.submittedCount || 0} Tugas
                                </span>
                                {item.assignments?.averageScore != null && (
                                  <span className="rounded-full bg-green-50 dark:bg-green-950/40 px-2.5 py-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                                    Nilai: {item.assignments.averageScore}
                                  </span>
                                )}
                              </div>
                            </Link>
                          );
                        })}

                        {filteredStudentClasses.length === 0 && (
                          <div className="py-8 text-center text-xs text-slate-400">
                            Tidak ada kelas ditemukan dalam kategori ini.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* ── LECTURER VIEW ── */}
                {user?.role === 'LECTURER' && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <StatCard
                        label="Total Kelas"
                        value={lecturerSummary.totalClasses}
                        description="Kelas sedang diampu"
                        percent={100}
                        icon={IconBook}
                        color="blue"
                      />
                      <StatCard
                        label="Kelas Aktif"
                        value={lecturerSummary.activeClasses}
                        description="Kelas semester aktif"
                        percent={lecturerSummary.totalClasses > 0 ? (lecturerSummary.activeClasses / lecturerSummary.totalClasses) * 100 : 0}
                        icon={IconCalendar}
                        color="green"
                      />
                      <StatCard
                        label="Total Mahasiswa"
                        value={lecturerSummary.totalStudents}
                        description="Mahasiswa diampu"
                        percent={100}
                        icon={IconUsers}
                        color="amber"
                      />
                    </div>

                    {/* Classes list */}
                    <div className="premium-card rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/20">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Kelas Diampu</h3>
                        <div className="flex gap-1.5 rounded-lg bg-slate-200/40 dark:bg-slate-800/40 p-1">
                          <button
                            onClick={() => setClassFilter('active')}
                            className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                              classFilter === 'active'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                            }`}
                          >
                            Active
                          </button>
                          <button
                            onClick={() => setClassFilter('completed')}
                            className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                              classFilter === 'completed'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                            }`}
                          >
                            Completed
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {filteredLecturerClasses.map((item: any) => (
                          <Link
                            key={item.id}
                            href={`/lecturer/classes/${item.id}`}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 rounded-xl hover:bg-slate-200/20 dark:hover:bg-slate-800/20 transition-all active:scale-[0.99] border border-transparent hover:border-slate-300/10"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${getGradient(item.course?.name || '')} text-white flex items-center justify-center font-extrabold text-xs flex-shrink-0`}>
                                {(item.course?.name || '?')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-slate-800 dark:text-white text-xs truncate leading-none">
                                  {item.course?.name} — {item.className}
                                </h4>
                                <p className="mt-1 text-[10px] text-slate-400 font-semibold truncate leading-none">
                                  {item.academicYear} · {item.semesterType}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                {item.enrollments?.length || 0} Mahasiswa
                              </span>
                              <span className="text-[10px] font-extrabold text-slate-400 border border-slate-300/20 px-2 py-0.5 rounded-lg uppercase">
                                {item.course?.code}
                              </span>
                            </div>
                          </Link>
                        ))}

                        {filteredLecturerClasses.length === 0 && (
                          <div className="py-8 text-center text-xs text-slate-400">
                            Tidak ada kelas ditemukan dalam kategori ini.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* ── ADMIN VIEW ── */}
                {user?.role === 'ADMIN' && (
                  <>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                      <StatCard
                        label="Total Kelas"
                        value={adminSummary.totalClasses}
                        description="Kelas sistem aktif"
                        percent={100}
                        icon={IconClass}
                        color="blue"
                      />
                      <StatCard
                        label="Mata Kuliah"
                        value={adminSummary.totalCourses}
                        description="Master mata kuliah"
                        percent={100}
                        icon={IconBook}
                        color="green"
                      />
                      <StatCard
                        label="Total Dosen"
                        value={adminSummary.totalLecturers}
                        description="Dosen terdaftar"
                        percent={100}
                        icon={IconUsers}
                        color="amber"
                      />
                    </div>

                    <div>
                      <h2 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Aksi Cepat Admin
                      </h2>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <QuickLink href="/admin/classes" title="Kelola Kelas" description="Buat, ubah, dan kelola kelas." icon={IconClass} />
                        <QuickLink href="/admin/courses" title="Kelola Mata Kuliah" description="Kelola master data mata kuliah." icon={IconBook} />
                        <QuickLink href="/admin/users" title="Register Users" description="Daftarkan dosen dan mahasiswa." icon={IconUsers} />
                        <QuickLink href="/admin/enrollments" title="Enroll Mahasiswa" description="Masukkan mahasiswa ke kelas." icon={IconEnroll} />
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* ── RIGHT COLUMN (Spans 3) ── */}
              <div className="space-y-6 lg:col-span-3">
                <CalendarWidget />
                
                {user?.role === 'STUDENT' && (
                  <UpcomingWidget events={upcomingEvents} />
                )}
                
                {user?.role !== 'STUDENT' && (
                  <div className="premium-card rounded-2xl p-4.5">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2">
                      Sistem Info
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Sistem LMS FT Universitas Islam Malang berjalan dalam status operasional normal.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
