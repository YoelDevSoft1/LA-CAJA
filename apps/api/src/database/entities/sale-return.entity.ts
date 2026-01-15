import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Store } from './store.entity';
import { Sale } from './sale.entity';
import { Profile } from './profile.entity';
import { SaleReturnItem } from './sale-return-item.entity';

@Entity('sale_returns')
@Index(['sale_id'])
@Index(['store_id'])
export class SaleReturn {
  @PrimaryColumn('uuid')
  id: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column('uuid')
  store_id: string;

  @ManyToOne(() => Sale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column('uuid')
  sale_id: string;

  @ManyToOne(() => Profile, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by_user: Profile | null;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  total_bs: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  total_usd: number;

  @OneToMany(() => SaleReturnItem, (item) => item.return, { cascade: true })
  items: SaleReturnItem[];
}
