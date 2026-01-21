import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum UptimeStatus {
  UP = 'up',
  DOWN = 'down',
  DEGRADED = 'degraded',
}

@Entity('uptime_records')
@Index(['timestamp'])
@Index(['service_name'])
@Index(['status'])
@Index(['service_name', 'timestamp'])
export class UptimeRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamptz' })
  @Index()
  timestamp: Date;

  @Column({
    type: 'varchar',
    length: 20,
    enum: UptimeStatus,
  })
  status: UptimeStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  service_name: string | null;

  @Column({ type: 'integer', nullable: true })
  response_time_ms: number | null;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
