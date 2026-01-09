import {
  IsOptional,
  IsIn,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExchangeRateType } from '../../database/entities/exchange-rate.entity';

const RATE_TYPES = ['BCV', 'PARALLEL', 'CASH', 'ZELLE'];
const ROUNDING_MODES = ['UP', 'DOWN', 'NEAREST', 'BANKER'];
const CHANGE_CURRENCIES = ['USD', 'BS', 'SAME'];
const OVERPAYMENT_ACTIONS = ['CHANGE', 'CREDIT', 'TIP', 'REJECT'];

export class UpdateRateConfigDto {
  // Tasas por método de pago
  @IsOptional()
  @IsIn(RATE_TYPES)
  cash_usd_rate_type?: ExchangeRateType;

  @IsOptional()
  @IsIn(RATE_TYPES)
  cash_bs_rate_type?: ExchangeRateType;

  @IsOptional()
  @IsIn(RATE_TYPES)
  pago_movil_rate_type?: ExchangeRateType;

  @IsOptional()
  @IsIn(RATE_TYPES)
  transfer_rate_type?: ExchangeRateType;

  @IsOptional()
  @IsIn(RATE_TYPES)
  point_of_sale_rate_type?: ExchangeRateType;

  @IsOptional()
  @IsIn(RATE_TYPES)
  zelle_rate_type?: ExchangeRateType;

  // Redondeo
  @IsOptional()
  @IsIn(ROUNDING_MODES)
  rounding_mode?: 'UP' | 'DOWN' | 'NEAREST' | 'BANKER';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4)
  @Type(() => Number)
  rounding_precision?: number;

  // Cambio
  @IsOptional()
  @IsIn(CHANGE_CURRENCIES)
  prefer_change_in?: 'USD' | 'BS' | 'SAME';

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  auto_convert_small_change?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  small_change_threshold_usd?: number;

  // Sobrepago
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  allow_overpayment?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  max_overpayment_usd?: number;

  @IsOptional()
  @IsIn(OVERPAYMENT_ACTIONS)
  overpayment_action?: 'CHANGE' | 'CREDIT' | 'TIP' | 'REJECT';
}
