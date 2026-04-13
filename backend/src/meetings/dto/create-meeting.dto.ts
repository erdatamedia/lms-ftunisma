import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Matches,
} from 'class-validator';

export class CreateMeetingDto {
  @IsInt()
  @Min(1)
  meetingNumber: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  topic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'startTime harus berformat HH:MM',
  })
  startTime?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'endTime harus berformat HH:MM',
  })
  endTime?: string;
}
