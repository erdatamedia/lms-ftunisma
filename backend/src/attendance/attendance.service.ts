import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAttendanceSessionDto } from './dto/open-attendance-session.dto';
import { ScanAttendanceDto } from './dto/scan-attendance.dto';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async openSession(
    meetingId: string,
    dto: OpenAttendanceSessionDto,
    currentUser: { userId: string; role: string },
  ) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        class: true,
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting tidak ditemukan');
    }

    await this.assertCanManageClass(meeting.classId, currentUser);

    await this.prisma.attendanceSession.updateMany({
      where: {
        meetingId,
        type: dto.type,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    const expiresInMinutes = dto.expiresInMinutes ?? 10;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    const qrToken = `${meetingId}:${dto.type}:${randomUUID()}`;

    return this.prisma.attendanceSession.create({
      data: {
        meetingId,
        type: dto.type,
        qrToken,
        expiresAt,
        isActive: true,
      },
      include: {
        meeting: {
          include: {
            class: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });
  }

  async scan(
    dto: ScanAttendanceDto,
    currentUser: { userId: string; role: string },
    ipAddress?: string,
  ) {
    if (currentUser.role !== 'STUDENT') {
      throw new ForbiddenException('Hanya mahasiswa yang bisa scan absensi');
    }

    const student = await this.prisma.student.findUnique({
      where: { userId: currentUser.userId },
    });

    if (!student) {
      throw new NotFoundException('Profil mahasiswa tidak ditemukan');
    }

    const session = await this.prisma.attendanceSession.findUnique({
      where: { qrToken: dto.qrToken },
      include: {
        meeting: {
          include: {
            class: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('QR token tidak ditemukan');
    }

    if (!session.isActive || session.expiresAt < new Date()) {
      throw new BadRequestException(
        'QR token sudah tidak aktif atau sudah kadaluarsa',
      );
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        classId_studentId: {
          classId: session.meeting.classId,
          studentId: student.id,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Anda tidak terdaftar di kelas ini');
    }

    const existing = await this.prisma.attendance.findUnique({
      where: {
        attendanceSessionId_studentId: {
          attendanceSessionId: session.id,
          studentId: student.id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Anda sudah melakukan absensi pada sesi ini',
      );
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        attendanceSessionId: session.id,
        studentId: student.id,
        deviceInfo: dto.deviceInfo,
        ipAddress,
      },
      include: {
        attendanceSession: {
          include: {
            meeting: {
              include: {
                class: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
        student: {
          include: {
            user: {
              select: safeUserSelect,
            },
          },
        },
      },
    });

    return {
      id: attendance.id,
      scannedAt: attendance.scannedAt,
      status: attendance.status,
      deviceInfo: attendance.deviceInfo,
      ipAddress: attendance.ipAddress,
      attendanceSession: {
        id: attendance.attendanceSession.id,
        meetingId: attendance.attendanceSession.meetingId,
        type: attendance.attendanceSession.type,
        expiresAt: attendance.attendanceSession.expiresAt,
        isActive: attendance.attendanceSession.isActive,
        meeting: attendance.attendanceSession.meeting,
      },
      student: attendance.student,
    };
  }

  async getMeetingAttendance(
    meetingId: string,
    currentUser: { userId: string; role: string },
  ) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting tidak ditemukan');
    }

    await this.assertCanManageClass(meeting.classId, currentUser);

    return this.prisma.attendanceSession.findMany({
      where: { meetingId },
      include: {
        attendances: {
          include: {
            student: {
              include: {
                user: {
                  select: safeUserSelect,
                },
              },
            },
          },
          orderBy: [{ scannedAt: 'asc' }],
        },
      },
      orderBy: [{ createdAt: 'asc' }],
    });
  }

  async getMyMeetingAttendance(
    meetingId: string,
    currentUser: { userId: string; role: string },
  ) {
    if (currentUser.role !== 'STUDENT') {
      throw new ForbiddenException(
        'Hanya mahasiswa yang bisa melihat absensi pribadi',
      );
    }

    const student = await this.prisma.student.findUnique({
      where: { userId: currentUser.userId },
    });

    if (!student) {
      throw new NotFoundException('Profil mahasiswa tidak ditemukan');
    }

    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting tidak ditemukan');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        classId_studentId: {
          classId: meeting.classId,
          studentId: student.id,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Anda tidak terdaftar di kelas ini');
    }

    const items = await this.prisma.attendance.findMany({
      where: {
        studentId: student.id,
        attendanceSession: {
          meetingId,
        },
      },
      include: {
        attendanceSession: true,
      },
      orderBy: [{ scannedAt: 'asc' }],
    });

    return items.map((item) => ({
      id: item.id,
      attendanceSessionId: item.attendanceSessionId,
      studentId: item.studentId,
      scannedAt: item.scannedAt,
      status: item.status,
      deviceInfo: item.deviceInfo,
      ipAddress: item.ipAddress,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      attendanceSession: {
        id: item.attendanceSession.id,
        meetingId: item.attendanceSession.meetingId,
        type: item.attendanceSession.type,
        expiresAt: item.attendanceSession.expiresAt,
        isActive: item.attendanceSession.isActive,
        createdAt: item.attendanceSession.createdAt,
        updatedAt: item.attendanceSession.updatedAt,
      },
    }));
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
