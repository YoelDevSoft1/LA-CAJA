-- ============================================
-- 15. DESCUENTOS Y AUTORIZACIONES
-- ============================================
-- Tablas para configuración de descuentos y registro de autorizaciones

-- Configuración de descuentos por tienda
CREATE TABLE IF NOT EXISTS discount_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  max_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_amount_bs NUMERIC(18,2) NULL,
  max_amount_usd NUMERIC(18,2) NULL,
  requires_authorization BOOLEAN NOT NULL DEFAULT true,
  authorization_role VARCHAR(20) NULL, -- 'owner', 'admin', 'supervisor'
  auto_approve_below_percentage NUMERIC(5,2) NULL, -- Auto-aprobar si es menor a este %
  auto_approve_below_amount_bs NUMERIC(18,2) NULL, -- Auto-aprobar si es menor a este monto
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id)
);

COMMENT ON TABLE discount_configs IS 'Configuración de descuentos por tienda';
COMMENT ON COLUMN discount_configs.store_id IS 'ID de la tienda';
COMMENT ON COLUMN discount_configs.max_percentage IS 'Porcentaje máximo de descuento permitido (0 = sin límite)';
COMMENT ON COLUMN discount_configs.max_amount_bs IS 'Monto máximo de descuento en Bs (NULL = sin límite)';
COMMENT ON COLUMN discount_configs.max_amount_usd IS 'Monto máximo de descuento en USD (NULL = sin límite)';
COMMENT ON COLUMN discount_configs.requires_authorization IS 'Si requiere autorización para aplicar descuentos';
COMMENT ON COLUMN discount_configs.authorization_role IS 'Rol mínimo requerido para autorizar (owner, admin, supervisor)';
COMMENT ON COLUMN discount_configs.auto_approve_below_percentage IS 'Auto-aprobar descuentos menores a este porcentaje';
COMMENT ON COLUMN discount_configs.auto_approve_below_amount_bs IS 'Auto-aprobar descuentos menores a este monto en Bs';

-- Historial de descuentos autorizados
CREATE TABLE IF NOT EXISTS discount_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  discount_amount_bs NUMERIC(18,2) NOT NULL,
  discount_amount_usd NUMERIC(18,2) NOT NULL,
  discount_percentage NUMERIC(5,2) NOT NULL,
  authorized_by UUID NOT NULL REFERENCES profiles(id),
  authorization_pin_hash TEXT NULL, -- Hash del PIN usado (si aplica)
  reason TEXT NULL,
  authorized_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE discount_authorizations IS 'Historial de descuentos autorizados';
COMMENT ON COLUMN discount_authorizations.sale_id IS 'ID de la venta con descuento';
COMMENT ON COLUMN discount_authorizations.store_id IS 'ID de la tienda';
COMMENT ON COLUMN discount_authorizations.discount_amount_bs IS 'Monto del descuento en Bs';
COMMENT ON COLUMN discount_authorizations.discount_amount_usd IS 'Monto del descuento en USD';
COMMENT ON COLUMN discount_authorizations.discount_percentage IS 'Porcentaje de descuento aplicado';
COMMENT ON COLUMN discount_authorizations.authorized_by IS 'ID del usuario que autorizó';
COMMENT ON COLUMN discount_authorizations.authorization_pin_hash IS 'Hash del PIN usado para autorizar (si aplica)';
COMMENT ON COLUMN discount_authorizations.reason IS 'Razón del descuento';

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_discount_configs_store ON discount_configs(store_id);
CREATE INDEX IF NOT EXISTS idx_discount_auth_sale ON discount_authorizations(sale_id);
CREATE INDEX IF NOT EXISTS idx_discount_auth_store ON discount_authorizations(store_id);
CREATE INDEX IF NOT EXISTS idx_discount_auth_authorized_by ON discount_authorizations(authorized_by);
CREATE INDEX IF NOT EXISTS idx_discount_auth_authorized_at ON discount_authorizations(authorized_at DESC);

