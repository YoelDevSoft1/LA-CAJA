import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WhatsAppMessageQueue } from '../database/entities/whatsapp-message-queue.entity';
import { WhatsAppBotService } from './whatsapp-bot.service';

/**
 * Procesador de cola de mensajes de WhatsApp
 * Procesa mensajes pendientes cada 30 segundos
 */
@Injectable()
export class WhatsAppQueueProcessor {
  private readonly logger = new Logger(WhatsAppQueueProcessor.name);
  private readonly RATE_LIMIT_MESSAGES_PER_MINUTE = 20; // Límite de mensajes por minuto por tienda
  private readonly processingStores = new Map<string, number>(); // Track de mensajes enviados por tienda

  constructor(
    @InjectRepository(WhatsAppMessageQueue)
    private messageQueueRepository: Repository<WhatsAppMessageQueue>,
    private whatsappBotService: WhatsAppBotService,
  ) {}

  /**
   * Cron: Procesa cola de mensajes cada 30 segundos
   */
  @Cron('*/30 * * * * *') // Cada 30 segundos
  async processQueue() {
    try {
      // Obtener mensajes pendientes o en retry, ordenados por fecha de creación
      const pendingMessages = await this.messageQueueRepository.find({
        where: [
          { status: 'pending' },
          { status: 'retrying' },
        ],
        order: { created_at: 'ASC' },
        take: 50, // Procesar máximo 50 mensajes por ciclo
      });

      // Filtrar mensajes programados que aún no deben enviarse
      const now = new Date();
      const messagesToProcess = pendingMessages.filter(
        (msg) => !msg.scheduled_for || msg.scheduled_for <= now,
      );

      if (messagesToProcess.length === 0) {
        return;
      }

      this.logger.log(`Procesando ${messagesToProcess.length} mensajes pendientes`);

      // Procesar mensajes agrupados por tienda (para rate limiting)
      const messagesByStore = new Map<string, typeof messagesToProcess>();
      for (const message of messagesToProcess) {
        if (!messagesByStore.has(message.store_id)) {
          messagesByStore.set(message.store_id, []);
        }
        messagesByStore.get(message.store_id)!.push(message);
      }

      // Procesar cada tienda
      for (const [storeId, messages] of messagesByStore) {
        await this.processStoreMessages(storeId, messages);
      }

      // Resetear contadores de rate limiting cada minuto
      this.processingStores.clear();
    } catch (error) {
      this.logger.error('Error procesando cola de mensajes de WhatsApp:', error);
    }
  }

  /**
   * Procesa mensajes de una tienda específica
   */
  private async processStoreMessages(
    storeId: string,
    messages: WhatsAppMessageQueue[],
  ): Promise<void> {
    // Verificar si el bot está conectado
    if (!this.whatsappBotService.isConnected(storeId)) {
      this.logger.debug(`Bot no conectado para tienda ${storeId}, omitiendo ${messages.length} mensajes`);
      return;
    }

    // Rate limiting: verificar cuántos mensajes se han enviado en el último minuto
    const sentCount = this.processingStores.get(storeId) || 0;
    if (sentCount >= this.RATE_LIMIT_MESSAGES_PER_MINUTE) {
      this.logger.warn(`Rate limit alcanzado para tienda ${storeId}, omitiendo mensajes`);
      return;
    }

    // Procesar mensajes (máximo según rate limit)
    const remainingQuota = this.RATE_LIMIT_MESSAGES_PER_MINUTE - sentCount;
    const messagesToProcess = messages.slice(0, remainingQuota);

    for (const message of messagesToProcess) {
      await this.processMessage(message);
      this.processingStores.set(storeId, sentCount + 1);
    }
  }

  /**
   * Procesa un mensaje individual
   */
  private async processMessage(message: WhatsAppMessageQueue): Promise<void> {
    try {
      // Actualizar estado a "retrying" si es la primera vez
      if (message.status === 'pending') {
        message.status = 'retrying';
        message.attempts = 1;
        await this.messageQueueRepository.save(message);
      } else {
        message.attempts += 1;
        await this.messageQueueRepository.save(message);
      }

      // Intentar enviar mensaje
      const result = await this.whatsappBotService.sendMessage(
        message.store_id,
        message.customer_phone,
        message.message,
      );

      if (result.success) {
        // Mensaje enviado exitosamente
        message.status = 'sent';
        message.sent_at = new Date();
        message.error_message = null;
        await this.messageQueueRepository.save(message);
        this.logger.log(
          `Mensaje ${message.id} enviado exitosamente a ${message.customer_phone}`,
        );
      } else {
        // Error al enviar
        message.error_message = result.error || 'Error desconocido';
        await this.handleSendError(message);
      }
    } catch (error: any) {
      this.logger.error(`Error procesando mensaje ${message.id}:`, error);
      message.error_message = error.message || 'Error desconocido';
      await this.handleSendError(message);
    }
  }

  /**
   * Maneja errores al enviar mensajes
   */
  private async handleSendError(message: WhatsAppMessageQueue): Promise<void> {
    if (message.attempts >= message.max_attempts) {
      // Máximo de intentos alcanzado, marcar como fallido
      message.status = 'failed';
      await this.messageQueueRepository.save(message);
      this.logger.warn(
        `Mensaje ${message.id} marcado como fallido después de ${message.attempts} intentos`,
      );
    } else {
      // Reintentar más tarde
      message.status = 'retrying';
      await this.messageQueueRepository.save(message);
      this.logger.debug(
        `Mensaje ${message.id} será reintentado (intento ${message.attempts}/${message.max_attempts})`,
      );
    }
  }
}
