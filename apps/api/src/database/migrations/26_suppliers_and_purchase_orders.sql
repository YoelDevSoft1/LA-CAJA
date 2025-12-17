-- ============================================
-- 26. PROVEEDORES Y ÓRDENES DE COMPRA
-- ============================================
-- Sistema para gestionar proveedores, órdenes de compra y recepción

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NULL, -- Código único opcional
  contact_name VARCHAR(100) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  address TEXT NULL,
  tax_id VARCHAR(50) NULL, -- RIF, NIT, etc.
  payment_terms TEXT NULL, -- Términos de pago
  is_active BOOLEAN NOT NULL DEFAULT true,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE suppliers IS 'Proveedores de la tienda';
COMMENT ON COLUMN suppliers.code IS 'Código único del proveedor (opcional)';
COMMENT ON COLUMN suppliers.tax_id IS 'Identificación fiscal (RIF, NIT, etc.)';
COMMENT ON COLUMN suppliers.payment_terms IS 'Términos de pago (ej: "30 días", "Contado", etc.)';

-- Tabla de órdenes de compra
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL, -- Número único: "OC-2025-0001"
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  warehouse_id UUID NULL REFERENCES warehouses(id) ON DELETE SET NULL, -- Bodega destino
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partial', 'completed', 'cancelled')),
  expected_delivery_date DATE NULL,
  requested_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ NULL,
  confirmed_at TIMESTAMPTZ NULL,
  received_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ NULL,
  total_amount_bs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_amount_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, order_number)
);

COMMENT ON TABLE purchase_orders IS 'Órdenes de compra a proveedores';
COMMENT ON COLUMN purchase_orders.order_number IS 'Número único de orden (ej: OC-2025-0001)';
COMMENT ON COLUMN purchase_orders.status IS 'Estado: draft (borrador), sent (enviada), confirmed (confirmada), partial (parcial), completed (completada), cancelled (cancelada)';
COMMENT ON COLUMN purchase_orders.warehouse_id IS 'Bodega destino para la recepción (NULL = bodega por defecto)';

-- Tabla de items de orden de compra
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID NULL REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  quantity_received INTEGER NOT NULL DEFAULT 0,
  unit_cost_bs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  unit_cost_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_cost_bs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_cost_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE purchase_order_items IS 'Items individuales de cada orden de compra';
COMMENT ON COLUMN purchase_order_items.quantity IS 'Cantidad solicitada';
COMMENT ON COLUMN purchase_order_items.quantity_received IS 'Cantidad recibida';

-- Índices
CREATE INDEX IF NOT EXISTS idx_suppliers_store ON suppliers(store_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(store_id, is_active) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(store_id, code) WHERE code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_store ON purchase_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_warehouse ON purchase_orders(warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(store_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_number ON purchase_orders(store_id, order_number);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product ON purchase_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_variant ON purchase_order_items(variant_id) WHERE variant_id IS NOT NULL;

