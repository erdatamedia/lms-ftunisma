import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSubmissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
