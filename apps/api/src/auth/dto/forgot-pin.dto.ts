import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class ForgotPinDto {
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'El store_id es requerido' })
  store_id: string;
}
