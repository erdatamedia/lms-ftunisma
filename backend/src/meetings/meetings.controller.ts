import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { MeetingsService } from './meetings.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @Post('classes/:classId/meetings')
  create(
    @Param('classId') classId: string,
    @Body() dto: CreateMeetingDto,
    @Req() req: any,
  ) {
    return this.meetingsService.create(classId, dto, req.user);
  }

  @Get('classes/:classId/meetings')
  findByClass(@Param('classId') classId: string, @Req() req: any) {
    return this.meetingsService.findByClass(classId, req.user);
  }

  @Get('meetings/:id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.meetingsService.findOne(id, req.user);
  }
}
