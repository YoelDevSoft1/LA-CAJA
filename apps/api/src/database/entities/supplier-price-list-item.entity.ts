import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SupplierPriceList } from './supplier-price-list.entity';

@Entity('supplier_price_list_items')
@Index(['list_id'])
@Index(['list_id', 'product_code'])
@Index(['list_id', 'product_name'])
export class SupplierPriceListItem {
  @PrimaryColumn('uuid')
  id: string;

  @ManyToOne(() => SupplierPriceList, (list) => list.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'list_id' })
  list: SupplierPriceList;

  @Column({ type: 'uuid', name: 'list_id' })
  list_id: string;

  @Column({ type: 'text' })
  product_code: string;

  @Column({ type: 'text' })
  product_name: string;

  @Column({ type: 'numeric', precision: 18, scale: 3, nullable: true })
  units_per_case: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 4, nullable: true })
  price_a: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 4, nullable: true })
  price_b: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 4, nullable: true })
  unit_price_a: number | null;

  @Column({ type: 'numeric', precision: 18, scale: 4, nullable: true })
  unit_price_b: number | null;

  @Column({ type: 'text', nullable: true })
  supplier_name: string | null;

  @Column({ type: 'date', nullable: true })
  source_date: Date | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;
}
