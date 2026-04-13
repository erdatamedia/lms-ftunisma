import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: pdfStorage('uploads/assignments'),
      fileFilter: pdfFileFilter,
      limits: pdfLimits,
    }),
  )
  @Post('classes/:classId/assignments')
  create(
    @Param('classId') classId: string,
    @Body() dto: CreateAssignmentDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: any,
  ) {
    return this.assignmentsService.create(classId, dto, file, req.user);
  }

  @Get('classes/:classId/assignments')
  findByClass(@Param('classId') classId: string, @Req() req: any) {
    return this.assignmentsService.findByClass(classId, req.user);
  }

  @Get('assignments/:id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.assignmentsService.findOne(id, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @Delete('assignments/:id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.assignmentsService.remove(id, req.user);
  }
}
