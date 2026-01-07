-- =====================================================
-- ML-Driven Intelligent Notifications System
-- Migration 36: Templates, ML Insights, Analytics
-- FIXED VERSION - Sin referencias a tabla 'users'
-- =====================================================

-- =====================================================
-- 1. Notification Templates System
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,

  -- Template identification
  template_key VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Template content (multi-language support)
  content JSONB NOT NULL,

  -- Template variables schema
  variables_schema JSONB,

  -- Template type and category
  template_type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,

  -- ML-specific configuration
  ml_trigger_config JSONB,

  -- Channel-specific templates
  email_template TEXT,
  push_template TEXT,
  in_app_template TEXT,

  -- Priority and scheduling
  default_priority VARCHAR(20) DEFAULT 'medium',
  default_channels TEXT[] DEFAULT ARRAY['in_app'],

  -- Status and versioning
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_template_key_version UNIQUE(store_id, template_key, version)
);

CREATE INDEX idx_notification_templates_store ON notification_templates(store_id);
CREATE INDEX idx_notification_templates_key ON notification_templates(template_key);
CREATE INDEX idx_notification_templates_type ON notification_templates(template_type);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active);

-- =====================================================
-- 2. ML Insights and Triggers
-- =====================================================

CREATE TABLE IF NOT EXISTS ml_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Insight classification
  insight_type VARCHAR(50) NOT NULL,
  insight_category VARCHAR(50) NOT NULL,

  -- Entity linking
  entity_type VARCHAR(50),
  entity_id UUID,

  -- ML model information
  model_type VARCHAR(50) NOT NULL,
  model_version VARCHAR(20),
  confidence_score NUMERIC(5,2),

  -- Insight content
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  -- ML-specific data
  ml_data JSONB NOT NULL,

  -- Severity and priority
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  priority INTEGER DEFAULT 50,

  -- Actionability
  is_actionable BOOLEAN DEFAULT false,
  suggested_actions JSONB,

  -- Notification status
  notification_sent BOOLEAN DEFAULT false,
  notification_id UUID REFERENCES notifications(id),

  -- Validity and expiration
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID, -- Sin FK constraint - será UUID del usuario
  resolution_note TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ml_insights_store ON ml_insights(store_id);
CREATE INDEX idx_ml_insights_type ON ml_insights(insight_type);
CREATE INDEX idx_ml_insights_category ON ml_insights(insight_category);
CREATE INDEX idx_ml_insights_entity ON ml_insights(entity_type, entity_id);
CREATE INDEX idx_ml_insights_severity ON ml_insights(severity);
CREATE INDEX idx_ml_insights_notification_sent ON ml_insights(notification_sent);
CREATE INDEX idx_ml_insights_valid ON ml_insights(valid_from, valid_until);
CREATE INDEX idx_ml_insights_created ON ml_insights(created_at DESC);

-- =====================================================
-- 3. Notification Analytics and Engagement
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Sin FK constraint

  -- Delivery tracking
  delivered_at TIMESTAMPTZ,
  delivery_channel VARCHAR(50),
  delivery_status VARCHAR(50),

  -- Engagement metrics
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  action_taken VARCHAR(100),

  -- Email-specific metrics
  email_opened BOOLEAN DEFAULT false,
  email_clicked BOOLEAN DEFAULT false,
  email_bounced BOOLEAN DEFAULT false,
  email_complained BOOLEAN DEFAULT false,

  -- Push-specific metrics
  push_opened BOOLEAN DEFAULT false,
  push_dismissed BOOLEAN DEFAULT false,

  -- Timing metrics
  time_to_open_seconds INTEGER,
  time_to_action_seconds INTEGER,

  -- Device and context
  device_type VARCHAR(50),
  user_agent TEXT,
  ip_address VARCHAR(45),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_analytics_store ON notification_analytics(store_id);
CREATE INDEX idx_notification_analytics_notification ON notification_analytics(notification_id);
CREATE INDEX idx_notification_analytics_user ON notification_analytics(user_id);
CREATE INDEX idx_notification_analytics_channel ON notification_analytics(delivery_channel);
CREATE INDEX idx_notification_analytics_status ON notification_analytics(delivery_status);
CREATE INDEX idx_notification_analytics_engagement ON notification_analytics(opened_at, clicked_at);
CREATE INDEX idx_notification_analytics_created ON notification_analytics(created_at DESC);

