-- Migración 32: Períodos Contables y Cierre de Período
-- Permite cerrar períodos contables (mensuales/anuales) y bloquear la creación de asientos

-- Tabla para Períodos Contables
CREATE TABLE IF NOT EXISTS accounting_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  period_code VARCHAR(20) NOT NULL, -- Formato: YYYY-MM o YYYY para anual
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- open, closed, locked
  closed_at TIMESTAMPTZ NULL,
  closed_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  closing_entry_id UUID NULL REFERENCES journal_entries(id) ON DELETE SET NULL,
  closing_note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, period_code)
);

CREATE INDEX idx_accounting_periods_store ON accounting_periods(store_id);
CREATE INDEX idx_accounting_periods_period ON accounting_periods(period_start, period_end);
CREATE INDEX idx_accounting_periods_status ON accounting_periods(status);
CREATE INDEX idx_accounting_periods_code ON accounting_periods(period_code);

COMMENT ON TABLE accounting_periods IS 'Períodos contables para control de cierre y bloqueo de asientos';