import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { unlink } from 'fs/promises';
import { join } from 'path';

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

    if (currentUser.role === 'STUDENT') {
      const student = await this.prisma.student.findUnique({
        where: { userId: currentUser.userId },
      });

      if (!student) {
        throw new NotFoundException('Profil mahasiswa tidak ditemukan');
      }

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
          submissions: {
            where: {
              studentId: student.id,
            },
            orderBy: [{ submittedAt: 'desc' }],
          },
        },
        orderBy: [{ dueDate: 'asc' }],
      });
    }

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

  async update(
    id: string,
    dto: UpdateAssignmentDto,
    file: Express.Multer.File | undefined,
    currentUser: { userId: string; role: string },
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException('Tugas tidak ditemukan');
    }

    await this.assertCanManageClass(assignment.classId, currentUser);

    let meetingDate: Date | null = null;
    const meetingId = dto.meetingId !== undefined ? dto.meetingId : assignment.meetingId;

    if (meetingId) {
      const meeting = await this.prisma.meeting.findUnique({
        where: { id: meetingId },
      });

      if (!meeting || meeting.classId !== assignment.classId) {
        throw new NotFoundException('Meeting tidak ditemukan pada class ini');
      }

      meetingDate = meeting.date;
    }

    const dueDate = dto.dueDate ? new Date(dto.dueDate) : assignment.dueDate;

    if (meetingDate && dueDate < meetingDate) {
      throw new BadRequestException(
        'Deadline tugas tidak boleh lebih awal dari tanggal meeting',
      );
    }

    if (dto.title && dto.title.trim().toLowerCase() !== assignment.title.toLowerCase()) {
      const existing = await this.prisma.assignment.findFirst({
        where: {
          classId: assignment.classId,
          meetingId: meetingId ?? null,
          title: {
            equals: dto.title.trim(),
            mode: 'insensitive',
          },
          id: {
            not: id,
          },
        },
      });

      if (existing) {
        throw new BadRequestException(
          'Tugas dengan judul tersebut sudah ada pada class/meeting ini',
        );
      }
    }

    let attachmentName = assignment.attachmentName;
    let attachmentUrl = assignment.attachmentUrl;

    if (file) {
      if (assignment.attachmentUrl) {
        const oldFilePath = join(process.cwd(), assignment.attachmentUrl);
        await unlink(oldFilePath).catch(() => {});
      }
      attachmentName = file.originalname;
      attachmentUrl = `/uploads/assignments/${file.filename}`;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.assignment.update({
        where: { id },
        data: {
          title: dto.title !== undefined ? dto.title.trim() : undefined,
          description: dto.description !== undefined ? dto.description.trim() : undefined,
          dueDate,
          meetingId: dto.meetingId !== undefined ? dto.meetingId : undefined,
          attachmentName,
          attachmentUrl,
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

      const submissions = await tx.submission.findMany({
        where: { assignmentId: id },
      });

      for (const sub of submissions) {
        if (sub.status !== 'REVIEWED') {
          const isLate = sub.submittedAt > dueDate;
          const newStatus = isLate ? 'LATE' : 'SUBMITTED';
          if (sub.status !== newStatus) {
            await tx.submission.update({
              where: { id: sub.id },
              data: { status: newStatus },
            });
          }
        }
      }

      return updated;
    });
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

  async findMyAssignments(currentUser: { userId: string; role: string }) {
    if (currentUser.role !== 'STUDENT') {
      throw new ForbiddenException('Hanya mahasiswa yang dapat mengakses tugas ini');
    }

    const student = await this.prisma.student.findUnique({
      where: { userId: currentUser.userId },
      include: {
        enrollments: {
          select: {
            classId: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Profil mahasiswa tidak ditemukan');
    }

    const classIds = student.enrollments.map((e) => e.classId);

    return this.prisma.assignment.findMany({
      where: {
        classId: {
          in: classIds,
        },
      },
      include: {
        class: {
          include: {
            course: true,
          },
        },
        meeting: true,
        submissions: {
          where: {
            studentId: student.id,
          },
          orderBy: [{ submittedAt: 'desc' }],
        },
      },
      orderBy: [{ dueDate: 'asc' }],
    });
  }
}
