import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Store } from './store.entity';

/**
 * Entity para autenticación de dos factores (2FA)
 * Permite 2FA opcional con TOTP para mayor seguridad
 */
@Entity('two_factor_auth')
@Unique(['user_id', 'store_id'])
export class TwoFactorAuth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  profile: Profile;

  @Column({ type: 'uuid' })
  @Index()
  store_id: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ type: 'text' })
  secret: string; // Secret para generar códigos TOTP

  @Column({ type: 'text', array: true, default: '{}' })
  backup_codes: string[]; // Códigos de respaldo hasheados

  @Column({ type: 'boolean', default: false })
  @Index()
  is_enabled: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  enabled_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_used_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
