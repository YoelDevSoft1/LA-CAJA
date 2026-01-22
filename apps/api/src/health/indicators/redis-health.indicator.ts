import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private redisClient: Redis | null = null;

  constructor(private configService: ConfigService) {
    super();
    this.initializeRedis();
  }

  private initializeRedis() {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      
      if (redisUrl) {
        this.redisClient = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
          connectTimeout: 5000,
        });
      } else {
        const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
        const port = this.configService.get<number>('REDIS_PORT') || 6379;
        const password = this.configService.get<string>('REDIS_PASSWORD');

        this.redisClient = new Redis({
          host,
          port,
          password,
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
          connectTimeout: 5000,
        });
      }

      this.redisClient.on('error', (err) => {
        // Error manejado en isHealthy
      });
    } catch (error) {
      // Error manejado en isHealthy
    }
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    if (!this.redisClient) {
      throw new HealthCheckError(
        'Redis no está configurado',
        this.getStatus(key, false, { message: 'Redis no configurado' }),
      );
    }

    try {
      const startTime = Date.now();
      const result = await Promise.race([
        this.redisClient.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000),
        ),
      ]);
      const responseTime = Date.now() - startTime;

      if (result === 'PONG') {
        const info = await this.redisClient.info('memory');
        const memoryMatch = info.match(/used_memory:(\d+)/);
        const usedMemory = memoryMatch ? parseInt(memoryMatch[1], 10) : 0;

        return this.getStatus(key, true, {
          connection: 'connected',
          responseTime: `${responseTime}ms`,
          usedMemory: `${(usedMemory / 1024 / 1024).toFixed(2)}MB`,
        });
      }

      throw new Error('Redis ping failed');
    } catch (error) {
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}
