import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class JoinClassDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 20)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'Kode enroll hanya boleh berisi huruf, angka, atau tanda minus',
  })
  enrollmentCode: string;
}
