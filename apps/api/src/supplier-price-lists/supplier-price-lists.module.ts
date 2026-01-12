import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierPriceList } from '../database/entities/supplier-price-list.entity';
import { SupplierPriceListItem } from '../database/entities/supplier-price-list-item.entity';
import { Supplier } from '../database/entities/supplier.entity';
import { SupplierPriceListsController } from './supplier-price-lists.controller';
import { SupplierPriceListsService } from './supplier-price-lists.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupplierPriceList,
      SupplierPriceListItem,
      Supplier,
    ]),
  ],
  controllers: [SupplierPriceListsController],
  providers: [SupplierPriceListsService],
  exports: [SupplierPriceListsService],
})
export class SupplierPriceListsModule {}
