import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { Store } from './store.entity';
import { Table } from './table.entity';

/**
 * Entidad para códigos QR de mesas
 * Cada mesa puede tener un código QR único para acceso público
 */
@Entity('qr_codes')
@Index(['store_id'])
@Index(['table_id'], { unique: true })
@Index(['qr_code'], { unique: true })
export class QRCode {
  @PrimaryColumn('uuid')
  id: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column('uuid')
  store_id: string;

  @OneToOne(() => Table, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table: Table;

  @Column({ type: 'uuid', unique: true })
  table_id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  qr_code: string;

  @Column({ type: 'text' })
  public_url: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  updated_at: Date;
}
