import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { PublicRegisterDto } from './dto/public-register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: PublicRegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new BadRequestException('Email sudah digunakan');
    }

    await this.usersService.assertStudentNimAvailable(dto.nim);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        passwordHash,
        role: UserRole.STUDENT,
      },
    });

    await this.prisma.student.create({
      data: {
        userId: user.id,
        nim: dto.nim.trim(),
        studyProgram: dto.studyProgram.trim(),
        faculty: dto.faculty.trim(),
        yearEntry: dto.yearEntry,
      },
    });

    return {
      message: 'Registrasi mahasiswa berhasil',
      user: await this.usersService.findById(user.id),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: await this.usersService.findById(user.id),
    };
  }

  async me(currentUser: { userId: string }) {
    return this.usersService.findById(currentUser.userId);
  }
}
