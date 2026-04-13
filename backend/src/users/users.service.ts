import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...safeUserSelect,
        lecturer: true,
        student: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        lecturer: true,
        student: true,
      },
    });
  }

  findLecturers() {
    return this.prisma.lecturer.findMany({
      include: {
        user: {
          select: safeUserSelect,
        },
      },
      orderBy: [
        {
          user: {
            name: 'asc',
          },
        },
      ],
    });
  }

  findStudents() {
    return this.prisma.student.findMany({
      include: {
        user: {
          select: safeUserSelect,
        },
      },
      orderBy: [
        {
          user: {
            name: 'asc',
          },
        },
      ],
    });
  }

  async adminRegister(dto: RegisterDto) {
    if (dto.role === UserRole.ADMIN) {
      throw new BadRequestException(
        'Role ADMIN tidak bisa dibuat dari endpoint ini',
      );
    }

    const existingUser = await this.findByEmail(dto.email);

    if (existingUser) {
      throw new BadRequestException('Email sudah digunakan');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        passwordHash,
        role: dto.role,
      },
    });

    if (dto.role === UserRole.LECTURER) {
      await this.prisma.lecturer.create({
        data: {
          userId: user.id,
          nidn: dto.nidn!.trim(),
          department: dto.department?.trim() || 'Informatika',
        },
      });
    }

    if (dto.role === UserRole.STUDENT) {
      await this.assertStudentNimAvailable(dto.nim!);

      await this.prisma.student.create({
        data: {
          userId: user.id,
          nim: dto.nim!.trim(),
          studyProgram: dto.studyProgram!.trim(),
          faculty: dto.faculty!.trim(),
          yearEntry: dto.yearEntry!,
        },
      });
    }

    return this.findById(user.id);
  }

  async updateLecturer(lecturerId: string, dto: UpdateAdminUserDto) {
    const lecturer = await this.prisma.lecturer.findUnique({
      where: { id: lecturerId },
      include: {
        user: {
          select: safeUserSelect,
        },
      },
    });

    if (!lecturer) {
      throw new NotFoundException('Dosen tidak ditemukan');
    }

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: dto.email.trim().toLowerCase(),
          NOT: { id: lecturer.userId },
        },
      });

      if (existing) {
        throw new BadRequestException('Email sudah digunakan');
      }
    }

    const userData: {
      name?: string;
      email?: string;
      passwordHash?: string;
    } = {};
    if (dto.name) userData.name = dto.name.trim();
    if (dto.email) userData.email = dto.email.trim().toLowerCase();
    if (dto.password) {
      userData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const lecturerData: {
      nidn?: string;
      department?: string | null;
    } = {};
    if (dto.nidn) lecturerData.nidn = dto.nidn.trim();
    if (dto.department !== undefined) {
      lecturerData.department = dto.department?.trim() || null;
    }

    await this.prisma.user.update({
      where: { id: lecturer.userId },
      data: userData,
    });

    await this.prisma.lecturer.update({
      where: { id: lecturerId },
      data: lecturerData,
    });

    return this.prisma.lecturer.findUnique({
      where: { id: lecturerId },
      include: {
        user: {
          select: safeUserSelect,
        },
      },
    });
  }

  async updateStudent(studentId: string, dto: UpdateAdminUserDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: safeUserSelect,
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Mahasiswa tidak ditemukan');
    }

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: dto.email.trim().toLowerCase(),
          NOT: { id: student.userId },
        },
      });

      if (existing) {
        throw new BadRequestException('Email sudah digunakan');
      }
    }

    if (dto.nim) {
      await this.assertStudentNimAvailable(dto.nim, studentId);
    }

    const userData: {
      name?: string;
      email?: string;
      passwordHash?: string;
    } = {};
    if (dto.name) userData.name = dto.name.trim();
    if (dto.email) userData.email = dto.email.trim().toLowerCase();
    if (dto.password) {
      userData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const studentData: {
      nim?: string;
      studyProgram?: string | null;
      faculty?: string | null;
      yearEntry?: number;
    } = {};
    if (dto.nim) studentData.nim = dto.nim.trim();
    if (dto.studyProgram !== undefined) {
      studentData.studyProgram = dto.studyProgram?.trim() || null;
    }
    if (dto.faculty !== undefined) {
      studentData.faculty = dto.faculty?.trim() || null;
    }
    if (dto.yearEntry !== undefined) studentData.yearEntry = dto.yearEntry;

    await this.prisma.user.update({
      where: { id: student.userId },
      data: userData,
    });

    await this.prisma.student.update({
      where: { id: studentId },
      data: studentData,
    });

    return this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: safeUserSelect,
        },
      },
    });
  }

  async removeLecturer(lecturerId: string) {
    const lecturer = await this.prisma.lecturer.findUnique({
      where: { id: lecturerId },
      include: {
        user: {
          select: safeUserSelect,
        },
      },
    });

    if (!lecturer) {
      throw new NotFoundException('Dosen tidak ditemukan');
    }

    const classesCount = await this.prisma.class.count({
      where: { lecturerId },
    });

    if (classesCount > 0) {
      throw new BadRequestException(
        'Dosen tidak bisa dihapus karena masih terhubung dengan class',
      );
    }

    await this.prisma.lecturer.delete({
      where: { id: lecturerId },
    });

    await this.prisma.user.delete({
      where: { id: lecturer.userId },
    });

    return { message: 'Akun dosen berhasil dihapus' };
  }

  async removeStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: safeUserSelect,
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Mahasiswa tidak ditemukan');
    }

    const enrollmentsCount = await this.prisma.enrollment.count({
      where: { studentId },
    });

    const submissionsCount = await this.prisma.submission.count({
      where: { studentId },
    });

    const attendancesCount = await this.prisma.attendance.count({
      where: { studentId },
    });

    if (enrollmentsCount > 0 || submissionsCount > 0 || attendancesCount > 0) {
      throw new BadRequestException(
        'Mahasiswa tidak bisa dihapus karena masih memiliki relasi data akademik',
      );
    }

    await this.prisma.student.delete({
      where: { id: studentId },
    });

    await this.prisma.user.delete({
      where: { id: student.userId },
    });

    return { message: 'Akun mahasiswa berhasil dihapus' };
  }

  async assertStudentNimAvailable(nim: string, excludeStudentId?: string) {
    const existing = await this.prisma.student.findFirst({
      where: {
        nim: nim.trim(),
        ...(excludeStudentId ? { NOT: { id: excludeStudentId } } : {}),
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new BadRequestException('NIM sudah digunakan');
    }
  }
}
