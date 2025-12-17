    -- Migración 28: Sistema de IA/ML básico
    -- Predicciones, Recomendaciones y Detección de Anomalías

    -- Tabla para almacenar predicciones de demanda
    CREATE TABLE IF NOT EXISTS demand_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    predicted_date DATE NOT NULL,
    predicted_quantity NUMERIC(10, 2) NOT NULL,
    confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 0, -- 0-100
    model_version VARCHAR(50) NOT NULL DEFAULT 'v1.0',
    features JSONB NULL, -- Características usadas para la predicción
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_demand_predictions_store ON demand_predictions(store_id);
    CREATE INDEX idx_demand_predictions_product ON demand_predictions(product_id);
    CREATE INDEX idx_demand_predictions_date ON demand_predictions(predicted_date);
    CREATE UNIQUE INDEX idx_demand_predictions_unique ON demand_predictions(store_id, product_id, predicted_date);

    -- Tabla para almacenar recomendaciones de productos
    CREATE TABLE IF NOT EXISTS product_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    source_product_id UUID NULL REFERENCES products(id) ON DELETE CASCADE, -- NULL = recomendaciones generales
    recommended_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL DEFAULT 'collaborative', -- collaborative, content_based, hybrid
    score NUMERIC(5, 2) NOT NULL DEFAULT 0, -- 0-100
    reason TEXT NULL, -- Razón de la recomendación
    metadata JSONB NULL, -- Metadatos adicionales
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_recommendations_store ON product_recommendations(store_id);
    CREATE INDEX idx_recommendations_source ON product_recommendations(source_product_id);
    CREATE INDEX idx_recommendations_recommended ON product_recommendations(recommended_product_id);
    CREATE INDEX idx_recommendations_type ON product_recommendations(recommendation_type);
    CREATE UNIQUE INDEX idx_recommendations_unique ON product_recommendations(store_id, source_product_id, recommended_product_id, recommendation_type);

    -- Tabla para almacenar anomalías detectadas
    CREATE TABLE IF NOT EXISTS detected_anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    anomaly_type VARCHAR(50) NOT NULL, -- sale_amount, sale_frequency, product_movement, etc.
    entity_type VARCHAR(50) NOT NULL, -- sale, product, customer, etc.
    entity_id UUID NULL, -- ID de la entidad relacionada
    severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    score NUMERIC(5, 2) NOT NULL DEFAULT 0, -- 0-100
    description TEXT NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ NULL,
    resolved_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
    resolution_note TEXT NULL,
    metadata JSONB NULL, -- Datos adicionales de la anomalía
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_anomalies_store ON detected_anomalies(store_id);
    CREATE INDEX idx_anomalies_type ON detected_anomalies(anomaly_type);
    CREATE INDEX idx_anomalies_entity ON detected_anomalies(entity_type, entity_id);
    CREATE INDEX idx_anomalies_severity ON detected_anomalies(severity);
    CREATE INDEX idx_anomalies_resolved ON detected_anomalies(resolved_at);
    CREATE INDEX idx_anomalies_detected ON detected_anomalies(detected_at DESC);

    -- Tabla para almacenar métricas de modelos ML
    CREATE TABLE IF NOT EXISTS ml_model_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    model_type VARCHAR(50) NOT NULL, -- demand_prediction, recommendation, anomaly_detection
    model_version VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC(18, 6) NOT NULL,
    evaluation_date DATE NOT NULL,
    metadata JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_ml_metrics_store ON ml_model_metrics(store_id);
    CREATE INDEX idx_ml_metrics_model ON ml_model_metrics(model_type, model_version);
    CREATE INDEX idx_ml_metrics_date ON ml_model_metrics(evaluation_date);

    COMMENT ON TABLE demand_predictions IS 'Predicciones de demanda de productos usando modelos ML';
    COMMENT ON TABLE product_recommendations IS 'Recomendaciones de productos basadas en ML';
    COMMENT ON TABLE detected_anomalies IS 'Anomalías detectadas en ventas, inventario, etc.';
    COMMENT ON TABLE ml_model_metrics IS 'Métricas de evaluación de modelos ML';

