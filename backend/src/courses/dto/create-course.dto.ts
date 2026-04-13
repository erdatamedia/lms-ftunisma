import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9\-]+$/, {
    message: 'Kode course hanya boleh huruf, angka, dan tanda -',
  })
  code: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name: string;

  @IsInt()
  @Min(1)
  credits: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  semester?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
