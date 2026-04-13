const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const lecturerPassword = await bcrypt.hash('dosen123', 10);
  const studentPassword = await bcrypt.hash('mahasiswa123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@unisma.local' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@unisma.local',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const lecturerUser = await prisma.user.upsert({
    where: { email: 'dosen@unisma.local' },
    update: {},
    create: {
      name: 'Dosen Seed',
      email: 'dosen@unisma.local',
      passwordHash: lecturerPassword,
      role: 'LECTURER',
    },
  });

  const lecturer = await prisma.lecturer.upsert({
    where: { userId: lecturerUser.id },
    update: {},
    create: {
      userId: lecturerUser.id,
      nidn: '1111111111',
      department: 'Informatika',
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'mahasiswa@unisma.local' },
    update: {},
    create: {
      name: 'Mahasiswa Seed',
      email: 'mahasiswa@unisma.local',
      passwordHash: studentPassword,
      role: 'STUDENT',
    },
  });

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      nim: '20230099',
      studyProgram: 'Informatika',
      faculty: 'Fakultas Teknik',
      yearEntry: 2023,
    },
  });

  const course = await prisma.course.upsert({
    where: { code: 'IF999' },
    update: {},
    create: {
      code: 'IF999',
      name: 'Mata Kuliah Seed',
      credits: 3,
      semester: 1,
      description: 'Course seed development',
    },
  });

  const klass = await prisma.class.upsert({
    where: {
      courseId_lecturerId_className_academicYear_semesterType: {
        courseId: course.id,
        lecturerId: lecturer.id,
        className: 'SEED-A',
        academicYear: '2025/2026',
        semesterType: 'GENAP',
      },
    },
    update: {},
    create: {
      courseId: course.id,
      lecturerId: lecturer.id,
      className: 'SEED-A',
      academicYear: '2025/2026',
      semesterType: 'GENAP',
      isActive: true,
    },
  });

  await prisma.enrollment.upsert({
    where: {
      classId_studentId: {
        classId: klass.id,
        studentId: student.id,
      },
    },
    update: {},
    create: {
      classId: klass.id,
      studentId: student.id,
      status: 'ACTIVE',
    },
  });

  console.log('Seed completed');
  console.log({
    admin: 'admin@unisma.local / admin123',
    lecturer: 'dosen@unisma.local / dosen123',
    student: 'mahasiswa@unisma.local / mahasiswa123',
    classId: klass.id,
    courseId: course.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