-- =====================================================
-- 4. Notification Rate Limiting
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID, -- Sin FK constraint

  -- Limit configuration
  category VARCHAR(50),
  channel VARCHAR(50),

  -- Rate limit rules
  max_per_hour INTEGER,
  max_per_day INTEGER,
  max_per_week INTEGER,

  -- Current usage (rolling windows)
  count_last_hour INTEGER DEFAULT 0,
  count_last_day INTEGER DEFAULT 0,
  count_last_week INTEGER DEFAULT 0,

  -- Window tracking
  hour_window_start TIMESTAMPTZ DEFAULT NOW(),
  day_window_start TIMESTAMPTZ DEFAULT NOW(),
  week_window_start TIMESTAMPTZ DEFAULT NOW(),

  -- Priority override
  allow_critical_override BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_rate_limit UNIQUE(store_id, user_id, category, channel)
);

CREATE INDEX idx_notification_rate_limits_store ON notification_rate_limits(store_id);
CREATE INDEX idx_notification_rate_limits_user ON notification_rate_limits(user_id);

-- =====================================================
-- 5. ML Notification Rules Engine
-- =====================================================

CREATE TABLE IF NOT EXISTS ml_notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Rule identification
  rule_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- ML trigger conditions
  ml_insight_type VARCHAR(50) NOT NULL,
  trigger_conditions JSONB NOT NULL,

  -- Notification template
  template_id UUID REFERENCES notification_templates(id),
  template_key VARCHAR(100),

  -- Target audience
  target_roles TEXT[],
  target_users UUID[],

  -- Execution rules
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 50,

  -- Frequency control
  cooldown_minutes INTEGER DEFAULT 0,
  max_executions_per_day INTEGER,

  -- Scheduling
  schedule_cron VARCHAR(100),
  schedule_timezone VARCHAR(50) DEFAULT 'UTC',

  -- Execution tracking
  last_executed_at TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ml_notification_rules_store ON ml_notification_rules(store_id);
CREATE INDEX idx_ml_notification_rules_insight_type ON ml_notification_rules(ml_insight_type);
CREATE INDEX idx_ml_notification_rules_active ON ml_notification_rules(is_active);

-- =====================================================
-- 6. Extend existing notifications table
-- =====================================================

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS ml_insight_id UUID REFERENCES ml_insights(id),
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES notification_templates(id),
  ADD COLUMN IF NOT EXISTS template_variables JSONB,
  ADD COLUMN IF NOT EXISTS engagement_score NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_ml_generated BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_notifications_ml_insight ON notifications(ml_insight_id);
CREATE INDEX IF NOT EXISTS idx_notifications_template ON notifications(template_id);
CREATE INDEX IF NOT EXISTS idx_notifications_ml_generated ON notifications(is_ml_generated);

-- =====================================================
-- 7. Email Queue and Tracking (for Resend integration)
-- =====================================================

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,

  -- Recipient
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),

  -- Email content
  subject VARCHAR(500) NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,

  -- Template used
  template_id UUID REFERENCES notification_templates(id),
  template_variables JSONB,

  -- Sending configuration
  from_email VARCHAR(255),
  from_name VARCHAR(255),
  reply_to VARCHAR(255),

  -- Priority and scheduling
  priority INTEGER DEFAULT 50,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),

  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Provider tracking (Resend)
  provider_message_id VARCHAR(255),
  provider_response JSONB,

  -- Timestamps
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_queue_store ON email_queue(store_id);
CREATE INDEX idx_email_queue_notification ON email_queue(notification_id);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_email_queue_priority ON email_queue(priority DESC) WHERE status = 'pending';

-- =====================================================
-- 8. Default ML Notification Templates
-- =====================================================

