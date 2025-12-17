-- Migración 29: Analytics en Tiempo Real
-- Sistema de métricas en tiempo real, alertas automáticas y umbrales

-- Tabla para almacenar métricas en tiempo real
CREATE TABLE IF NOT EXISTS real_time_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL, -- sales, inventory, revenue, profit, etc.
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC(18, 6) NOT NULL,
  previous_value NUMERIC(18, 6) NULL,
  change_percentage NUMERIC(5, 2) NULL,
  period_type VARCHAR(20) NOT NULL DEFAULT 'current', -- current, hour, day, week, month
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_realtime_metrics_store ON real_time_metrics(store_id);
CREATE INDEX idx_realtime_metrics_type ON real_time_metrics(metric_type);
CREATE INDEX idx_realtime_metrics_period ON real_time_metrics(period_start, period_end);
CREATE INDEX idx_realtime_metrics_created ON real_time_metrics(created_at DESC);

-- Tabla para configurar umbrales de alertas
CREATE TABLE IF NOT EXISTS alert_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- stock_low, sale_anomaly, revenue_drop, etc.
  metric_name VARCHAR(100) NOT NULL,
  threshold_value NUMERIC(18, 6) NOT NULL,
  comparison_operator VARCHAR(10) NOT NULL DEFAULT 'less_than', -- less_than, greater_than, equals, not_equals
  severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  is_active BOOLEAN NOT NULL DEFAULT true,
  notification_channels JSONB NULL, -- ['email', 'push', 'in_app']
  created_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alert_thresholds_store ON alert_thresholds(store_id);
CREATE INDEX idx_alert_thresholds_type ON alert_thresholds(alert_type);
CREATE INDEX idx_alert_thresholds_active ON alert_thresholds(store_id, is_active) WHERE is_active = true;

-- Tabla para almacenar alertas generadas
CREATE TABLE IF NOT EXISTS real_time_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  threshold_id UUID NULL REFERENCES alert_thresholds(id) ON DELETE SET NULL,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  current_value NUMERIC(18, 6) NOT NULL,
  threshold_value NUMERIC(18, 6) NOT NULL,
  entity_type VARCHAR(50) NULL, -- sale, product, inventory, etc.
  entity_id UUID NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ NULL,
  read_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_realtime_alerts_store ON real_time_alerts(store_id);
CREATE INDEX idx_realtime_alerts_type ON real_time_alerts(alert_type);
CREATE INDEX idx_realtime_alerts_severity ON real_time_alerts(severity);
CREATE INDEX idx_realtime_alerts_read ON real_time_alerts(is_read, created_at DESC);
CREATE INDEX idx_realtime_alerts_created ON real_time_alerts(created_at DESC);

-- Tabla para heatmaps de ventas (agregaciones por hora/día)
CREATE TABLE IF NOT EXISTS sales_heatmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  sales_count INTEGER NOT NULL DEFAULT 0,
  total_amount_bs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_amount_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  avg_ticket_bs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  avg_ticket_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_heatmap_store ON sales_heatmap(store_id);
CREATE INDEX idx_sales_heatmap_date ON sales_heatmap(date);
CREATE INDEX idx_sales_heatmap_hour ON sales_heatmap(hour);
CREATE INDEX idx_sales_heatmap_day ON sales_heatmap(day_of_week);
CREATE UNIQUE INDEX idx_sales_heatmap_unique ON sales_heatmap(store_id, date, hour);

-- Tabla para métricas comparativas (período vs período anterior)
CREATE TABLE IF NOT EXISTS comparative_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  previous_period_start DATE NOT NULL,
  previous_period_end DATE NOT NULL,
  current_value NUMERIC(18, 6) NOT NULL,
  previous_value NUMERIC(18, 6) NOT NULL,
  change_amount NUMERIC(18, 6) NOT NULL,
  change_percentage NUMERIC(5, 2) NOT NULL,
  trend VARCHAR(20) NOT NULL, -- increasing, decreasing, stable
  metadata JSONB NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comparative_metrics_store ON comparative_metrics(store_id);
CREATE INDEX idx_comparative_metrics_type ON comparative_metrics(metric_type);
CREATE INDEX idx_comparative_metrics_period ON comparative_metrics(current_period_start, current_period_end);

COMMENT ON TABLE real_time_metrics IS 'Métricas calculadas en tiempo real para analytics';
COMMENT ON TABLE alert_thresholds IS 'Umbrales configurados para generar alertas automáticas';
COMMENT ON TABLE real_time_alerts IS 'Alertas generadas automáticamente cuando se superan umbrales';
COMMENT ON TABLE sales_heatmap IS 'Agregaciones de ventas por hora y día para visualización de heatmaps';
COMMENT ON TABLE comparative_metrics IS 'Métricas comparativas entre períodos para análisis de tendencias';

