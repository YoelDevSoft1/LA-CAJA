import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Store } from './store.entity';
import { Supplier } from './supplier.entity';
import { SupplierPriceListItem } from './supplier-price-list-item.entity';

@Entity('supplier_price_lists')
@Index(['store_id'])
@Index(['store_id', 'supplier_id'])
@Index(['store_id', 'is_active'], { where: 'is_active = true' })
@Index(['store_id', 'supplier_id', 'source_date'])
export class SupplierPriceList {
  @PrimaryColumn('uuid')
  id: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column('uuid')
  store_id: string;

  @ManyToOne(() => Supplier, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier | null;

  @Column({ type: 'uuid', nullable: true })
  supplier_id: string | null;

  @Column({ type: 'text', nullable: true })
  supplier_name: string | null;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: 'USD' | 'BS';

  @Column({ type: 'date', nullable: true })
  source_date: Date | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  imported_at: Date;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @OneToMany(() => SupplierPriceListItem, (item) => item.list, {
    cascade: true,
  })
  items: SupplierPriceListItem[];
}
