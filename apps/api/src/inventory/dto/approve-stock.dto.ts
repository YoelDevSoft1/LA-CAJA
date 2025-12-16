import { IsUUID } from 'class-validator';

export class ApproveStockDto {
  @IsUUID()
  movement_id: string;
}
