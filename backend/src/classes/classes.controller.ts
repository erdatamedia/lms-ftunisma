import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  findAll(@Req() req: Request & { user: AuthenticatedUser }) {
    return this.classesService.findAll(req.user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.classesService.findOne(id, req.user);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateClassDto) {
    return this.classesService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.classesService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }
}
