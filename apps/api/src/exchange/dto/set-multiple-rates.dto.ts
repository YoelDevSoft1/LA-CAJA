import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsArray,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExchangeRateType } from '../../database/entities/exchange-rate.entity';

class RateItemDto {
  @IsIn(['BCV', 'PARALLEL', 'CASH', 'ZELLE'])
  rate_type: ExchangeRateType;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  rate: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_preferred?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SetMultipleRatesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RateItemDto)
  rates: RateItemDto[];
}
