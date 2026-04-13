import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { SemesterTypeDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClassDto) {
    await this.assertCourseExists(dto.courseId);
    await this.assertLecturerExists(dto.lecturerId);
    await this.assertClassNotDuplicate(dto);

    return this.prisma.class.create({
      data: {
        courseId: dto.courseId,
        lecturerId: dto.lecturerId,
        className: dto.className.trim(),
        academicYear: dto.academicYear.trim(),
        semesterType: dto.semesterType,
        isActive: dto.isActive ?? true,
      },
      include: this.buildAdminOrLecturerInclude(),
    });
  }

  findAll(currentUser: AuthenticatedUser) {
    return this.prisma.class.findMany({
      where: this.buildAccessibleClassWhere(currentUser),
      include: this.buildClassInclude(currentUser),
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findOne(id: string, currentUser: AuthenticatedUser) {
    const found = await this.prisma.class.findFirst({
      where: {
        id,
        ...this.buildAccessibleClassWhere(currentUser),
      },
      include: {
        ...this.buildClassInclude(currentUser),
        meetings: true,
      },
    });

    if (!found) {
      const existing = await this.prisma.class.findUnique({
        where: { id },
        select: { id: true },
      });

      if (existing) {
        throw new ForbiddenException('Anda tidak punya akses ke kelas ini');
      }

      throw new NotFoundException('Class tidak ditemukan');
    }

    return found;
  }

  async update(id: string, dto: UpdateClassDto) {
    const current = await this.getClassByIdOrThrow(id);

    if (dto.courseId) {
      await this.assertCourseExists(dto.courseId);
    }

    if (dto.lecturerId) {
      await this.assertLecturerExists(dto.lecturerId);
    }

    await this.assertClassNotDuplicate(
      {
        courseId: dto.courseId ?? current.courseId,
        lecturerId: dto.lecturerId ?? current.lecturerId,
        className: dto.className ?? current.className,
        academicYear: dto.academicYear ?? current.academicYear,
        semesterType:
          dto.semesterType ??
          (current.semesterType as unknown as SemesterTypeDto),
      },
      id,
    );

    return this.prisma.class.update({
      where: { id },
      data: {
        courseId: dto.courseId,
        lecturerId: dto.lecturerId,
        className: dto.className?.trim(),
        academicYear: dto.academicYear?.trim(),
        semesterType: dto.semesterType,
        isActive: dto.isActive,
      },
      include: this.buildAdminOrLecturerInclude(),
    });
  }

  async remove(id: string) {
    await this.getClassByIdOrThrow(id);

    return this.prisma.class.delete({
      where: { id },
    });
  }

  private async assertCourseExists(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course tidak ditemukan');
    }
  }

  private async assertLecturerExists(lecturerId: string) {
    const lecturer = await this.prisma.lecturer.findUnique({
      where: { id: lecturerId },
    });

    if (!lecturer) {
      throw new NotFoundException('Dosen tidak ditemukan');
    }
  }

  private async assertClassNotDuplicate(
    dto: Partial<CreateClassDto>,
    excludeId?: string,
  ) {
    if (
      !dto.courseId ||
      !dto.lecturerId ||
      !dto.className ||
      !dto.academicYear ||
      !dto.semesterType
    ) {
      return;
    }

    const existing = await this.prisma.class.findFirst({
      where: {
        courseId: dto.courseId,
        lecturerId: dto.lecturerId,
        className: {
          equals: dto.className.trim(),
          mode: 'insensitive',
        },
        academicYear: dto.academicYear.trim(),
        semesterType: dto.semesterType,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Class dengan course, dosen, nama kelas, tahun akademik, dan semester tersebut sudah ada',
      );
    }
  }

  private buildAccessibleClassWhere(
    currentUser: AuthenticatedUser,
  ): Prisma.ClassWhereInput {
    if (currentUser.role === 'ADMIN') {
      return {};
    }

    if (currentUser.role === 'LECTURER') {
      return {
        lecturer: {
          userId: currentUser.userId,
        },
      };
    }

    return {
      enrollments: {
        some: {
          student: {
            userId: currentUser.userId,
          },
        },
      },
    };
  }

  private buildClassInclude(currentUser: AuthenticatedUser) {
    const baseInclude = {
      course: true,
      lecturer: {
        include: {
          user: {
            select: safeUserSelect,
          },
        },
      },
    };

    if (currentUser.role === 'STUDENT') {
      return {
        ...baseInclude,
        enrollments: {
          where: {
            student: {
              userId: currentUser.userId,
            },
          },
          select: {
            id: true,
            status: true,
            studentId: true,
          },
        },
      };
    }

    return {
      ...baseInclude,
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
      },
    };
  }

  private buildAdminOrLecturerInclude() {
    return {
      course: true,
      lecturer: {
        include: {
          user: {
            select: safeUserSelect,
          },
        },
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
      },
    };
  }

  private async getClassByIdOrThrow(id: string) {
    const found = await this.prisma.class.findUnique({
      where: { id },
    });

    if (!found) {
      throw new NotFoundException('Class tidak ditemukan');
    }

    return found;
  }
}
