import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    meetingId: string,
    dto: CreateMaterialDto,
    file: Express.Multer.File,
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

    return this.prisma.material.create({
      data: {
        meetingId,
        title: dto.title,
        description: dto.description,
        fileName: file.originalname,
        fileUrl: `/uploads/materials/${file.filename}`,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedById: currentUser.userId,
      },
      include: {
        uploadedBy: {
          select: safeUserSelect,
        },
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

    return this.prisma.material.findMany({
      where: { meetingId },
      include: {
        uploadedBy: {
          select: safeUserSelect,
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findOne(id: string, currentUser: { userId: string; role: string }) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: safeUserSelect,
        },
        meeting: {
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
          },
        },
      },
    });

    if (!material) {
      throw new NotFoundException('Materi tidak ditemukan');
    }

    await this.assertCanAccessClass(material.meeting.classId, currentUser);

    return material;
  }

  async remove(id: string, currentUser: { userId: string; role: string }) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: {
        meeting: true,
      },
    });

    if (!material) {
      throw new NotFoundException('Materi tidak ditemukan');
    }

    await this.assertCanManageClass(material.meeting.classId, currentUser);

    return this.prisma.material.delete({
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
      throw new ForbiddenException('Anda tidak punya akses ke kelas ini');
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
        throw new ForbiddenException('Anda tidak punya akses ke kelas ini');
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
        throw new ForbiddenException('Anda tidak terdaftar di kelas ini');
      }

      return;
    }

    throw new ForbiddenException('Akses ditolak');
  }
}