INSERT INTO notification_templates (template_key, name, description, content, template_type, category, ml_trigger_config, default_priority, default_channels, email_template, store_id)
VALUES
  (
    'demand_high',
    'Producto en Alta Demanda',
    'Notificación cuando un producto muestra alta demanda predicha',
    '{"es": {"title": "🔥 {{productName}} está en alta demanda", "body": "Demanda predicha: {{predicted}} unidades ({{confidence}}% confianza). Considera aumentar stock."}, "en": {"title": "🔥 {{productName}} is in high demand", "body": "Predicted demand: {{predicted}} units ({{confidence}}% confidence). Consider increasing stock."}}',
    'ml_insight',
    'inventory',
    '{"confidence_threshold": 80, "prediction_ratio_min": 1.5}',
    'high',
    ARRAY['email', 'push', 'in_app'],
    '<h1>🔥 {{productName}} is on Fire!</h1><p>Our ML models predict high demand for this product.</p><ul><li>Predicted: {{predicted}} units</li><li>Confidence: {{confidence}}%</li><li>Trend: {{trend}}</li></ul><p><a href="{{actionUrl}}">View Analytics</a></p>',
    NULL
  ),
  (
    'stock_alert',
    'Alerta de Desabasto',
    'Notificación de riesgo de quedarse sin stock',
    '{"es": {"title": "⚠️ Riesgo de Desabasto: {{productName}}", "body": "Stock actual ({{currentStock}}) insuficiente para demanda predicha ({{predicted}}). Días hasta desabasto: {{daysUntilStockout}}"}, "en": {"title": "⚠️ Stock Risk: {{productName}}", "body": "Current stock ({{currentStock}}) insufficient for predicted demand ({{predicted}}). Days until stockout: {{daysUntilStockout}}"}}',
    'ml_insight',
    'inventory',
    '{"confidence_threshold": 70, "severity": ["high", "critical"]}',
    'urgent',
    ARRAY['email', 'push', 'in_app'],
    '<h1>⚠️ Stock Alert</h1><p><strong>{{productName}}</strong> is at risk of running out.</p><ul><li>Current Stock: {{currentStock}}</li><li>Predicted Demand: {{predicted}}</li><li>Days Until Stockout: {{daysUntilStockout}}</li><li>Recommended Order: {{recommendedOrder}} units</li></ul>',
    NULL
  ),
  (
    'anomaly_critical',
    'Anomalía Crítica Detectada',
    'Notificación de anomalías críticas en ventas o inventario',
    '{"es": {"title": "🚨 Anomalía Crítica: {{entityType}}", "body": "{{description}} (Score: {{score}}). Requiere revisión inmediata."}, "en": {"title": "🚨 Critical Anomaly: {{entityType}}", "body": "{{description}} (Score: {{score}}). Requires immediate review."}}',
    'ml_insight',
    'realtime_analytics',
    '{"severity": ["critical"], "score_min": 80}',
    'urgent',
    ARRAY['email', 'push', 'in_app'],
    '<h1 style="color: #dc2626;">🚨 Critical Anomaly Detected</h1><p>{{description}}</p><ul><li>Type: {{anomalyType}}</li><li>Score: {{score}}</li><li>Detection Method: {{detectionMethod}}</li></ul><p><strong>Action Required:</strong> Please review immediately.</p>',
    NULL
  ),
  (
    'ml_recommendation',
    'Oportunidad de Cross-Selling',
    'Recomendación de productos complementarios',
    '{"es": {"title": "🎯 Oportunidad de Venta", "body": "Cliente compró {{productA}}. Alta probabilidad ({{score}}%) de comprar {{productB}}"}, "en": {"title": "🎯 Sales Opportunity", "body": "Customer purchased {{productA}}. High probability ({{score}}%) of buying {{productB}}"}}',
    'ml_insight',
    'sales',
    '{"score_min": 75}',
    'medium',
    ARRAY['in_app'],
    '<h1>🎯 Cross-Selling Opportunity</h1><p>A customer just purchased <strong>{{productA}}</strong>.</p><p>Our ML model predicts a {{score}}% probability they will also buy <strong>{{productB}}</strong>.</p><p>Suggested action: Offer bundle or discount.</p>',
    NULL
  ),
  (
    'ml_daily_digest',
    'Resumen Diario Inteligente',
    'Digest diario con insights de ML personalizados',
    '{"es": {"title": "🎁 Tu Resumen Diario", "body": "Buenos días! Aquí están tus insights del día: {{insights}}"}, "en": {"title": "🎁 Your Daily Digest", "body": "Good morning! Here are your insights for today: {{insights}}"}}',
    'ml_insight',
    'general',
    '{}',
    'medium',
    ARRAY['email', 'in_app'],
    '<h1>🎁 Your Daily ML Insights</h1><p>Good morning! Here is your personalized summary:</p><div>{{insights}}</div><p>Model Performance: {{modelPerformance}}</p>',
    NULL
  );

-- =====================================================
-- 9. Create views for analytics
-- =====================================================

