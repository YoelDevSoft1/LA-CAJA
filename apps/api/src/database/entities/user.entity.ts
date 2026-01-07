import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * User Entity - Maps to profiles table
 * Used for ML notifications and other user-specific features
 */
@Entity('profiles')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  full_name: string | null;

  // Alias for full_name
  get name(): string | null {
    return this.full_name;
  }

  @Column({ type: 'text', nullable: true })
  email: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  updated_at: Date | null;
}
