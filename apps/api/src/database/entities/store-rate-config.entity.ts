import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from './store.entity';
import { Profile } from './profile.entity';
import { ExchangeRateType } from './exchange-rate.entity';

export type RoundingMode = 'UP' | 'DOWN' | 'NEAREST' | 'BANKER';
export type PreferChangeIn = 'USD' | 'BS' | 'SAME';
export type OverpaymentAction = 'CHANGE' | 'CREDIT' | 'TIP' | 'REJECT';

@Entity('store_rate_configs')
export class StoreRateConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column('uuid', { unique: true })
  store_id: string;

  // Tasa a usar por método de pago
  @Column({ type: 'varchar', length: 20, default: 'CASH' })
  cash_usd_rate_type: ExchangeRateType;

  @Column({ type: 'varchar', length: 20, default: 'BCV' })
  cash_bs_rate_type: ExchangeRateType;

  @Column({ type: 'varchar', length: 20, default: 'BCV' })
  pago_movil_rate_type: ExchangeRateType;

  @Column({ type: 'varchar', length: 20, default: 'BCV' })
  transfer_rate_type: ExchangeRateType;

  @Column({ type: 'varchar', length: 20, default: 'BCV' })
  point_of_sale_rate_type: ExchangeRateType;

  @Column({ type: 'varchar', length: 20, default: 'ZELLE' })
  zelle_rate_type: ExchangeRateType;

  // Configuración de redondeo
  @Column({ type: 'varchar', length: 20, default: 'NEAREST' })
  rounding_mode: RoundingMode;

  @Column({ type: 'int', default: 2 })
  rounding_precision: number;

  // Configuración de cambio
  @Column({ type: 'varchar', length: 10, default: 'BS' })
  prefer_change_in: PreferChangeIn;

  @Column({ type: 'boolean', default: true })
  auto_convert_small_change: boolean;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 1.0 })
  small_change_threshold_usd: number;

  // Configuración de sobrepago
  @Column({ type: 'boolean', default: true })
  allow_overpayment: boolean;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 10.0 })
  max_overpayment_usd: number;

  @Column({ type: 'varchar', length: 20, default: 'CHANGE' })
  overpayment_action: OverpaymentAction;

  // Auditoría
  @ManyToOne(() => Profile, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: Profile | null;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
