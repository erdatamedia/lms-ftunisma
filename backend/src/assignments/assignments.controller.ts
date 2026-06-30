import {
  Body,
  Controller,
  Delete,
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
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { AuthenticatedUser } from '../auth/auth-user.interface';

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
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.assignmentsService.create(classId, dto, file, req.user);
  }

  @Get('classes/:classId/assignments')
  findByClass(
    @Param('classId') classId: string,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.assignmentsService.findByClass(classId, req.user);
  }

  @Get('assignments/my')
  findMy(@Req() req: { user: AuthenticatedUser }) {
    return this.assignmentsService.findMyAssignments(req.user);
  }

  @Get('assignments/:id')
  findOne(@Param('id') id: string, @Req() req: { user: AuthenticatedUser }) {
    return this.assignmentsService.findOne(id, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: pdfStorage('uploads/assignments'),
      fileFilter: pdfFileFilter,
      limits: pdfLimits,
    }),
  )
  @Patch('assignments/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.assignmentsService.update(id, dto, file, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @Delete('assignments/:id')
  remove(@Param('id') id: string, @Req() req: { user: AuthenticatedUser }) {
    return this.assignmentsService.remove(id, req.user);
  }
}
