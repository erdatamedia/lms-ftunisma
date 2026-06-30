import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AttendanceService } from './attendance.service';
import { OpenAttendanceSessionDto } from './dto/open-attendance-session.dto';
import { ScanAttendanceDto } from './dto/scan-attendance.dto';
import { UpdateManualAttendanceDto } from './dto/update-manual-attendance.dto';
import { AuthenticatedUser } from '../auth/auth-user.interface';

@UseGuards(JwtAuthGuard)
@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @Post('meetings/:meetingId/attendance-sessions/open')
  openSession(
    @Param('meetingId') meetingId: string,
    @Body() dto: OpenAttendanceSessionDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.attendanceService.openSession(meetingId, dto, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @Post('attendance/scan')
  scan(
    @Body() dto: ScanAttendanceDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : req.ip;

    return this.attendanceService.scan(dto, req.user, ipAddress);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @Get('meetings/:meetingId/attendance')
  getMeetingAttendance(
    @Param('meetingId') meetingId: string,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.attendanceService.getMeetingAttendance(meetingId, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @Get('meetings/:meetingId/attendance/manual')
  getManualAttendanceList(
    @Param('meetingId') meetingId: string,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.attendanceService.getManualAttendanceList(meetingId, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @Post('meetings/:meetingId/attendance/manual')
  updateManualAttendance(
    @Param('meetingId') meetingId: string,
    @Body() dto: UpdateManualAttendanceDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.attendanceService.updateManualAttendance(meetingId, dto, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @Get('meetings/:meetingId/my-attendance')
  getMyMeetingAttendance(
    @Param('meetingId') meetingId: string,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.attendanceService.getMyMeetingAttendance(meetingId, req.user);
  }
}
