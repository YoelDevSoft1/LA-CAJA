-- ============================================
-- 16. MODO CAJA RÁPIDA
-- ============================================
-- Tablas para configuración de caja rápida y productos rápidos

-- Configuración de caja rápida por tienda
CREATE TABLE IF NOT EXISTS fast_checkout_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  max_items INTEGER NOT NULL DEFAULT 10,
  enabled BOOLEAN NOT NULL DEFAULT true,
  allow_discounts BOOLEAN NOT NULL DEFAULT false,
  allow_customer_selection BOOLEAN NOT NULL DEFAULT false,
  default_payment_method VARCHAR(20) NULL, -- 'CASH_BS', 'CASH_USD', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id)
);

COMMENT ON TABLE fast_checkout_configs IS 'Configuración de modo caja rápida por tienda';
COMMENT ON COLUMN fast_checkout_configs.store_id IS 'ID de la tienda';
COMMENT ON COLUMN fast_checkout_configs.max_items IS 'Número máximo de items permitidos en modo rápido';
COMMENT ON COLUMN fast_checkout_configs.enabled IS 'Si el modo caja rápida está habilitado';
COMMENT ON COLUMN fast_checkout_configs.allow_discounts IS 'Si se permiten descuentos en modo rápido';
COMMENT ON COLUMN fast_checkout_configs.allow_customer_selection IS 'Si se permite seleccionar cliente en modo rápido';
COMMENT ON COLUMN fast_checkout_configs.default_payment_method IS 'Método de pago por defecto en modo rápido';

-- Productos rápidos (hasta 50 productos con teclas rápidas)
CREATE TABLE IF NOT EXISTS quick_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quick_key VARCHAR(10) NOT NULL, -- Tecla rápida (ej: '1', 'F1', 'A')
  position INTEGER NOT NULL DEFAULT 0, -- Posición en la grilla
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, quick_key),
  UNIQUE(store_id, product_id)
);

COMMENT ON TABLE quick_products IS 'Productos configurados para modo caja rápida con teclas rápidas';
COMMENT ON COLUMN quick_products.store_id IS 'ID de la tienda';
COMMENT ON COLUMN quick_products.product_id IS 'ID del producto';
COMMENT ON COLUMN quick_products.quick_key IS 'Tecla rápida asignada (ej: "1", "F1", "A")';
COMMENT ON COLUMN quick_products.position IS 'Posición en la grilla de productos rápidos';
COMMENT ON COLUMN quick_products.is_active IS 'Si el producto rápido está activo';

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_fast_checkout_configs_store ON fast_checkout_configs(store_id);
CREATE INDEX IF NOT EXISTS idx_quick_products_store ON quick_products(store_id);
CREATE INDEX IF NOT EXISTS idx_quick_products_product ON quick_products(product_id);
CREATE INDEX IF NOT EXISTS idx_quick_products_key ON quick_products(store_id, quick_key);
CREATE INDEX IF NOT EXISTS idx_quick_products_active ON quick_products(store_id, is_active) WHERE is_active = true;

