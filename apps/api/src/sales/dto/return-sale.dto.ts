import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReturnSaleItemDto {
  @IsUUID()
  sale_item_id: string;

  @IsNumber()
  @Min(0.001)
  qty: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  serial_ids?: string[];
}

export class ReturnSaleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnSaleItemDto)
  items: ReturnSaleItemDto[];

  @IsOptional()
  @IsString()
  reason?: string;
}
