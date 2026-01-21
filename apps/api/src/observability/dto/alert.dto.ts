import { ApiProperty } from '@nestjs/swagger';
import { AlertSeverity, AlertStatus } from '../entities/alert.entity';

export class AlertDto {
  @ApiProperty({ description: 'ID de la alerta' })
  id: string;

  @ApiProperty({ description: 'Nombre del servicio' })
  service_name: string;

  @ApiProperty({ description: 'Tipo de alerta' })
  alert_type: string;

  @ApiProperty({ description: 'Severidad', enum: AlertSeverity })
  severity: AlertSeverity;

  @ApiProperty({ description: 'Mensaje de la alerta' })
  message: string;

  @ApiProperty({ description: 'Estado', enum: AlertStatus })
  status: AlertStatus;

  @ApiProperty({ description: 'Fecha de resolución', required: false })
  resolved_at?: Date | null;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}

export class CreateAlertDto {
  @ApiProperty({ description: 'Nombre del servicio' })
  service_name: string;

  @ApiProperty({ description: 'Tipo de alerta' })
  alert_type: string;

  @ApiProperty({ description: 'Severidad', enum: AlertSeverity })
  severity: AlertSeverity;

  @ApiProperty({ description: 'Mensaje de la alerta' })
  message: string;

  @ApiProperty({ description: 'Metadatos adicionales', required: false })
  metadata?: Record<string, any>;
}

export class UpdateAlertStatusDto {
  @ApiProperty({ description: 'Nuevo estado', enum: AlertStatus })
  status: AlertStatus;
}
