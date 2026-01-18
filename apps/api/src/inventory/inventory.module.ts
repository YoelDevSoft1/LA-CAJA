import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryMovement } from '../database/entities/inventory-movement.entity';
import { Product } from '../database/entities/product.entity';
import { WarehouseStock } from '../database/entities/warehouse-stock.entity';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryMovement, Product, WarehouseStock]),
    WarehousesModule,
    AccountingModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
