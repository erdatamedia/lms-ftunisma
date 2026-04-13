import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ScanAttendanceDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  qrToken: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  deviceInfo?: string;
}
