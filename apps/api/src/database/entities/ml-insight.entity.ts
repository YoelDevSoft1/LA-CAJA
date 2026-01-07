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

export type InsightType =
  | 'demand_forecast'
  | 'anomaly'
  | 'recommendation'
  | 'trend'
  | 'opportunity'
  | 'risk';

export type InsightCategory =
  | 'product'
  | 'sales'
  | 'inventory'
  | 'revenue'
  | 'customer'
  | 'performance';

export type InsightSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SuggestedAction {
  label: string;
  action: string;
  params?: Record<string, any>;
  priority?: number;
}

@Entity('ml_insights')
export class MLInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  store_id: string;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  // Insight classification
  @Column({ type: 'varchar', length: 50 })
  insight_type: InsightType;

  @Column({ type: 'varchar', length: 50 })
  insight_category: InsightCategory;

  // Entity linking
  @Column({ type: 'varchar', length: 50, nullable: true })
  entity_type: string | null;

  @Column({ type: 'uuid', nullable: true })
  entity_id: string | null;

  // ML model information
  @Column({ type: 'varchar', length: 50 })
  model_type: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  model_version: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidence_score: number | null;

  // Insight content
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  // ML-specific data
  @Column({ type: 'jsonb' })
  ml_data: Record<string, any>;

  // Severity and priority
  @Column({ type: 'varchar', length: 20, default: 'medium' })
  severity: InsightSeverity;

  @Column({ type: 'int', default: 50 })
  priority: number;

  // Actionability
  @Column({ type: 'boolean', default: false })
  is_actionable: boolean;

  @Column({ type: 'jsonb', nullable: true })
  suggested_actions: SuggestedAction[] | null;

  // Notification status
  @Column({ type: 'boolean', default: false })
  notification_sent: boolean;

  @Column({ type: 'uuid', nullable: true })
  notification_id: string | null;

  @ManyToOne(() => Notification, { nullable: true })
  @JoinColumn({ name: 'notification_id' })
  notification: Notification | null;

  // Validity and expiration
  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  valid_from: Date;

  @Column({ type: 'timestamptz', nullable: true })
  valid_until: Date | null;

  @Column({ type: 'boolean', default: false })
  is_resolved: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  resolved_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  resolved_by: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolved_by' })
  resolver: User | null;

  @Column({ type: 'text', nullable: true })
  resolution_note: string | null;

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
