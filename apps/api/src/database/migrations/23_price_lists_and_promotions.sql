-- ============================================
-- 23. LISTAS DE PRECIO Y OFERTAS
-- ============================================
-- Sistema para múltiples listas de precio y ofertas con vigencia

-- Tabla de listas de precio
CREATE TABLE IF NOT EXISTS price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL, -- Código único: "LISTA1", "MAYORISTA", etc.
  description TEXT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from DATE NULL, -- Fecha de inicio de vigencia
  valid_until DATE NULL, -- Fecha de fin de vigencia
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, code)
);

COMMENT ON TABLE price_lists IS 'Listas de precio (mayorista, minorista, especial, etc.)';
COMMENT ON COLUMN price_lists.code IS 'Código único de la lista';
COMMENT ON COLUMN price_lists.is_default IS 'Si es la lista de precio por defecto';
COMMENT ON COLUMN price_lists.valid_from IS 'Fecha de inicio de vigencia (NULL = sin inicio)';
COMMENT ON COLUMN price_lists.valid_until IS 'Fecha de fin de vigencia (NULL = sin fin)';

-- Tabla de precios por lista
CREATE TABLE IF NOT EXISTS price_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  price_bs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  price_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  min_qty INTEGER NULL, -- Cantidad mínima para aplicar este precio
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(price_list_id, product_id, variant_id, min_qty)
);

COMMENT ON TABLE price_list_items IS 'Precios específicos por lista';
COMMENT ON COLUMN price_list_items.min_qty IS 'Cantidad mínima para aplicar este precio (NULL = sin mínimo)';

-- Tabla de ofertas/promociones
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NULL, -- Código de cupón (opcional)
  description TEXT NULL,
  promotion_type VARCHAR(50) NOT NULL CHECK (promotion_type IN ('percentage', 'fixed_amount', 'buy_x_get_y', 'bundle')),
  discount_percentage NUMERIC(5, 2) NULL, -- Porcentaje de descuento (0-100)
  discount_amount_bs NUMERIC(18, 2) NULL, -- Monto fijo de descuento en BS
  discount_amount_usd NUMERIC(18, 2) NULL, -- Monto fijo de descuento en USD
  min_purchase_bs NUMERIC(18, 2) NULL, -- Compra mínima en BS
  min_purchase_usd NUMERIC(18, 2) NULL, -- Compra mínima en USD
  max_discount_bs NUMERIC(18, 2) NULL, -- Descuento máximo en BS
  max_discount_usd NUMERIC(18, 2) NULL, -- Descuento máximo en USD
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_limit INTEGER NULL, -- Límite de usos totales (NULL = ilimitado)
  usage_count INTEGER NOT NULL DEFAULT 0, -- Contador de usos
  customer_limit INTEGER NULL, -- Límite de usos por cliente (NULL = ilimitado)
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE promotions IS 'Ofertas y promociones con vigencia';
COMMENT ON COLUMN promotions.promotion_type IS 'Tipo de promoción (percentage, fixed_amount, buy_x_get_y, bundle)';
COMMENT ON COLUMN promotions.usage_limit IS 'Límite total de usos (NULL = ilimitado)';
COMMENT ON COLUMN promotions.customer_limit IS 'Límite de usos por cliente (NULL = ilimitado)';

-- Tabla de productos en promociones
CREATE TABLE IF NOT EXISTS promotion_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(promotion_id, product_id, variant_id)
);

COMMENT ON TABLE promotion_products IS 'Productos incluidos en una promoción';

-- Tabla de historial de uso de promociones
CREATE TABLE IF NOT EXISTS promotion_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  sale_id UUID NULL REFERENCES sales(id) ON DELETE SET NULL,
  customer_id UUID NULL REFERENCES customers(id) ON DELETE SET NULL,
  discount_applied_bs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  discount_applied_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE promotion_usages IS 'Historial de uso de promociones';

-- Índices
CREATE INDEX IF NOT EXISTS idx_price_lists_store ON price_lists(store_id);
CREATE INDEX IF NOT EXISTS idx_price_lists_active ON price_lists(store_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_price_lists_default ON price_lists(store_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_price_lists_validity ON price_lists(store_id, valid_from, valid_until);

CREATE INDEX IF NOT EXISTS idx_price_list_items_list ON price_list_items(price_list_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_product ON price_list_items(product_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_variant ON price_list_items(variant_id) WHERE variant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_promotions_store ON promotions(store_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(store_id, is_active, valid_from, valid_until) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(store_id, code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promotions_validity ON promotions(store_id, valid_from, valid_until);

CREATE INDEX IF NOT EXISTS idx_promotion_products_promotion ON promotion_products(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_products_product ON promotion_products(product_id);

CREATE INDEX IF NOT EXISTS idx_promotion_usages_promotion ON promotion_usages(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usages_sale ON promotion_usages(sale_id) WHERE sale_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promotion_usages_customer ON promotion_usages(customer_id) WHERE customer_id IS NOT NULL;

