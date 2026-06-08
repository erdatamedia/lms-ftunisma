import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscussionsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly safeUserSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    avatarUrl: true,
  };

  async create(
    meetingId: string,
    content: string,
    currentUser: { userId: string; role: string },
  ) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting tidak ditemukan');
    }

    await this.assertCanAccessClass(meeting.classId, currentUser);

    if (!content || !content.trim()) {
      throw new ForbiddenException('Pesan diskusi tidak boleh kosong');
    }

    return this.prisma.discussion.create({
      data: {
        meetingId,
        userId: currentUser.userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: this.safeUserSelect,
        },
      },
    });
  }

  async findByMeeting(
    meetingId: string,
    currentUser: { userId: string; role: string },
  ) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting tidak ditemukan');
    }

    await this.assertCanAccessClass(meeting.classId, currentUser);

    return this.prisma.discussion.findMany({
      where: { meetingId },
      include: {
        user: {
          select: this.safeUserSelect,
        },
      },
      orderBy: [{ createdAt: 'asc' }],
    });
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
