import { IsOptional, IsArray, IsString } from 'class-validator';

/**
 * DTO para enviar recordatorio de deudas por WhatsApp.
 * Si debt_ids no se envía o está vacío, se incluyen todas las deudas pendientes del cliente.
 * Si se envía, solo se incluyen las deudas cuyo id esté en el array.
 */
export class SendDebtReminderDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  debt_ids?: string[];
}
