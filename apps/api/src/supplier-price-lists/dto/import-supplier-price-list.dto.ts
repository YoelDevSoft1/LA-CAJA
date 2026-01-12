import { IsOptional, IsString, IsUUID, IsIn, MinLength } from 'class-validator';

export class ImportSupplierPriceListDto {
  @IsString()
  @MinLength(1)
  csv: string;

  @IsUUID()
  @IsOptional()
  supplier_id?: string | null;

  @IsString()
  @IsOptional()
  supplier_name?: string | null;

  @IsString()
  @IsOptional()
  list_name?: string | null;

  @IsIn(['USD', 'BS'])
  @IsOptional()
  currency?: 'USD' | 'BS';
}
