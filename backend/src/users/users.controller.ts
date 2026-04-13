import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RegisterDto } from '../auth/dto/register.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.ADMIN)
  @Post('admin-register')
  adminRegister(@Body() dto: RegisterDto) {
    return this.usersService.adminRegister(dto);
  }

  @Roles(UserRole.ADMIN)
  @Get('lecturers')
  findLecturers() {
    return this.usersService.findLecturers();
  }

  @Roles(UserRole.ADMIN)
  @Get('students')
  findStudents() {
    return this.usersService.findStudents();
  }

  @Roles(UserRole.ADMIN)
  @Patch('lecturers/:id')
  updateLecturer(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.usersService.updateLecturer(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch('students/:id')
  updateStudent(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.usersService.updateStudent(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete('lecturers/:id')
  removeLecturer(@Param('id') id: string) {
    return this.usersService.removeLecturer(id);
  }

  @Roles(UserRole.ADMIN)
  @Delete('students/:id')
  removeStudent(@Param('id') id: string) {
    return this.usersService.removeStudent(id);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
