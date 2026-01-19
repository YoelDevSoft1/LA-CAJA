import { IsString, IsNotEmpty, Length } from 'class-validator';

export class Verify2FADto {
  @IsString()
  @IsNotEmpty({ message: 'El código 2FA es requerido' })
  @Length(6, 6, { message: 'El código 2FA debe tener 6 dígitos' })
  code: string;
}
