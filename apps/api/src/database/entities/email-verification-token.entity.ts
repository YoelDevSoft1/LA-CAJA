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

/**
 * Entity para tokens de verificación de email
 * Permite verificar emails de usuarios durante el registro
 */
@Entity('email_verification_tokens')
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  profile: Profile;

  @Column({ type: 'text', unique: true })
  @Index()
  token: string;

  @Column({ type: 'timestamptz' })
  @Index()
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  used_at: Date | null;

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
