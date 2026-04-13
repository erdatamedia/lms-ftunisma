'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { MeetingSection } from '@/components/meetings/meeting-section';
import { PageCard } from '@/components/ui/page-card';
import { SectionCard } from '@/components/ui/section-card';
import { InfoGrid } from '@/components/ui/info-grid';
import { StatusMessage } from '@/components/ui/status-message';

export default function StudentClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [classId, setClassId] = useState('');
  const [item, setItem] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((resolved) => {
      setClassId(resolved.id);
    });
  }, [params]);

  useEffect(() => {
    if (!classId) return;

    const run = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Token tidak ditemukan. Silakan login ulang.');
          return;
        }

        const { data } = await api.get(`/classes/${classId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setItem(data);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [classId]);

  const enrollmentStatus = item?.enrollments?.[0]?.status || '-';

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardShell>
        <PageCard
          title="Detail Kelas"
          description="Lihat meeting, materi, tugas, dan absensi kelas."
        >
          <Link
            href="/student/classes"
            className="mb-5 inline-flex text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← Kembali ke daftar kelas
          </Link>

          {loading && <StatusMessage type="info" text="Loading detail kelas..." />}
          {error && <StatusMessage type="error" text={error} />}

          {item && (
            <div className="space-y-6">
              <SectionCard
                title={`${item.course?.name} - Kelas ${item.className}`}
                subtitle={`${item.academicYear} · ${item.semesterType}`}
              >
                <InfoGrid
                  items={[
                    {
                      label: 'Dosen',
                      value: item.lecturer?.user?.name || '-',
                    },
                    {
                      label: 'Email Dosen',
                      value: item.lecturer?.user?.email || '-',
                    },
                    {
                      label: 'Status Enroll',
                      value: enrollmentStatus,
                    },
                    {
                      label: 'Kode MK',
                      value: item.course?.code || '-',
                    },
                  ]}
                />
              </SectionCard>

              {classId && <MeetingSection classId={classId} isStudent />}
            </div>
          )}
        </PageCard>
      </DashboardShell>
    </ProtectedRoute>
  );
}
