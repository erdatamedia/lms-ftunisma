import { IsBoolean, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AttendanceSessionType } from '@prisma/client';

export class UpdateManualAttendanceDto {
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @IsNotEmpty()
  @IsEnum(AttendanceSessionType)
  type: AttendanceSessionType;

  @IsNotEmpty()
  @IsBoolean()
  present: boolean;
}
