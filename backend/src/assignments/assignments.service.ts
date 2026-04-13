import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    classId: string,
    dto: CreateAssignmentDto,
    file: Express.Multer.File | undefined,
    currentUser: { userId: string; role: string },
  ) {
    const foundClass = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!foundClass) {
      throw new NotFoundException('Class tidak ditemukan');
    }

    await this.assertCanManageClass(classId, currentUser);

    let meetingDate: Date | null = null;

    if (dto.meetingId) {
      const meeting = await this.prisma.meeting.findUnique({
        where: { id: dto.meetingId },
      });

      if (!meeting || meeting.classId !== classId) {
        throw new NotFoundException('Meeting tidak ditemukan pada class ini');
      }

      meetingDate = meeting.date;
    }

    const dueDate = new Date(dto.dueDate);

    if (meetingDate && dueDate < meetingDate) {
      throw new BadRequestException(
        'Deadline tugas tidak boleh lebih awal dari tanggal meeting',
      );
    }

    const existing = await this.prisma.assignment.findFirst({
      where: {
        classId,
        meetingId: dto.meetingId ?? null,
        title: {
          equals: dto.title.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Tugas dengan judul tersebut sudah ada pada class/meeting ini',
      );
    }

    return this.prisma.assignment.create({
      data: {
        classId,
        meetingId: dto.meetingId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        dueDate,
        attachmentName: file ? file.originalname : undefined,
        attachmentUrl: file
          ? `/uploads/assignments/${file.filename}`
          : undefined,
        createdById: currentUser.userId,
      },
      include: {
        createdBy: {
          select: safeUserSelect,
        },
        class: {
          include: {
            course: true,
          },
        },
        meeting: true,
      },
    });
  }

  async findByClass(
    classId: string,
    currentUser: { userId: string; role: string },
  ) {
    await this.assertCanAccessClass(classId, currentUser);

    return this.prisma.assignment.findMany({
      where: { classId },
      include: {
        createdBy: {
          select: safeUserSelect,
        },
        meeting: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }],
    });
  }

  async findOne(id: string, currentUser: { userId: string; role: string }) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: safeUserSelect,
        },
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
          },
        },
        meeting: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Tugas tidak ditemukan');
    }

    await this.assertCanAccessClass(assignment.classId, currentUser);

    return assignment;
  }

  async remove(id: string, currentUser: { userId: string; role: string }) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException('Tugas tidak ditemukan');
    }

    await this.assertCanManageClass(assignment.classId, currentUser);

    return this.prisma.assignment.delete({
      where: { id },
    });
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
      throw new ForbiddenException('Anda tidak punya akses ke class ini');
    }
  }

  private async assertCanAccessClass(
    classId: string,
    currentUser: { userId: string; role: string },
  ) {
    if (currentUser.role === 'ADMIN') {
      return;
    }

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
