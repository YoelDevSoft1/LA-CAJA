import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Queue Manager Service
 * Gestiona colas de trabajos para procesamiento asíncrono
 */
@Injectable()
export class QueueManagerService implements OnModuleInit {
  private readonly logger = new Logger(QueueManagerService.name);

  constructor(
    @InjectQueue('notifications')
    private notificationsQueue: Queue,
  ) {}

  async onModuleInit() {
    this.logger.log('Queue Manager initialized');
  }

  /**
   * Programa procesamiento de ML insights para una tienda
   */
  async scheduleMLInsightsProcessing(
    storeId: string,
    delay: number = 0,
  ): Promise<void> {
    await this.notificationsQueue.add(
      'process-ml-insights',
      { storeId },
      {
        delay,
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    this.logger.log(
      `Scheduled ML insights processing for store ${storeId} with delay ${delay}ms`,
    );
  }

  /**
   * Programa envío de email
   */
  async scheduleEmail(emailId: string, priority: number = 50): Promise<void> {
    await this.notificationsQueue.add(
      'send-email',
      { emailId },
      {
        priority,
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
      },
    );

    this.logger.log(`Scheduled email ${emailId} with priority ${priority}`);
  }

  /**
   * Programa digest diario
   */
  async scheduleDailyDigest(storeId: string, time: Date): Promise<void> {
    const delay = time.getTime() - Date.now();

    if (delay < 0) {
      this.logger.warn(`Cannot schedule digest in the past for store ${storeId}`);
      return;
    }

    await this.notificationsQueue.add(
      'daily-digest',
      { storeId },
      {
        delay,
        removeOnComplete: true,
        jobId: `daily-digest-${storeId}-${time.toISOString().split('T')[0]}`,
      },
    );

    this.logger.log(`Scheduled daily digest for store ${storeId} at ${time}`);
  }

  /**
   * Cron: Procesa ML insights cada hora para todas las tiendas activas
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processMLInsightsHourly() {
    this.logger.log('Hourly ML insights processing triggered');

    // Por ahora, esto se activará manualmente o por tienda
    // En producción, deberías obtener lista de tiendas activas
  }

  /**
   * Cron: Procesa cola de emails cada 5 minutos
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processEmailQueueCron() {
    this.logger.log('Email queue processing triggered');

    await this.notificationsQueue.add(
      'process-email-queue',
      {},
      {
        removeOnComplete: true,
        attempts: 1,
      },
    );
  }

  /**
   * Cron: Genera digests diarios a las 8 AM
   */
  @Cron('0 8 * * *', {
    timeZone: 'America/La_Paz',
  })
  async generateDailyDigestsCron() {
    this.logger.log('Daily digests generation triggered');

    // Por ahora, esto se activará manualmente o por tienda
    // En producción, deberías obtener lista de tiendas activas
  }

  /**
   * Obtiene estadísticas de la cola
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const counts = await this.notificationsQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
    );

    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
    };
  }

  /**
   * Limpia trabajos completados y fallidos antiguos
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldJobs() {
    this.logger.log('Cleaning up old jobs');

    // Limpiar trabajos completados más antiguos de 7 días
    await this.notificationsQueue.clean(7 * 24 * 60 * 60 * 1000, 1000, 'completed');

    // Limpiar trabajos fallidos más antiguos de 30 días
    await this.notificationsQueue.clean(30 * 24 * 60 * 60 * 1000, 1000, 'failed');

    this.logger.log('Old jobs cleanup completed');
  }
}
