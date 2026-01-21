import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppConfigService } from './whatsapp-config.service';
import { WhatsAppBotService } from './whatsapp-bot.service';
import { WhatsAppMessagingService } from './whatsapp-messaging.service';
import { WhatsAppQueueProcessor } from './whatsapp-queue.processor';
import { WhatsAppConfig } from '../database/entities/whatsapp-config.entity';
import { WhatsAppMessageQueue } from '../database/entities/whatsapp-message-queue.entity';
import { Sale } from '../database/entities/sale.entity';
import { SaleItem } from '../database/entities/sale-item.entity';
import { Product } from '../database/entities/product.entity';
import { Debt } from '../database/entities/debt.entity';
import { DebtPayment } from '../database/entities/debt-payment.entity';
import { Customer } from '../database/entities/customer.entity';
import { Store } from '../database/entities/store.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WhatsAppConfig,
      WhatsAppMessageQueue,
      Sale,
      SaleItem,
      Product,
      Debt,
      DebtPayment,
      Customer,
      Store,
    ]),
    ScheduleModule,
  ],
  controllers: [WhatsAppController],
  providers: [
    WhatsAppConfigService,
    WhatsAppBotService,
    WhatsAppMessagingService,
    WhatsAppQueueProcessor,
  ],
  exports: [
    WhatsAppConfigService,
    WhatsAppBotService,
    WhatsAppMessagingService,
  ],
})
export class WhatsAppModule {}
