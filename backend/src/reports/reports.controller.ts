import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @Get('classes/:classId/progress')
  getClassProgress(@Param('classId') classId: string, @Req() req: any) {
    return this.reportsService.getClassProgress(classId, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @Get('students/me/progress')
  getMyProgress(@Req() req: any) {
    return this.reportsService.getMyProgress(req.user);
  }
}
