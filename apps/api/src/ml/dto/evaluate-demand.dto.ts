import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class EvaluateDemandDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  product_ids?: string[];

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  top_n?: number = 3;

  @IsInt()
  @Min(30)
  @Max(365)
  @IsOptional()
  days_back?: number = 180;

  @IsInt()
  @Min(1)
  @Max(7)
  @IsOptional()
  horizon?: number = 1;

  @IsInt()
  @Min(7)
  @Max(90)
  @IsOptional()
  min_train_size?: number;

  @IsInt()
  @Min(5)
  @Max(60)
  @IsOptional()
  max_folds?: number = 30;
}
