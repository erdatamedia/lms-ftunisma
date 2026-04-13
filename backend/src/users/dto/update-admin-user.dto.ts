import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{6,30}$/, {
    message: 'NIDN harus berupa angka 6-30 digit',
  })
  nidn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9A-Za-z\-\/]{4,30}$/, {
    message: 'NIM tidak valid',
  })
  nim?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  studyProgram?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  faculty?: string;

  @IsOptional()
  @IsInt()
  @Min(2000)
  yearEntry?: number;
}
