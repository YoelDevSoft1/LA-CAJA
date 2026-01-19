import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Store } from './store.entity';

/**
 * Entity para tokens de recuperación de PIN
 * Permite recuperar PIN olvidado mediante email
 */
@Entity('pin_recovery_tokens')
export class PinRecoveryToken {
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

  @Column({ type: 'text', unique: true })
  @Index()
  token: string;

  @Column({ type: 'timestamptz' })
  @Index()
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  used_at: Date | null;

  @Column({ type: 'inet', nullable: true })
  ip_address: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  /**
   * Verifica si el token está activo (no expirado ni usado)
   */
  isActive(): boolean {
    const now = new Date();
    return this.expires_at > now && this.used_at === null;
  }
}
