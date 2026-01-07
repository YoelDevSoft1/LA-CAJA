import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Store } from './store.entity';
import { User } from './user.entity';
import { Notification } from './notification.entity';

export type DeliveryChannel = 'email' | 'push' | 'in_app' | 'websocket' | 'sms';
export type DeliveryStatus =
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'bounced'
  | 'complained';

@Entity('notification_analytics')
export class NotificationAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  store_id: string;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ type: 'uuid' })
  notification_id: string;

  @ManyToOne(() => Notification)
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Delivery tracking
  @Column({ type: 'timestamptz', nullable: true })
  delivered_at: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  delivery_channel: DeliveryChannel | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  delivery_status: DeliveryStatus | null;

  // Engagement metrics
  @Column({ type: 'timestamptz', nullable: true })
  opened_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  clicked_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  dismissed_at: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  action_taken: string | null;

  // Email-specific metrics
  @Column({ type: 'boolean', default: false })
  email_opened: boolean;

  @Column({ type: 'boolean', default: false })
  email_clicked: boolean;

  @Column({ type: 'boolean', default: false })
  email_bounced: boolean;

  @Column({ type: 'boolean', default: false })
  email_complained: boolean;

  // Push-specific metrics
  @Column({ type: 'boolean', default: false })
  push_opened: boolean;

  @Column({ type: 'boolean', default: false })
  push_dismissed: boolean;

  // Timing metrics
  @Column({ type: 'int', nullable: true })
  time_to_open_seconds: number | null;

  @Column({ type: 'int', nullable: true })
  time_to_action_seconds: number | null;

  // Device and context
  @Column({ type: 'varchar', length: 50, nullable: true })
  device_type: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string | null;

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
