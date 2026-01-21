import { ApiProperty } from '@nestjs/swagger';

export class UptimeStatsDto {
  @ApiProperty({ description: 'Uptime actual en porcentaje' })
  uptime: number;

  @ApiProperty({ description: 'Uptime objetivo (99.9%)' })
  targetUptime: number;

  @ApiProperty({ description: 'Tiempo total de uptime en segundos' })
  totalUptimeSeconds: number;

  @ApiProperty({ description: 'Tiempo total de downtime en segundos' })
  totalDowntimeSeconds: number;

  @ApiProperty({ description: 'Número de checks realizados' })
  totalChecks: number;

  @ApiProperty({ description: 'Número de checks exitosos' })
  successfulChecks: number;

  @ApiProperty({ description: 'Número de checks fallidos' })
  failedChecks: number;

  @ApiProperty({ description: 'Período de tiempo analizado' })
  period: string;

  @ApiProperty({ description: 'Fecha de inicio del período' })
  periodStart: Date;

  @ApiProperty({ description: 'Fecha de fin del período' })
  periodEnd: Date;
}

export class UptimeHistoryDto {
  @ApiProperty({ description: 'Timestamp del registro' })
  timestamp: Date;

  @ApiProperty({ description: 'Estado', enum: ['up', 'down', 'degraded'] })
  status: 'up' | 'down' | 'degraded';

  @ApiProperty({ description: 'Tiempo de respuesta en ms', required: false })
  responseTime?: number;

  @ApiProperty({ description: 'Nombre del servicio', required: false })
  serviceName?: string;
}
