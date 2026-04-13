import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseDto) {
    const normalizedCode = dto.code.trim().toUpperCase();
    const normalizedName = dto.name.trim();

    const existing = await this.prisma.course.findFirst({
      where: {
        code: {
          equals: normalizedCode,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Kode course sudah digunakan');
    }

    return this.prisma.course.create({
      data: {
        code: normalizedCode,
        name: normalizedName,
        credits: dto.credits,
        semester: dto.semester,
        description: dto.description?.trim(),
      },
    });
  }

  findAll() {
    return this.prisma.course.findMany({
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course tidak ditemukan');
    }

    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.findOne(id);

    if (dto.code) {
      const normalizedCode = dto.code.trim().toUpperCase();

      const existing = await this.prisma.course.findFirst({
        where: {
          code: {
            equals: normalizedCode,
            mode: 'insensitive',
          },
          NOT: { id },
        },
      });

      if (existing) {
        throw new BadRequestException('Kode course sudah digunakan');
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        code: dto.code?.trim().toUpperCase(),
        name: dto.name?.trim(),
        credits: dto.credits,
        semester: dto.semester,
        description: dto.description?.trim(),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      return await this.prisma.course.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Course tidak bisa dihapus karena masih digunakan oleh class',
        );
      }

      throw error;
    }
  }
}
