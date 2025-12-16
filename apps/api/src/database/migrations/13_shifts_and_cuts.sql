-- ============================================
-- 13. TURNOS Y CORTES (Shifts and Cuts)
-- ============================================
-- Tablas para gestión de turnos de cajeros con cortes X y Z

-- Tabla de turnos
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  cashier_id UUID NOT NULL REFERENCES profiles(id),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ NULL,
  opening_amount_bs NUMERIC(18,2) NOT NULL DEFAULT 0,
  opening_amount_usd NUMERIC(18,2) NOT NULL DEFAULT 0,
  closing_amount_bs NUMERIC(18,2) NULL,
  closing_amount_usd NUMERIC(18,2) NULL,
  expected_totals JSONB NULL,
  counted_totals JSONB NULL,
  difference_bs NUMERIC(18,2) NULL,
  difference_usd NUMERIC(18,2) NULL,
  note TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE shifts IS 'Turnos de cajeros con apertura, cierre y arqueo';
COMMENT ON COLUMN shifts.store_id IS 'ID de la tienda';
COMMENT ON COLUMN shifts.cashier_id IS 'ID del cajero que abrió el turno';
COMMENT ON COLUMN shifts.opened_at IS 'Fecha y hora de apertura del turno';
COMMENT ON COLUMN shifts.closed_at IS 'Fecha y hora de cierre del turno (null si está abierto)';
COMMENT ON COLUMN shifts.opening_amount_bs IS 'Monto inicial en Bs';
COMMENT ON COLUMN shifts.opening_amount_usd IS 'Monto inicial en USD';
COMMENT ON COLUMN shifts.expected_totals IS 'Totales esperados calculados (JSONB)';
COMMENT ON COLUMN shifts.counted_totals IS 'Totales contados físicamente (JSONB)';
COMMENT ON COLUMN shifts.difference_bs IS 'Diferencia en Bs (contado - esperado)';
COMMENT ON COLUMN shifts.difference_usd IS 'Diferencia en USD (contado - esperado)';
COMMENT ON COLUMN shifts.status IS 'Estado del turno: open, closed, cancelled';

-- Tabla de cortes (X y Z)
CREATE TABLE IF NOT EXISTS shift_cuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  cut_type VARCHAR(1) NOT NULL CHECK (cut_type IN ('X', 'Z')),
  cut_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  totals JSONB NOT NULL,
  sales_count INTEGER NOT NULL DEFAULT 0,
  printed_at TIMESTAMPTZ NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE shift_cuts IS 'Cortes X (intermedios) y Z (finales) de turnos';
COMMENT ON COLUMN shift_cuts.shift_id IS 'ID del turno al que pertenece el corte';
COMMENT ON COLUMN shift_cuts.cut_type IS 'Tipo de corte: X (intermedio) o Z (final)';
COMMENT ON COLUMN shift_cuts.cut_at IS 'Fecha y hora del corte';
COMMENT ON COLUMN shift_cuts.totals IS 'Totales del corte (JSONB con ventas, métodos de pago, etc.)';
COMMENT ON COLUMN shift_cuts.sales_count IS 'Cantidad de ventas hasta el momento del corte';
COMMENT ON COLUMN shift_cuts.printed_at IS 'Fecha y hora de última impresión del ticket';

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_shifts_store_opened ON shifts(store_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_shifts_cashier ON shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_shift_cuts_shift ON shift_cuts(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_cuts_type ON shift_cuts(cut_type);
CREATE INDEX IF NOT EXISTS idx_shift_cuts_created ON shift_cuts(created_at DESC);

