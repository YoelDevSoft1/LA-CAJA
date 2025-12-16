-- ============================================
-- 14. CONFIGURACIÓN DE MÉTODOS DE PAGO Y BITÁCORA DE EFECTIVO
-- ============================================
-- Tablas para configurar topes de métodos de pago y registrar movimientos de efectivo

-- Configuración de métodos de pago por tienda
CREATE TABLE IF NOT EXISTS payment_method_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  method VARCHAR(20) NOT NULL,
  min_amount_bs NUMERIC(18,2) NULL,
  min_amount_usd NUMERIC(18,2) NULL,
  max_amount_bs NUMERIC(18,2) NULL,
  max_amount_usd NUMERIC(18,2) NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  requires_authorization BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, method)
);

COMMENT ON TABLE payment_method_configs IS 'Configuración de métodos de pago con topes y restricciones por tienda';
COMMENT ON COLUMN payment_method_configs.store_id IS 'ID de la tienda';
COMMENT ON COLUMN payment_method_configs.method IS 'Método de pago (CASH_BS, CASH_USD, PAGO_MOVIL, TRANSFER, OTHER)';
COMMENT ON COLUMN payment_method_configs.min_amount_bs IS 'Monto mínimo permitido en Bs (NULL = sin límite)';
COMMENT ON COLUMN payment_method_configs.min_amount_usd IS 'Monto mínimo permitido en USD (NULL = sin límite)';
COMMENT ON COLUMN payment_method_configs.max_amount_bs IS 'Monto máximo permitido en Bs (NULL = sin límite)';
COMMENT ON COLUMN payment_method_configs.max_amount_usd IS 'Monto máximo permitido en USD (NULL = sin límite)';
COMMENT ON COLUMN payment_method_configs.enabled IS 'Si el método está habilitado';
COMMENT ON COLUMN payment_method_configs.requires_authorization IS 'Si requiere autorización para usar este método';

-- Bitácora de entradas/salidas de efectivo
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  shift_id UUID NULL REFERENCES shifts(id) ON DELETE SET NULL,
  cash_session_id UUID NULL REFERENCES cash_sessions(id) ON DELETE SET NULL,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('entry', 'exit')),
  amount_bs NUMERIC(18,2) NOT NULL,
  amount_usd NUMERIC(18,2) NOT NULL,
  reason VARCHAR(100) NOT NULL,
  note TEXT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cash_movements IS 'Bitácora de entradas y salidas de efectivo de la caja';
COMMENT ON COLUMN cash_movements.store_id IS 'ID de la tienda';
COMMENT ON COLUMN cash_movements.shift_id IS 'ID del turno (opcional, para relacionar con turnos)';
COMMENT ON COLUMN cash_movements.cash_session_id IS 'ID de la sesión de caja (opcional)';
COMMENT ON COLUMN cash_movements.movement_type IS 'Tipo de movimiento: entry (entrada) o exit (salida)';
COMMENT ON COLUMN cash_movements.amount_bs IS 'Monto en Bs';
COMMENT ON COLUMN cash_movements.amount_usd IS 'Monto en USD';
COMMENT ON COLUMN cash_movements.reason IS 'Razón del movimiento (ej: "Retiro para compra", "Entrada de cambio")';
COMMENT ON COLUMN cash_movements.created_by IS 'ID del usuario que registró el movimiento';

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_payment_configs_store ON payment_method_configs(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_configs_method ON payment_method_configs(method);
CREATE INDEX IF NOT EXISTS idx_cash_movements_store ON cash_movements(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_movements_shift ON cash_movements(shift_id) WHERE shift_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON cash_movements(cash_session_id) WHERE cash_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cash_movements_type ON cash_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_cash_movements_created_by ON cash_movements(created_by);

