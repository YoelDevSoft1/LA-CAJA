-- ============================================
-- 22. PERIFÉRICOS Y PRODUCTOS CON PESO
-- ============================================
-- Sistema para configuración de periféricos y soporte para productos peso-precio

-- Tabla de configuración de periféricos
CREATE TABLE IF NOT EXISTS peripheral_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  peripheral_type VARCHAR(50) NOT NULL CHECK (peripheral_type IN ('scanner', 'printer', 'drawer', 'scale', 'customer_display')),
  name VARCHAR(100) NOT NULL, -- Nombre descriptivo: "Impresora Principal", "Scanner 1", etc.
  connection_type VARCHAR(50) NOT NULL CHECK (connection_type IN ('serial', 'usb', 'network', 'bluetooth', 'web_serial')),
  connection_config JSONB NOT NULL, -- Configuración específica del periférico
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false, -- Si es el periférico por defecto de su tipo
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE peripheral_configs IS 'Configuración de periféricos (scanner, impresora, gaveta, balanza, visor)';
COMMENT ON COLUMN peripheral_configs.peripheral_type IS 'Tipo de periférico (scanner, printer, drawer, scale, customer_display)';
COMMENT ON COLUMN peripheral_configs.connection_type IS 'Tipo de conexión (serial, usb, network, bluetooth, web_serial)';
COMMENT ON COLUMN peripheral_configs.connection_config IS 'Configuración JSON específica del periférico (puerto, baudrate, IP, etc.)';
COMMENT ON COLUMN peripheral_configs.is_default IS 'Si es el periférico por defecto de su tipo';

-- Índices
CREATE INDEX IF NOT EXISTS idx_peripheral_configs_store ON peripheral_configs(store_id);
CREATE INDEX IF NOT EXISTS idx_peripheral_configs_type ON peripheral_configs(store_id, peripheral_type, is_active);
CREATE INDEX IF NOT EXISTS idx_peripheral_configs_default ON peripheral_configs(store_id, peripheral_type, is_default) WHERE is_default = true;

-- Agregar campos a products para soporte de peso
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS is_weight_product BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS weight_unit VARCHAR(10) NULL CHECK (weight_unit IN ('kg', 'g', 'lb', 'oz')),
  ADD COLUMN IF NOT EXISTS price_per_weight_bs NUMERIC(18, 2) NULL, -- Precio por unidad de peso
  ADD COLUMN IF NOT EXISTS price_per_weight_usd NUMERIC(18, 2) NULL,
  ADD COLUMN IF NOT EXISTS min_weight NUMERIC(10, 3) NULL, -- Peso mínimo
  ADD COLUMN IF NOT EXISTS max_weight NUMERIC(10, 3) NULL, -- Peso máximo
  ADD COLUMN IF NOT EXISTS scale_plu VARCHAR(50) NULL, -- PLU para balanza
  ADD COLUMN IF NOT EXISTS scale_department INTEGER NULL; -- Departamento para balanza

COMMENT ON COLUMN products.is_weight_product IS 'Si el producto se vende por peso';
COMMENT ON COLUMN products.weight_unit IS 'Unidad de peso (kg, g, lb, oz)';
COMMENT ON COLUMN products.price_per_weight_bs IS 'Precio por unidad de peso en BS';
COMMENT ON COLUMN products.price_per_weight_usd IS 'Precio por unidad de peso en USD';
COMMENT ON COLUMN products.scale_plu IS 'Código PLU para balanza';
COMMENT ON COLUMN products.scale_department IS 'Departamento para balanza';

-- Índices para productos con peso
CREATE INDEX IF NOT EXISTS idx_products_weight ON products(store_id, is_weight_product) WHERE is_weight_product = true;
CREATE INDEX IF NOT EXISTS idx_products_scale_plu ON products(store_id, scale_plu) WHERE scale_plu IS NOT NULL;

