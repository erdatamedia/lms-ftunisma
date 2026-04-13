import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class PublicRegisterDto {
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

  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9A-Za-z\-\/]{4,30}$/, {
    message: 'NIM tidak valid',
  })
  nim: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  studyProgram: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  faculty: string;

  @IsNotEmpty()
  @IsInt()
  @Min(2000)
  yearEntry: number;
}
