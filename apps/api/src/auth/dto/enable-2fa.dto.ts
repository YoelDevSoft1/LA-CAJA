import { IsString, IsNotEmpty } from 'class-validator';

export class Enable2FADto {
  @IsString()
  @IsNotEmpty({ message: 'El código de verificación es requerido' })
  verification_code: string;
}
