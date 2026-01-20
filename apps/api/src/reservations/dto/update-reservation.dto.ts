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
 * DTO para actualizar una reserva
 */
export class UpdateReservationDto {
  @IsUUID()
  @IsOptional()
  table_id?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  customer_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  customer_phone?: string | null;

  @IsDateString()
  @IsOptional()
  reservation_date?: string;

  @IsString()
  @IsOptional()
  reservation_time?: string;

  @IsInt()
  @Min(1, { message: 'El tamaño del grupo debe ser mayor a 0' })
  @IsOptional()
  party_size?: number;

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
