import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly safeUserSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  };

  async create(
    classId: string,
    dto: CreateMeetingDto,
    currentUser: { userId: string; role: string },
  ) {
    const foundClass = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!foundClass) {
      throw new NotFoundException('Class tidak ditemukan');
    }

    await this.assertCanManageClass(classId, currentUser);

    const existingMeeting = await this.prisma.meeting.findFirst({
      where: {
        classId,
        meetingNumber: dto.meetingNumber,
      },
    });

    if (existingMeeting) {
      throw new BadRequestException(
        `Meeting ke-${dto.meetingNumber} sudah ada pada class ini`,
      );
    }

    return this.prisma.meeting.create({
      data: {
        classId,
        meetingNumber: dto.meetingNumber,
        title: dto.title.trim(),
        topic: dto.topic?.trim(),
        description: dto.description?.trim(),
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
      include: {
        class: {
          include: {
            course: true,
            lecturer: {
              include: {
                user: {
                  select: this.safeUserSelect,
                },
              },
            },
          },
        },
        attendanceSessions: true,
        materials: true,
        assignments: true,
      },
    });
  }

  async findByClass(
    classId: string,
    currentUser: { userId: string; role: string },
  ) {
    const foundClass = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!foundClass) {
      throw new NotFoundException('Class tidak ditemukan');
    }

    await this.assertCanAccessClass(classId, currentUser);

    return this.prisma.meeting.findMany({
      where: { classId },
      include: {
        attendanceSessions: true,
        materials: true,
        assignments: true,
      },
      orderBy: [{ meetingNumber: 'asc' }],
    });
  }

  async findOne(id: string, currentUser: { userId: string; role: string }) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            course: true,
            lecturer: {
              include: {
                user: {
                  select: this.safeUserSelect,
                },
              },
            },
          },
        },
        attendanceSessions: true,
        materials: true,
        assignments: true,
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting tidak ditemukan');
    }

    await this.assertCanAccessClass(meeting.classId, currentUser);

    return meeting;
  }

  private async assertCanManageClass(
    classId: string,
    currentUser: { userId: string; role: string },
  ) {
    if (currentUser.role === 'ADMIN') return;

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
      throw new ForbiddenException('Anda tidak punya akses ke class ini');
    }
  }

  private async assertCanAccessClass(
    classId: string,
    currentUser: { userId: string; role: string },
  ) {
    if (currentUser.role === 'ADMIN') return;

    if (currentUser.role === 'LECTURER') {
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
        throw new ForbiddenException('Anda tidak punya akses ke class ini');
      }

      return;
    }

    if (currentUser.role === 'STUDENT') {
      const student = await this.prisma.student.findUnique({
        where: { userId: currentUser.userId },
      });

      if (!student) {
        throw new NotFoundException('Profil mahasiswa tidak ditemukan');
      }

      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          classId_studentId: {
            classId,
            studentId: student.id,
          },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('Anda tidak terdaftar di class ini');
      }

      return;
    }

    throw new ForbiddenException('Akses ditolak');
  }
}
