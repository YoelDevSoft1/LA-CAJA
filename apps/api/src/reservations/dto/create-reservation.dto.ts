import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  IsIn,
  IsDateString,
  IsUUID,
} from 'class-validator';

/**
 * DTO para crear una reserva
 */
export class CreateReservationDto {
  @IsUUID()
  @IsOptional()
  table_id?: string | null;

  @IsUUID()
  @IsOptional()
  customer_id?: string | null;

  @IsString()
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  customer_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  customer_phone?: string | null;

  @IsDateString()
  reservation_date: string;

  @IsString()
  reservation_time: string; // Formato HH:mm

  @IsInt()
  @Min(1, { message: 'El tamaño del grupo debe ser mayor a 0' })
  party_size: number;

  @IsString()
  @IsOptional()
  @IsIn(['pending', 'confirmed', 'seated', 'cancelled', 'completed'])
  status?: 'pending' | 'confirmed' | 'seated' | 'cancelled' | 'completed';

  @IsString()
  @IsOptional()
  special_requests?: string | null;

  @IsString()
  @IsOptional()
  note?: string | null;
}
