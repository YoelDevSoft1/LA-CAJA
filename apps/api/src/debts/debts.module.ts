import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebtsController } from './debts.controller';
import { DebtsService } from './debts.service';
import { Debt } from '../database/entities/debt.entity';
import { DebtPayment } from '../database/entities/debt-payment.entity';
import { Customer } from '../database/entities/customer.entity';
import { Sale } from '../database/entities/sale.entity';
import { ExchangeModule } from '../exchange/exchange.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Debt, DebtPayment, Customer, Sale]),
    ExchangeModule,
    AccountingModule,
  ],
  controllers: [DebtsController],
  providers: [DebtsService],
  exports: [DebtsService],
})
export class DebtsModule {}
