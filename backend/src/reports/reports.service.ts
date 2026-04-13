import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getClassProgress(
    classId: string,
    currentUser: { userId: string; role: string },
  ) {
    await this.assertCanManageClass(classId, currentUser);

    const foundClass = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        course: true,
        lecturer: {
          include: {
            user: {
              select: safeUserSelect,
            },
          },
        },
        meetings: {
          include: {
            attendanceSessions: {
              include: {
                attendances: true,
              },
            },
            materials: true,
            assignments: {
              include: {
                submissions: true,
              },
            },
          },
          orderBy: [{ meetingNumber: 'asc' }],
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  select: safeUserSelect,
                },
              },
            },
          },
          orderBy: [
            {
              student: {
                nim: 'asc',
              },
            },
          ],
        },
        assignments: {
          include: {
            submissions: true,
          },
          orderBy: [{ dueDate: 'asc' }],
        },
      },
    });

    if (!foundClass) {
      throw new NotFoundException('Kelas tidak ditemukan');
    }

    const totalStudents = foundClass.enrollments.length;
    const totalMeetings = foundClass.meetings.length;
    const totalMaterials = foundClass.meetings.reduce(
      (sum, meeting) => sum + meeting.materials.length,
      0,
    );
    const totalAssignments = foundClass.assignments.length;
    const totalSubmissions = foundClass.assignments.reduce(
      (sum, assignment) => sum + assignment.submissions.length,
      0,
    );

    const studentRows = await Promise.all(
      foundClass.enrollments.map(async (enrollment) => {
        const studentId = enrollment.student.id;

        const attendanceItems = await this.prisma.attendance.findMany({
          where: {
            studentId,
            attendanceSession: {
              meeting: {
                classId,
              },
            },
          },
          include: {
            attendanceSession: {
              include: {
                meeting: true,
              },
            },
          },
        });

        const entryAttendances = attendanceItems.filter(
          (item) => item.attendanceSession.type === 'ENTRY',
        );
        const exitAttendances = attendanceItems.filter(
          (item) => item.attendanceSession.type === 'EXIT',
        );

        const submissions = await this.prisma.submission.findMany({
          where: {
            studentId,
            assignment: {
              classId,
            },
          },
          include: {
            assignment: true,
          },
        });

        const reviewedSubmissions = submissions.filter(
          (item) => item.score !== null,
        );
        const averageScore =
          reviewedSubmissions.length > 0
            ? reviewedSubmissions.reduce(
                (sum, item) => sum + (item.score || 0),
                0,
              ) / reviewedSubmissions.length
            : null;

        return {
          student: enrollment.student,
          attendance: {
            entryCount: entryAttendances.length,
            exitCount: exitAttendances.length,
            totalMeetingOpportunities: totalMeetings,
          },
          assignments: {
            submittedCount: submissions.length,
            reviewedCount: reviewedSubmissions.length,
            pendingCount: Math.max(totalAssignments - submissions.length, 0),
            averageScore,
          },
        };
      }),
    );

    const meetingRows = foundClass.meetings.map((meeting) => {
      const entrySession = meeting.attendanceSessions.find(
        (session) => session.type === 'ENTRY',
      );
      const exitSession = meeting.attendanceSessions.find(
        (session) => session.type === 'EXIT',
      );

      return {
        id: meeting.id,
        meetingNumber: meeting.meetingNumber,
        title: meeting.title,
        topic: meeting.topic,
        date: meeting.date,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        materialsCount: meeting.materials.length,
        assignmentsCount: meeting.assignments.length,
        attendance: {
          entryCount: entrySession?.attendances.length || 0,
          exitCount: exitSession?.attendances.length || 0,
        },
      };
    });

    const assignmentRows = foundClass.assignments.map((assignment) => {
      const reviewed = assignment.submissions.filter(
        (submission) => submission.score !== null,
      );
      const averageScore =
        reviewed.length > 0
          ? reviewed.reduce((sum, item) => sum + (item.score || 0), 0) /
            reviewed.length
          : null;

      return {
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        submissionsCount: assignment.submissions.length,
        reviewedCount: reviewed.length,
        averageScore,
      };
    });

    return {
      class: {
        id: foundClass.id,
        className: foundClass.className,
        academicYear: foundClass.academicYear,
        semesterType: foundClass.semesterType,
        course: foundClass.course,
        lecturer: foundClass.lecturer,
      },
      summary: {
        totalStudents,
        totalMeetings,
        totalMaterials,
        totalAssignments,
        totalSubmissions,
      },
      meetings: meetingRows,
      assignments: assignmentRows,
      students: studentRows,
    };
  }

  async getMyProgress(currentUser: { userId: string; role: string }) {
    if (currentUser.role !== 'STUDENT') {
      throw new ForbiddenException(
        'Hanya mahasiswa yang dapat melihat progres pribadi',
      );
    }

    const student = await this.prisma.student.findUnique({
      where: { userId: currentUser.userId },
      include: {
        user: {
          select: safeUserSelect,
        },
        enrollments: {
          include: {
            class: {
              include: {
                course: true,
                lecturer: {
                  include: {
                    user: {
                      select: safeUserSelect,
                    },
                  },
                },
                meetings: {
                  include: {
                    attendanceSessions: {
                      include: {
                        attendances: {
                          where: {
                            student: {
                              userId: currentUser.userId,
                            },
                          },
                        },
                      },
                    },
                  },
                },
                assignments: {
                  include: {
                    submissions: {
                      where: {
                        student: {
                          userId: currentUser.userId,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Profil mahasiswa tidak ditemukan');
    }

    const classes = student.enrollments.map((enrollment) => {
      const foundClass = enrollment.class;

      const entryCount = foundClass.meetings.reduce((sum, meeting) => {
        const session = meeting.attendanceSessions.find(
          (item) => item.type === 'ENTRY',
        );
        return sum + (session?.attendances.length || 0);
      }, 0);

      const exitCount = foundClass.meetings.reduce((sum, meeting) => {
        const session = meeting.attendanceSessions.find(
          (item) => item.type === 'EXIT',
        );
        return sum + (session?.attendances.length || 0);
      }, 0);

      const submissions = foundClass.assignments.flatMap(
        (assignment) => assignment.submissions,
      );

      const reviewedSubmissions = submissions.filter(
        (item) => item.score !== null,
      );

      const averageScore =
        reviewedSubmissions.length > 0
          ? reviewedSubmissions.reduce(
              (sum, item) => sum + (item.score || 0),
              0,
            ) / reviewedSubmissions.length
          : null;

      return {
        class: {
          id: foundClass.id,
          className: foundClass.className,
          academicYear: foundClass.academicYear,
          semesterType: foundClass.semesterType,
          course: foundClass.course,
          lecturer: foundClass.lecturer,
        },
        attendance: {
          totalMeetings: foundClass.meetings.length,
          entryCount,
          exitCount,
        },
        assignments: {
          totalAssignments: foundClass.assignments.length,
          submittedCount: submissions.length,
          reviewedCount: reviewedSubmissions.length,
          averageScore,
        },
      };
    });

    return {
      student: {
        id: student.id,
        nim: student.nim,
        studyProgram: student.studyProgram,
        faculty: student.faculty,
        yearEntry: student.yearEntry,
        user: student.user,
      },
      classes,
    };
  }

  private async assertCanManageClass(
    classId: string,
    currentUser: { userId: string; role: string },
  ) {
    if (currentUser.role === 'ADMIN') {
      return;
    }

    if (currentUser.role !== 'LECTURER') {
      throw new ForbiddenException('Akses ditolak');
    }

    const lecturer = await this.prisma.lecturer.findUnique({
      where: { userId: currentUser.userId },
    });

    if (!lecturer) {
      throw new NotFoundException('Profil dosen tidak ditemukan');
    }

    const foundClass = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!foundClass || foundClass.lecturerId !== lecturer.id) {
      throw new ForbiddenException('Anda tidak punya akses ke kelas ini');
    }
  }
}
