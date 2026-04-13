import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { EnrollmentsService } from './enrollments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Roles(UserRole.ADMIN)
  @Post('enrollments')
  create(@Body() body: { classId: string; studentId: string }) {
    return this.enrollmentsService.create(body.classId, body.studentId);
  }

  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @Get('classes/:classId/enrollments')
  findByClass(
    @Param('classId') classId: string,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.enrollmentsService.findByClass(classId, req.user);
  }

  @Roles(UserRole.ADMIN)
  @Delete('enrollments/:id')
  remove(@Param('id') id: string) {
    return this.enrollmentsService.remove(id);
  }
}
