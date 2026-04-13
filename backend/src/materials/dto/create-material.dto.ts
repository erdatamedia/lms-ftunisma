import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMaterialDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
