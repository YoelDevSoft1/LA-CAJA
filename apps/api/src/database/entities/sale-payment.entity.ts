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
import { Profile } from './profile.entity';
import { ExchangeRateType } from './exchange-rate.entity';

export type PaymentMethod =
  | 'CASH_USD'
  | 'CASH_BS'
  | 'PAGO_MOVIL'
  | 'TRANSFER'
  | 'POINT_OF_SALE'
  | 'ZELLE'
  | 'OTHER'
  | 'FIAO';

export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'REFUNDED';

@Entity('sale_payments')
@Index(['sale_id'])
@Index(['method'])
@Index(['status'], { where: "status != 'CONFIRMED'" })
export class SalePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column('uuid')
  sale_id: string;

  @Column({ type: 'int', default: 1 })
  payment_order: number;

  @Column({ type: 'varchar', length: 20 })
  method: PaymentMethod;

  // Montos en centavos para precisión
  @Column({ type: 'bigint' })
  amount_cents_usd: number;

  @Column({ type: 'bigint' })
  amount_cents_bs: number;

  // Tasa aplicada
  @Column({ type: 'varchar', length: 20, default: 'BCV' })
  rate_type: ExchangeRateType;

  @Column({ type: 'numeric', precision: 18, scale: 6 })
  applied_rate: number;

  // Detalles opcionales
  @Column({ type: 'varchar', length: 100, nullable: true })
  reference: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  bank_code: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 4, nullable: true })
  card_last_4: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  authorization_code: string | null;

  // Estado
  @Column({ type: 'varchar', length: 20, default: 'CONFIRMED' })
  status: PaymentStatus;

  @Column({ type: 'timestamptz', nullable: true })
  confirmed_at: Date | null;

  @ManyToOne(() => Profile, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'confirmed_by' })
  confirmer: Profile | null;

  @Column({ type: 'uuid', nullable: true })
  confirmed_by: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // Helpers para conversión de centavos
  get amountUsd(): number {
    return Number(this.amount_cents_usd) / 100;
  }

  get amountBs(): number {
    return Number(this.amount_cents_bs) / 100;
  }
}
