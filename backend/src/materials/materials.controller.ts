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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateMaterialDto } from './dto/create-material.dto';
import { MaterialsService } from './materials.service';
import {
  pdfFileFilter,
  pdfLimits,
  pdfStorage,
} from '../common/upload/pdf-upload.util';

@UseGuards(JwtAuthGuard)
@Controller()
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: pdfStorage('uploads/materials'),
      fileFilter: pdfFileFilter,
      limits: pdfLimits,
    }),
  )
  @Post('meetings/:meetingId/materials')
  create(
    @Param('meetingId') meetingId: string,
    @Body() dto: CreateMaterialDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File PDF wajib diunggah');
    }

    return this.materialsService.create(meetingId, dto, file, req.user);
  }

  @Get('meetings/:meetingId/materials')
  findByMeeting(@Param('meetingId') meetingId: string, @Req() req: any) {
    return this.materialsService.findByMeeting(meetingId, req.user);
  }

  @Get('materials/:id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.materialsService.findOne(id, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  @Delete('materials/:id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.materialsService.remove(id, req.user);
  }
}
