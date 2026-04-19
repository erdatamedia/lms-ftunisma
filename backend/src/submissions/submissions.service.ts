import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { GradeSubmissionDto } from './dto/grade-submission.dto';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly studentSubmissionInclude = {
    assignment: {
      include: {
        class: {
          include: {
            course: true,
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
  } as const;

  async submit(
    assignmentId: string,
    file: Express.Multer.File,
    note: string | undefined,
    currentUser: { userId: string; role: string },
  ) {
    if (currentUser.role !== 'STUDENT') {
      throw new ForbiddenException('Hanya mahasiswa yang dapat submit tugas');
    }

    const student = await this.prisma.student.findUnique({
      where: { userId: currentUser.userId },
    });

    if (!student) {
      throw new NotFoundException('Profil mahasiswa tidak ditemukan');
    }

    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Tugas tidak ditemukan');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        classId_studentId: {
          classId: assignment.classId,
          studentId: student.id,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Anda tidak terdaftar di class ini');
    }

    const existingSubmission = await this.prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId: student.id,
      },
    });

    if (existingSubmission) {
      throw new BadRequestException(
        'Anda sudah pernah submit tugas ini. Gunakan fitur "Update Submission" yang tersedia di bawah untuk mengganti file atau catatan.',
      );
    }

    const created = await this.prisma.submission.create({
      data: {
        assignmentId,
        studentId: student.id,
        fileName: file.originalname,
        fileUrl: `/uploads/submissions/${file.filename}`,
        note: note?.trim(),
        status: SubmissionStatus.SUBMITTED,
      },
      include: this.studentSubmissionInclude,
    });

    await this.prisma.submissionLog.create({
      data: {
        submissionId: created.id,
        studentId: student.id,
        action: 'SUBMITTED',
      },
    });

    return created;
  }

  async updateOwnSubmission(
    assignmentId: string,
    file: Express.Multer.File | undefined,
    note: string | undefined,
    currentUser: { userId: string; role: string },
  ) {
    if (currentUser.role !== 'STUDENT') {
      throw new ForbiddenException('Hanya mahasiswa yang dapat memperbarui submission');
    }

    const student = await this.prisma.student.findUnique({
      where: { userId: currentUser.userId },
    });

    if (!student) {
      throw new NotFoundException('Profil mahasiswa tidak ditemukan');
    }

    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Tugas tidak ditemukan');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        classId_studentId: {
          classId: assignment.classId,
          studentId: student.id,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Anda tidak terdaftar di class ini');
    }

    const existingSubmission = await this.prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id,
        },
      },
    });

    if (!existingSubmission) {
      throw new NotFoundException('Submission belum ada. Silakan submit tugas terlebih dahulu');
    }

    if (existingSubmission.score !== null || existingSubmission.status === SubmissionStatus.REVIEWED) {
      throw new BadRequestException(
        'Submission sudah dinilai dan tidak dapat diperbarui lagi',
      );
    }

    if (!file && note?.trim() === (existingSubmission.note ?? '')) {
      throw new BadRequestException(
        'Tidak ada perubahan pada submission yang dikirimkan',
      );
    }

    if (file && existingSubmission.fileUrl) {
      const oldFilePath = join(process.cwd(), existingSubmission.fileUrl);
      await unlink(oldFilePath).catch(() => {});
    }

    const now = new Date();
    const newStatus =
      assignment.dueDate && now > new Date(assignment.dueDate)
        ? SubmissionStatus.LATE
        : SubmissionStatus.SUBMITTED;

    return this.prisma.submission.update({
      where: { id: existingSubmission.id },
      data: {
        note: note?.trim(),
        submittedAt: now,
        status: newStatus,
        ...(file
          ? {
              fileName: file.originalname,
              fileUrl: `/uploads/submissions/${file.filename}`,
            }
          : {}),
      },
      include: this.studentSubmissionInclude,
    });
  }

  async updateById(
    submissionId: string,
    file: Express.Multer.File | undefined,
    note: string | undefined,
    currentUser: { userId: string; role: string },
  ) {
    if (currentUser.role !== 'STUDENT') {
      throw new ForbiddenException('Hanya mahasiswa yang dapat memperbarui submission');
    }

    const student = await this.prisma.student.findUnique({
      where: { userId: currentUser.userId },
    });

    if (!student) {
      throw new NotFoundException('Profil mahasiswa tidak ditemukan');
    }

    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });

    if (!submission) {
      throw new NotFoundException('Submission tidak ditemukan');
    }

    if (submission.studentId !== student.id) {
      throw new ForbiddenException('Anda tidak punya akses ke submission ini');
    }

    if (submission.score !== null || submission.status === SubmissionStatus.REVIEWED) {
      throw new BadRequestException(
        'Submission sudah dinilai dan tidak dapat diperbarui lagi',
      );
    }

    const oldFileName = submission.fileName;

    if (file && submission.fileUrl) {
      const oldFilePath = join(process.cwd(), submission.fileUrl);
      await unlink(oldFilePath).catch(() => {});
    }

    const now = new Date();
    const newStatus =
      submission.assignment.dueDate && now > new Date(submission.assignment.dueDate)
        ? SubmissionStatus.LATE
        : SubmissionStatus.SUBMITTED;

    const updated = await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        note: note?.trim(),
        submittedAt: now,
        status: newStatus,
        ...(file
          ? {
              fileName: file.originalname,
              fileUrl: `/uploads/submissions/${file.filename}`,
            }
          : {}),
      },
      include: this.studentSubmissionInclude,
    });

    await this.prisma.submissionLog.create({
      data: {
        submissionId,
        studentId: student.id,
        action: 'UPDATED',
        note: file && oldFileName ? `File lama: ${oldFileName}` : undefined,
      },
    });

    return updated;
  }

  async findLogs(
    submissionId: string,
    currentUser: { userId: string; role: string },
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });

    if (!submission) {
      throw new NotFoundException('Submission tidak ditemukan');
    }

    await this.assertCanManageClass(submission.assignment.classId, currentUser);

    return this.prisma.submissionLog.findMany({
      where: { submissionId },
      include: {
        student: {
          include: {
            user: { select: safeUserSelect },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByAssignment(
    assignmentId: string,
    currentUser: { userId: string; role: string },
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Tugas tidak ditemukan');
    }

    await this.assertCanManageClass(assignment.classId, currentUser);

    return this.prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: {
          include: {
            user: {
              select: safeUserSelect,
            },
          },
        },
      },
      orderBy: [{ submittedAt: 'desc' }],
    });
  }

  async grade(
    submissionId: string,
    dto: GradeSubmissionDto,
    currentUser: { userId: string; role: string },
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission tidak ditemukan');
    }

    await this.assertCanManageClass(submission.assignment.classId, currentUser);

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: dto.score,
        feedback: dto.feedback?.trim(),
        status: SubmissionStatus.REVIEWED,
      },
      include: {
        assignment: true,
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
}
