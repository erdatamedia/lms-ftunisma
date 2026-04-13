import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum AttendanceSessionTypeDto {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
}

export class OpenAttendanceSessionDto {
  @IsEnum(AttendanceSessionTypeDto)
  type: AttendanceSessionTypeDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  expiresInMinutes?: number;
}
