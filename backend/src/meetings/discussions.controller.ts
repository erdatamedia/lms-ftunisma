import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/auth-user.interface';
import { DiscussionsService } from './discussions.service';

@UseGuards(JwtAuthGuard)
@Controller('meetings/:meetingId/discussions')
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @Post()
  create(
    @Param('meetingId') meetingId: string,
    @Body('content') content: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.discussionsService.create(meetingId, content, req.user);
  }

  @Get()
  findByMeeting(
    @Param('meetingId') meetingId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.discussionsService.findByMeeting(meetingId, req.user);
  }
}
