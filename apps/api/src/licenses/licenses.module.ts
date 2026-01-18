import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicensesController } from './licenses.controller';
import { LicensePaymentsService } from './license-payments.service';
import { LicenseVerificationService } from './license-verification.service';
import { LicenseBankIntegrationService } from './license-bank-integration.service';
import {
  LicensePayment,
  LicensePaymentDocument,
  LicensePaymentVerification,
} from '../database/entities';
import { Store } from '../database/entities/store.entity';
import { Profile } from '../database/entities/profile.entity';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LicensePayment,
      LicensePaymentDocument,
      LicensePaymentVerification,
      Store,
      Profile,
    ]),
    SecurityModule, // ✅ Necesario para AdminApiGuard (usa SecurityAuditService)
  ],
  controllers: [LicensesController],
  providers: [
    LicensePaymentsService,
    LicenseVerificationService,
    LicenseBankIntegrationService,
  ],
  exports: [
    LicensePaymentsService,
    LicenseVerificationService,
    LicenseBankIntegrationService,
  ],
})
export class LicensesModule {}
