import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SaleReturn } from './sale-return.entity';
import { SaleItem } from './sale-item.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductLot } from './product-lot.entity';

@Entity('sale_return_items')
@Index(['return_id'])
@Index(['sale_item_id'])
export class SaleReturnItem {
  @PrimaryColumn('uuid')
  id: string;

  @ManyToOne(() => SaleReturn, (ret) => ret.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'return_id' })
  return: SaleReturn;

  @Column('uuid')
  return_id: string;

  @ManyToOne(() => SaleItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_item_id' })
  sale_item: SaleItem;

  @Column('uuid')
  sale_item_id: string;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product | null;

  @Column('uuid')
  product_id: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant | null;

  @Column({ type: 'uuid', nullable: true })
  variant_id: string | null;

  @ManyToOne(() => ProductLot, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'lot_id' })
  lot: ProductLot | null;

  @Column({ type: 'uuid', nullable: true })
  lot_id: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 3 })
  qty: number;

  @Column({ type: 'numeric', precision: 18, scale: 4, default: 0 })
  unit_price_bs: number;

  @Column({ type: 'numeric', precision: 18, scale: 4, default: 0 })
  unit_price_usd: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  discount_bs: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  discount_usd: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  total_bs: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  total_usd: number;

  @Column({ type: 'jsonb', nullable: true })
  serial_ids: string[] | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}
