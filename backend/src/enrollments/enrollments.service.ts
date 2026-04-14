import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth-user.interface';
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
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(classId: string, studentId: string) {
    const foundClass = await this.getClassByIdOrThrow(classId);
    const student = await this.getStudentByIdOrThrow(studentId);

    return this.createEnrollmentRecord(foundClass.id, student.id);
  }

  async joinByCode(enrollmentCode: string, currentUser: AuthenticatedUser) {
    if (currentUser.role !== 'STUDENT') {
      throw new ForbiddenException('Hanya mahasiswa yang dapat bergabung kelas');
    }

    const student = await this.getStudentByUserIdOrThrow(currentUser.userId);
    const normalizedCode = enrollmentCode.trim().toUpperCase();

    const foundClass = await this.prisma.class.findUnique({
      where: { enrollmentCode: normalizedCode },
    });

    if (!foundClass) {
      throw new NotFoundException('Kode enroll tidak ditemukan');
    }

    if (!foundClass.isActive) {
      throw new BadRequestException('Kelas ini sedang tidak aktif');
    }

    return this.createEnrollmentRecord(foundClass.id, student.id);
  }

  async findByClass(classId: string, currentUser: AuthenticatedUser) {
    const foundClass = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!foundClass) {
      throw new NotFoundException('Class tidak ditemukan');
    }

    if (currentUser.role === 'LECTURER') {
      const lecturer = await this.prisma.lecturer.findUnique({
        where: { userId: currentUser.userId },
      });

      if (!lecturer || lecturer.id !== foundClass.lecturerId) {
        throw new ForbiddenException('Anda tidak punya akses ke kelas ini');
      }
    }

    return this.prisma.enrollment.findMany({
      where: { classId },
      include: {
        student: {
          include: {
            user: {
              select: safeUserSelect,
            },
          },
        },
        class: {
          include: {
            course: true,
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
    });
  }

  async remove(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment tidak ditemukan');
    }

    return this.prisma.enrollment.delete({
      where: { id },
    });
  }

  private async createEnrollmentRecord(classId: string, studentId: string) {
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        classId_studentId: {
          classId,
          studentId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Mahasiswa sudah terdaftar di class ini');
    }

    return this.prisma.enrollment.create({
      data: {
        classId,
        studentId,
        status: EnrollmentStatus.ACTIVE,
      },
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
  }

  private async getClassByIdOrThrow(classId: string) {
    const foundClass = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!foundClass) {
      throw new NotFoundException('Class tidak ditemukan');
    }

    return foundClass;
  }

  private async getStudentByIdOrThrow(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student tidak ditemukan');
    }

    return student;
  }

  private async getStudentByUserIdOrThrow(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException('Profil mahasiswa tidak ditemukan');
    }

    return student;
  }
}
