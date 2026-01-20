import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KitchenDisplayController } from './kitchen-display.controller';
import { KitchenDisplayService } from './kitchen-display.service';
import { Order } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { Table } from '../database/entities/table.entity';
import { Product } from '../database/entities/product.entity';

/**
 * Módulo para Kitchen Display System (KDS)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Table, Product]),
  ],
  controllers: [KitchenDisplayController],
  providers: [KitchenDisplayService],
  exports: [KitchenDisplayService],
})
export class KitchenDisplayModule {}
