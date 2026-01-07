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
import { Notification } from './notification.entity';
import { NotificationTemplate } from './notification-template.entity';

export type EmailStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'bounced';

@Entity('email_queue')
export class EmailQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  store_id: string;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ type: 'uuid', nullable: true })
  notification_id: string | null;

  @ManyToOne(() => Notification, { nullable: true })
  @JoinColumn({ name: 'notification_id' })
  notification: Notification | null;

  // Recipient
  @Column({ type: 'varchar', length: 255 })
  to_email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  to_name: string | null;

  // Email content
  @Column({ type: 'varchar', length: 500 })
  subject: string;

  @Column({ type: 'text' })
  html_body: string;

  @Column({ type: 'text', nullable: true })
  text_body: string | null;

  // Template used
  @Column({ type: 'uuid', nullable: true })
  template_id: string | null;

  @ManyToOne(() => NotificationTemplate, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: NotificationTemplate | null;

  @Column({ type: 'jsonb', nullable: true })
  template_variables: Record<string, any> | null;

  // Sending configuration
  @Column({ type: 'varchar', length: 255, nullable: true })
  from_email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  from_name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reply_to: string | null;

  // Priority and scheduling
  @Column({ type: 'int', default: 50 })
  priority: number;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  scheduled_for: Date;

  // Status tracking
  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: EmailStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 3 })
  max_attempts: number;

  // Provider tracking (Resend)
  @Column({ type: 'varchar', length: 255, nullable: true })
  provider_message_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  provider_response: Record<string, any> | null;

  // Timestamps
  @Column({ type: 'timestamptz', nullable: true })
  sent_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  failed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
