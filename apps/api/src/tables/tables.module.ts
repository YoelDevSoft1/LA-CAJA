import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { QRCodesService } from './qr-codes.service';
import { Table } from '../database/entities/table.entity';
import { QRCode } from '../database/entities/qr-code.entity';

/**
 * Módulo para gestión de mesas y códigos QR
 */
@Module({
  imports: [TypeOrmModule.forFeature([Table, QRCode])],
  controllers: [TablesController],
  providers: [TablesService, QRCodesService],
  exports: [TablesService, QRCodesService],
})
export class TablesModule {}
