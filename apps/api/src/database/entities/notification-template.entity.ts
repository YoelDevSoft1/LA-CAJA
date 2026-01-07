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

export type TemplateType = 'ml_insight' | 'alert' | 'recommendation' | 'digest';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type DeliveryChannel = 'email' | 'push' | 'in_app' | 'websocket' | 'sms';

@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  store_id: string | null;

  @ManyToOne(() => Store, { nullable: true })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  // Template identification
  @Column({ type: 'varchar', length: 100 })
  template_key: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Template content (multi-language support)
  @Column({ type: 'jsonb' })
  content: {
    [language: string]: {
      title: string;
      body: string;
    };
  };

  // Template variables schema
  @Column({ type: 'jsonb', nullable: true })
  variables_schema: Record<string, any> | null;

  // Template type and category
  @Column({ type: 'varchar', length: 50 })
  template_type: TemplateType;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  // ML-specific configuration
  @Column({ type: 'jsonb', nullable: true })
  ml_trigger_config: Record<string, any> | null;

  // Channel-specific templates
  @Column({ type: 'text', nullable: true })
  email_template: string | null;

  @Column({ type: 'text', nullable: true })
  push_template: string | null;

  @Column({ type: 'text', nullable: true })
  in_app_template: string | null;

  // Priority and scheduling
  @Column({ type: 'varchar', length: 20, default: 'medium' })
  default_priority: Priority;

  @Column({ type: 'text', array: true, default: () => "ARRAY['in_app']" })
  default_channels: DeliveryChannel[];

  // Status and versioning
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
