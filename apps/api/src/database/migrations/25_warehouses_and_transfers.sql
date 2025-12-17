-- ============================================
-- 25. MULTI-BODEGA Y TRANSFERENCIAS
-- ============================================
-- Sistema para gestionar múltiples bodegas/almacenes y transferencias entre ellas

-- Tabla de bodegas/almacenes
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL, -- Código único: "BODEGA1", "ALMACEN_PRINCIPAL", etc.
  description TEXT NULL,
  address TEXT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, code)
);

COMMENT ON TABLE warehouses IS 'Bodegas/almacenes por tienda';
COMMENT ON COLUMN warehouses.code IS 'Código único de la bodega';
COMMENT ON COLUMN warehouses.is_default IS 'Si es la bodega por defecto';
COMMENT ON COLUMN warehouses.is_active IS 'Si la bodega está activa';

-- Tabla de stock por bodega (proyección calculada)
CREATE TABLE IF NOT EXISTS warehouse_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  stock INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0, -- Stock reservado en transferencias pendientes
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(warehouse_id, product_id, variant_id)
);

COMMENT ON TABLE warehouse_stock IS 'Stock actual por bodega (proyección calculada)';
COMMENT ON COLUMN warehouse_stock.stock IS 'Stock disponible actual';
COMMENT ON COLUMN warehouse_stock.reserved IS 'Stock reservado en transferencias pendientes';

-- Tabla de transferencias entre bodegas
CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  transfer_number VARCHAR(50) NOT NULL, -- Número único de transferencia
  from_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  to_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  requested_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  shipped_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  shipped_at TIMESTAMPTZ NULL,
  received_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ NULL,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, transfer_number)
);

COMMENT ON TABLE transfers IS 'Transferencias de inventario entre bodegas';
COMMENT ON COLUMN transfers.transfer_number IS 'Número único de transferencia (ej: TRANSF-2025-001)';
COMMENT ON COLUMN transfers.status IS 'Estado: pending (pendiente), in_transit (en tránsito), completed (completada), cancelled (cancelada)';
COMMENT ON COLUMN transfers.from_warehouse_id IS 'Bodega origen';
COMMENT ON COLUMN transfers.to_warehouse_id IS 'Bodega destino';

-- Tabla de items de transferencia
CREATE TABLE IF NOT EXISTS transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID NULL REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  quantity_shipped INTEGER NOT NULL DEFAULT 0,
  quantity_received INTEGER NOT NULL DEFAULT 0,
  unit_cost_bs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  unit_cost_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE transfer_items IS 'Items individuales de cada transferencia';
COMMENT ON COLUMN transfer_items.quantity IS 'Cantidad solicitada';
COMMENT ON COLUMN transfer_items.quantity_shipped IS 'Cantidad enviada';
COMMENT ON COLUMN transfer_items.quantity_received IS 'Cantidad recibida';

-- Agregar warehouse_id opcional a inventory_movements para compatibilidad
ALTER TABLE inventory_movements 
ADD COLUMN IF NOT EXISTS warehouse_id UUID NULL REFERENCES warehouses(id) ON DELETE SET NULL;

COMMENT ON COLUMN inventory_movements.warehouse_id IS 'Bodega asociada al movimiento (NULL = bodega por defecto)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_warehouses_store ON warehouses(store_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_active ON warehouses(store_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_warehouses_default ON warehouses(store_id, is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_warehouse_stock_warehouse ON warehouse_stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_product ON warehouse_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_variant ON warehouse_stock(variant_id) WHERE variant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transfers_store ON transfers(store_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_warehouse ON transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_warehouse ON transfers(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(store_id, status);
CREATE INDEX IF NOT EXISTS idx_transfers_number ON transfers(store_id, transfer_number);

CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer ON transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_product ON transfer_items(product_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_variant ON transfer_items(variant_id) WHERE variant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_warehouse ON inventory_movements(warehouse_id) WHERE warehouse_id IS NOT NULL;

