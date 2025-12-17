-- ============================================
-- 24. TASAS DE CAMBIO BCV CON FALLBACK MANUAL
-- ============================================
-- Sistema para almacenar tasas de cambio manuales como fallback

-- Tabla de tasas de cambio manuales
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  rate NUMERIC(18, 6) NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('api', 'manual')),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMPTZ NULL, -- NULL = vigente indefinidamente
  is_active BOOLEAN NOT NULL DEFAULT true,
  note TEXT NULL,
  created_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE exchange_rates IS 'Tasas de cambio BCV (automáticas o manuales)';
COMMENT ON COLUMN exchange_rates.rate IS 'Tasa de cambio (Bs por USD)';
COMMENT ON COLUMN exchange_rates.source IS 'Origen de la tasa: api (automática) o manual';
COMMENT ON COLUMN exchange_rates.effective_from IS 'Fecha desde la cual es efectiva';
COMMENT ON COLUMN exchange_rates.effective_until IS 'Fecha hasta la cual es efectiva (NULL = indefinida)';
COMMENT ON COLUMN exchange_rates.is_active IS 'Si la tasa está activa';

-- Índices
CREATE INDEX IF NOT EXISTS idx_exchange_rates_store ON exchange_rates(store_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_active ON exchange_rates(store_id, is_active, effective_from, effective_until) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_exchange_rates_effective ON exchange_rates(store_id, effective_from DESC) WHERE is_active = true;

