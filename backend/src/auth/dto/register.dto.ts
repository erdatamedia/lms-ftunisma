import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(100)
  email: string;

  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @ValidateIf((o) => o.role === UserRole.LECTURER)
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{6,30}$/, {
    message: 'NIDN harus berupa angka 6-30 digit',
  })
  nidn?: string;

  @ValidateIf((o) => o.role === UserRole.LECTURER)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ValidateIf((o) => o.role === UserRole.STUDENT)
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9A-Za-z\-\/]{4,30}$/, {
    message: 'NIM tidak valid',
  })
  nim?: string;

  @ValidateIf((o) => o.role === UserRole.STUDENT)
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  studyProgram?: string;

  @ValidateIf((o) => o.role === UserRole.STUDENT)
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  faculty?: string;

  @ValidateIf((o) => o.role === UserRole.STUDENT)
  @IsNotEmpty()
  @IsInt()
  @Min(2000)
  yearEntry?: number;
}
