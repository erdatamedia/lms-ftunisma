import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export enum SemesterTypeDto {
  GANJIL = 'GANJIL',
  GENAP = 'GENAP',
}

export class CreateClassDto {
  @IsUUID()
  courseId: string;

  @IsUUID()
  lecturerId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  className: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}\/\d{4}$/, {
    message: 'academicYear harus berformat YYYY/YYYY',
  })
  academicYear: string;

  @IsEnum(SemesterTypeDto)
  semesterType: SemesterTypeDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
