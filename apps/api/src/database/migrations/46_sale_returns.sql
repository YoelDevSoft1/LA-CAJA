-- Migration: devoluciones parciales de ventas

CREATE TABLE IF NOT EXISTS sale_returns (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  created_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT NULL,
  total_bs NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_usd NUMERIC(18,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sale_returns_sale_id ON sale_returns(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_returns_store_id ON sale_returns(store_id);

CREATE TABLE IF NOT EXISTS sale_return_items (
  id UUID PRIMARY KEY,
  return_id UUID NOT NULL REFERENCES sale_returns(id) ON DELETE CASCADE,
  sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NULL REFERENCES product_variants(id) ON DELETE SET NULL,
  lot_id UUID NULL REFERENCES product_lots(id) ON DELETE SET NULL,
  qty NUMERIC(18,3) NOT NULL,
  unit_price_bs NUMERIC(18,4) NOT NULL DEFAULT 0,
  unit_price_usd NUMERIC(18,4) NOT NULL DEFAULT 0,
  discount_bs NUMERIC(18,2) NOT NULL DEFAULT 0,
  discount_usd NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_bs NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_usd NUMERIC(18,2) NOT NULL DEFAULT 0,
  serial_ids JSONB NULL,
  note TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_sale_return_items_return_id ON sale_return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_sale_return_items_sale_item_id ON sale_return_items(sale_item_id);
