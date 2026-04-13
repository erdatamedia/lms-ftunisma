import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  pdfFileFilter,
  pdfLimits,
  pdfStorage,
} from '../common/upload/pdf-upload.util';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { SubmissionsService } from './submissions.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: pdfStorage('uploads/submissions'),
      fileFilter: pdfFileFilter,
      limits: pdfLimits,
    }),
  )
  @Post('assignments/:assignmentId/submit')
  submit(
    @Param('assignmentId') assignmentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('note') note: string,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File PDF wajib diunggah');
    }

    return this.submissionsService.submit(assignmentId, file, note, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @Get('assignments/:assignmentId/submissions')
  findByAssignment(
    @Param('assignmentId') assignmentId: string,
    @Req() req: any,
  ) {
    return this.submissionsService.findByAssignment(assignmentId, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @Patch('submissions/:submissionId/grade')
  grade(
    @Param('submissionId') submissionId: string,
    @Body() dto: GradeSubmissionDto,
    @Req() req: any,
  ) {
    return this.submissionsService.grade(submissionId, dto, req.user);
  }
}
