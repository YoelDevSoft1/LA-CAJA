import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RedisHealthIndicator } from './indicators/redis-health.indicator';
import { BullMQHealthIndicator } from './indicators/bullmq-health.indicator';
import { ExternalApisHealthIndicator } from './indicators/external-apis-health.indicator';
import { WebSocketHealthIndicator } from './indicators/websocket-health.indicator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private redis: RedisHealthIndicator,
    private bullmq: BullMQHealthIndicator,
    private externalApis: ExternalApisHealthIndicator,
    private websocket: WebSocketHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check general del sistema' })
  @ApiResponse({ status: 200, description: 'Sistema saludable' })
  @ApiResponse({ status: 503, description: 'Sistema no saludable' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024), // 500MB
    ]);
  }

  @Get('database')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check de la base de datos PostgreSQL' })
  @ApiResponse({ status: 200, description: 'Base de datos saludable' })
  @ApiResponse({ status: 503, description: 'Base de datos no disponible' })
  checkDatabase() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('redis')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check de Redis' })
  @ApiResponse({ status: 200, description: 'Redis saludable' })
  @ApiResponse({ status: 503, description: 'Redis no disponible' })
  checkRedis() {
    return this.health.check([
      () => this.redis.isHealthy('redis'),
    ]);
  }

  @Get('queues')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check de colas BullMQ' })
  @ApiResponse({ status: 200, description: 'Colas saludables' })
  @ApiResponse({ status: 503, description: 'Colas con problemas' })
  checkQueues() {
    return this.health.check([
      () => this.bullmq.isHealthy('bullmq'),
    ]);
  }

  @Get('external')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check de APIs externas' })
  @ApiResponse({ status: 200, description: 'APIs externas saludables' })
  @ApiResponse({ status: 503, description: 'Algunas APIs externas no disponibles' })
  checkExternal() {
    return this.health.check([
      () => this.externalApis.isHealthy('external_apis'),
    ]);
  }

  @Get('websocket')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check de WebSocket' })
  @ApiResponse({ status: 200, description: 'WebSocket operacional' })
  checkWebSocket() {
    return this.health.check([
      () => this.websocket.isHealthy('websocket'),
    ]);
  }

  @Get('detailed')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check detallado de todos los servicios' })
  @ApiResponse({ status: 200, description: 'Todos los servicios saludables' })
  @ApiResponse({ status: 503, description: 'Algunos servicios no saludables' })
  checkDetailed() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
      () => this.bullmq.isHealthy('bullmq'),
      () => this.websocket.isHealthy('websocket'),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9, // 90% de uso máximo
        }),
    ]);
  }
}
