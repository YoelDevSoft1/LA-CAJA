import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SetupService } from './setup.service';
import { SetupController } from './setup.controller';
import { Store } from '../database/entities/store.entity';
import { Warehouse } from '../database/entities/warehouse.entity';
import { PriceList } from '../database/entities/price-list.entity';
import { InvoiceSeries } from '../database/entities/invoice-series.entity';
import { ChartOfAccount } from '../database/entities/chart-of-accounts.entity';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Store,
      Warehouse,
      PriceList,
      InvoiceSeries,
      ChartOfAccount,
    ]),
    AccountingModule,
  ],
  controllers: [SetupController],
  providers: [SetupService],
  exports: [SetupService],
})
export class SetupModule {}