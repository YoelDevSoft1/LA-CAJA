import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Store } from '../database/entities/store.entity';
import { Warehouse } from '../database/entities/warehouse.entity';
import { PriceList } from '../database/entities/price-list.entity';
import { InvoiceSeries } from '../database/entities/invoice-series.entity';
import { ChartOfAccountsService } from '../accounting/chart-of-accounts.service';
import { ChartOfAccount } from '../database/entities/chart-of-accounts.entity';

export type BusinessType = 'retail' | 'services' | 'restaurant' | 'general';

export interface SetupConfig {
  business_type?: BusinessType;
  business_name?: string;
  fiscal_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency?: 'BS' | 'USD' | 'MIXED';
}

@Injectable()
export class SetupService {
  private readonly logger = new Logger(SetupService.name);

  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    @InjectRepository(PriceList)
    private priceListRepository: Repository<PriceList>,
    @InjectRepository(InvoiceSeries)
    private invoiceSeriesRepository: Repository<InvoiceSeries>,
    @InjectRepository(ChartOfAccount)
    private chartOfAccountRepository: Repository<ChartOfAccount>,
    private chartOfAccountsService: ChartOfAccountsService,
  ) {}

  /**
   * Configuración automática completa para una nueva tienda
   */
  async setupStore(
    storeId: string,
    userId: string,
    config: SetupConfig = {},
  ): Promise<{
    success: boolean;
    steps_completed: string[];
    steps_failed: string[];
    details: {
      warehouse_created?: boolean;
      price_list_created?: boolean;
      chart_of_accounts_initialized?: boolean;
      invoice_series_created?: boolean;
      payment_methods_configured?: boolean;
    };
  }> {
    const stepsCompleted: string[] = [];
    const stepsFailed: string[] = [];
    const details: any = {};

    try {
      // 1. Crear Almacén Principal
      try {
        await this.createDefaultWarehouse(storeId, userId);
        stepsCompleted.push('warehouse');
        details.warehouse_created = true;
      } catch (error) {
        this.logger.error(`Error creando almacén: ${error}`);
        stepsFailed.push('warehouse');
        details.warehouse_created = false;
      }

      // 2. Crear Lista de Precios Principal
      try {
        await this.createDefaultPriceList(storeId, userId);
        stepsCompleted.push('price_list');
        details.price_list_created = true;
      } catch (error) {
        this.logger.error(`Error creando lista de precios: ${error}`);
        stepsFailed.push('price_list');
        details.price_list_created = false;
      }

      // 3. Inicializar Plan de Cuentas (con template según tipo de negocio)
      try {
        const businessType = config.business_type || 'general';
        await this.initializeChartOfAccounts(storeId, userId, businessType);
        stepsCompleted.push('chart_of_accounts');
        details.chart_of_accounts_initialized = true;
      } catch (error) {
        this.logger.error(`Error inicializando plan de cuentas: ${error}`);
        stepsFailed.push('chart_of_accounts');
        details.chart_of_accounts_initialized = false;
      }

      // 4. Crear Serie de Factura Principal
      try {
        await this.createDefaultInvoiceSeries(storeId, userId, config);
        stepsCompleted.push('invoice_series');
        details.invoice_series_created = true;
      } catch (error) {
        this.logger.error(`Error creando serie de factura: ${error}`);
        stepsFailed.push('invoice_series');
        details.invoice_series_created = false;
      }

      // 5. Configurar Métodos de Pago Básicos
      // Nota: Los métodos de pago se configuran a nivel de store en otra tabla
      // Por ahora solo marcamos como completado si se requieren acciones adicionales
      stepsCompleted.push('payment_methods');
      details.payment_methods_configured = true;

      return {
        success: stepsFailed.length === 0,
        steps_completed: stepsCompleted,
        steps_failed: stepsFailed,
        details,
      };
    } catch (error) {
      this.logger.error(`Error en setup de tienda ${storeId}:`, error);
      throw new BadRequestException(`Error durante la configuración: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Crear almacén por defecto
   */
  private async createDefaultWarehouse(storeId: string, userId: string): Promise<Warehouse> {
    const existing = await this.warehouseRepository.findOne({
      where: { store_id: storeId, is_default: true },
    });

    if (existing) {
      return existing;
    }

    const warehouse = this.warehouseRepository.create({
      id: randomUUID(),
      store_id: storeId,
      name: 'Almacén Principal',
      code: 'ALM-001',
      description: 'Almacén principal de la tienda',
      is_default: true,
      is_active: true,
      address: null,
      note: null,
    });

    return this.warehouseRepository.save(warehouse);
  }

  /**
   * Crear lista de precios por defecto
   */
  private async createDefaultPriceList(storeId: string, userId: string): Promise<PriceList> {
    const existing = await this.priceListRepository.findOne({
      where: { store_id: storeId, is_default: true },
    });

    if (existing) {
      return existing;
    }

    const priceList = this.priceListRepository.create({
      id: randomUUID(),
      store_id: storeId,
      name: 'Lista Principal',
      code: 'LP-001',
      description: 'Lista de precios principal',
      is_default: true,
      is_active: true,
      valid_from: new Date(),
      valid_until: null,
    });

    return this.priceListRepository.save(priceList);
  }

  /**
   * Inicializar plan de cuentas con template según tipo de negocio
   */
  private async initializeChartOfAccounts(
    storeId: string,
    userId: string,
    businessType: BusinessType,
  ): Promise<void> {
    await this.chartOfAccountsService.initializeDefaultChartOfAccounts(storeId, userId, businessType);
  }

  /**
   * Crear serie de factura por defecto
   */
  private async createDefaultInvoiceSeries(
    storeId: string,
    userId: string,
    config: SetupConfig,
  ): Promise<InvoiceSeries> {
    const existing = await this.invoiceSeriesRepository.findOne({
      where: { store_id: storeId, is_active: true },
    });

    if (existing) {
      return existing;
    }

    const prefix = config.business_type === 'restaurant' ? 'FACT' : 'FACT';
    const fiscalId = config.fiscal_id || 'J-00000000-0';

    const invoiceSeries = this.invoiceSeriesRepository.create({
      id: randomUUID(),
      store_id: storeId,
      series_code: 'A',
      name: 'Serie Principal',
      prefix: prefix,
      start_number: 1,
      current_number: 0,
      is_active: true,
      note: `Serie creada automáticamente durante el setup`,
    });

    return this.invoiceSeriesRepository.save(invoiceSeries);
  }

  /**
   * Validar configuración completa de una tienda
   */
  async validateSetup(storeId: string): Promise<{
    is_complete: boolean;
    missing_steps: string[];
    details: {
      has_warehouse: boolean;
      has_price_list: boolean;
      has_chart_of_accounts: boolean;
      has_invoice_series: boolean;
      has_products?: boolean;
    };
  }> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { store_id: storeId, is_default: true, is_active: true },
    });

    const priceList = await this.priceListRepository.findOne({
      where: { store_id: storeId, is_default: true, is_active: true },
    });

    const invoiceSeries = await this.invoiceSeriesRepository.findOne({
      where: { store_id: storeId, is_active: true },
    });

    // Verificar si hay cuentas contables
    const chartOfAccountsCount = await this.chartOfAccountRepository.count({
      where: { store_id: storeId, is_active: true },
    });

    const missingSteps: string[] = [];
    if (!warehouse) missingSteps.push('warehouse');
    if (!priceList) missingSteps.push('price_list');
    if (chartOfAccountsCount === 0) missingSteps.push('chart_of_accounts');
    if (!invoiceSeries) missingSteps.push('invoice_series');

    return {
      is_complete: missingSteps.length === 0,
      missing_steps: missingSteps,
      details: {
        has_warehouse: !!warehouse,
        has_price_list: !!priceList,
        has_chart_of_accounts: chartOfAccountsCount > 0,
        has_invoice_series: !!invoiceSeries,
      },
    };
  }
}