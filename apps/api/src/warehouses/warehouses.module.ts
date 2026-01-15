import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';
import { Warehouse } from '../database/entities/warehouse.entity';
import { WarehouseStock } from '../database/entities/warehouse-stock.entity';
import { Product } from '../database/entities/product.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Warehouse, WarehouseStock, Product]),
    NotificationsModule,
  ],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}