CREATE OR REPLACE VIEW notification_engagement_metrics AS
SELECT
  n.store_id,
  n.notification_type,
  n.category,
  n.priority,
  DATE_TRUNC('day', n.created_at) as date,
  COUNT(DISTINCT n.id) as total_sent,
  COUNT(DISTINCT na.id) FILTER (WHERE na.opened_at IS NOT NULL) as total_opened,
  COUNT(DISTINCT na.id) FILTER (WHERE na.clicked_at IS NOT NULL) as total_clicked,
  COUNT(DISTINCT na.id) FILTER (WHERE na.action_taken IS NOT NULL) as total_actions,
  ROUND(
    COUNT(DISTINCT na.id) FILTER (WHERE na.opened_at IS NOT NULL)::NUMERIC /
    NULLIF(COUNT(DISTINCT n.id), 0) * 100,
    2
  ) as open_rate,
  ROUND(
    COUNT(DISTINCT na.id) FILTER (WHERE na.clicked_at IS NOT NULL)::NUMERIC /
    NULLIF(COUNT(DISTINCT n.id), 0) * 100,
    2
  ) as click_rate,
  AVG(na.time_to_open_seconds) FILTER (WHERE na.time_to_open_seconds IS NOT NULL) as avg_time_to_open,
  AVG(na.time_to_action_seconds) FILTER (WHERE na.time_to_action_seconds IS NOT NULL) as avg_time_to_action
FROM notifications n
LEFT JOIN notification_analytics na ON n.id = na.notification_id
GROUP BY n.store_id, n.notification_type, n.category, n.priority, DATE_TRUNC('day', n.created_at);

CREATE OR REPLACE VIEW ml_insights_summary AS
SELECT
  store_id,
  insight_type,
  insight_category,
  severity,
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_insights,
  COUNT(*) FILTER (WHERE notification_sent = true) as notifications_sent,
  COUNT(*) FILTER (WHERE is_actionable = true) as actionable_insights,
  COUNT(*) FILTER (WHERE is_resolved = true) as resolved_insights,
  AVG(confidence_score) as avg_confidence,
  AVG(priority) as avg_priority
FROM ml_insights
GROUP BY store_id, insight_type, insight_category, severity, DATE_TRUNC('day', created_at);

-- =====================================================
-- 10. Functions and Triggers
-- =====================================================

-- Function to update notification engagement score
CREATE OR REPLACE FUNCTION update_notification_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE notifications
  SET engagement_score = (
    CASE
      WHEN NEW.action_taken IS NOT NULL THEN 100
      WHEN NEW.clicked_at IS NOT NULL THEN 75
      WHEN NEW.opened_at IS NOT NULL THEN 50
      WHEN NEW.dismissed_at IS NOT NULL THEN 25
      ELSE 0
    END
  )
  WHERE id = NEW.notification_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_engagement_score
AFTER INSERT OR UPDATE ON notification_analytics
FOR EACH ROW
EXECUTE FUNCTION update_notification_engagement_score();

-- Function to reset rate limit windows
CREATE OR REPLACE FUNCTION reset_rate_limit_windows()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset hour window if older than 1 hour
  IF NEW.hour_window_start < NOW() - INTERVAL '1 hour' THEN
    NEW.count_last_hour = 0;
    NEW.hour_window_start = NOW();
  END IF;

  -- Reset day window if older than 1 day
  IF NEW.day_window_start < NOW() - INTERVAL '1 day' THEN
    NEW.count_last_day = 0;
    NEW.day_window_start = NOW();
  END IF;

  -- Reset week window if older than 1 week
  IF NEW.week_window_start < NOW() - INTERVAL '1 week' THEN
    NEW.count_last_week = 0;
    NEW.week_window_start = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reset_rate_limit_windows
BEFORE UPDATE ON notification_rate_limits
FOR EACH ROW
EXECUTE FUNCTION reset_rate_limit_windows();

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE notification_templates IS 'Dynamic templates for ML-driven notifications with multi-language support';
COMMENT ON TABLE ml_insights IS 'ML-generated insights that can trigger smart notifications';
COMMENT ON TABLE notification_analytics IS 'Comprehensive analytics and engagement tracking for notifications';
COMMENT ON TABLE notification_rate_limits IS 'Smart rate limiting to prevent notification fatigue';
COMMENT ON TABLE ml_notification_rules IS 'Rules engine for automated ML-driven notifications';
COMMENT ON TABLE email_queue IS 'Queue for email notifications with retry logic';

COMMENT ON VIEW notification_engagement_metrics IS 'Aggregated notification engagement metrics for analytics';
COMMENT ON VIEW ml_insights_summary IS 'Summary of ML insights generated and their notification status';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ ML Notifications System migración completada exitosamente!';
  RAISE NOTICE '📊 8 nuevas tablas creadas';
  RAISE NOTICE '🎨 5 templates predefinidos insertados';
  RAISE NOTICE '📈 2 views de analytics creados';
  RAISE NOTICE '⚡ Triggers configurados';
  RAISE NOTICE '🚀 Sistema listo para usar!';
END $$;
