import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { MeetingsService } from './meetings.service';
import { AuthenticatedUser } from '../auth/auth-user.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  imageFileFilter,
  imageLimits,
  imageStorage,
} from '../common/upload/image-upload.util';

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
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.meetingsService.create(classId, dto, req.user);
  }

  @Get('classes/:classId/meetings')
  findByClass(
    @Param('classId') classId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.meetingsService.findByClass(classId, req.user);
  }

  @Get('meetings/:id')
  findOne(@Param('id') id: string, @Req() req: { user: AuthenticatedUser }) {
    return this.meetingsService.findOne(id, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @Post('meetings/:id/thumbnail')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: imageStorage('./uploads/thumbnails'),
      fileFilter: imageFileFilter,
      limits: imageLimits,
    }),
  )
  uploadThumbnail(
    @Param('id') id: string,
    @Req() req: { user: AuthenticatedUser },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.meetingsService.updateThumbnail(id, file, req.user);
  }
}
