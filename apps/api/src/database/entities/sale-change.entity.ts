import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Sale } from './sale.entity';

export type ChangeMethod = 'CASH_USD' | 'CASH_BS' | 'CREDIT' | 'TIP' | 'MIXED';
export type ExcessAction = 'FAVOR_CUSTOMER' | 'FAVOR_STORE' | 'CREDIT' | 'TIP';

export interface ChangeBreakdown {
  bills: Array<{
    denomination: number;
    count: number;
    subtotal: number;
  }>;
  total_bs: number;
  excess_cents: number;
  excess_bs: number;
}

@Entity('sale_change')
@Index(['sale_id'])
export class SaleChange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column('uuid')
  sale_id: string;

  // Montos en centavos
  @Column({ type: 'bigint', default: 0 })
  change_cents_usd: number;

  @Column({ type: 'bigint', default: 0 })
  change_cents_bs: number;

  @Column({ type: 'varchar', length: 20, default: 'CASH_BS' })
  change_method: ChangeMethod;

  @Column({ type: 'numeric', precision: 18, scale: 6 })
  applied_rate: number;

  // Desglose de denominaciones
  @Column({ type: 'jsonb', nullable: true })
  breakdown: ChangeBreakdown | null;

  // Exceso por redondeo
  @Column({ type: 'bigint', default: 0 })
  excess_cents_bs: number;

  @Column({ type: 'varchar', length: 20, default: 'FAVOR_CUSTOMER' })
  excess_action: ExcessAction;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // Helpers
  get changeUsd(): number {
    return Number(this.change_cents_usd) / 100;
  }

  get changeBs(): number {
    return Number(this.change_cents_bs) / 100;
  }

  get excessBs(): number {
    return Number(this.excess_cents_bs) / 100;
  }
}
