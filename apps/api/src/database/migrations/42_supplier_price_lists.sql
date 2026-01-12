CREATE TABLE IF NOT EXISTS supplier_price_lists (
  id uuid PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  supplier_id uuid NULL REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name text NULL,
  name varchar(150) NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'USD',
  source_date date NULL,
  is_active boolean NOT NULL DEFAULT true,
  imported_at timestamptz NOT NULL DEFAULT NOW(),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_price_lists_store
  ON supplier_price_lists(store_id);

CREATE INDEX IF NOT EXISTS idx_supplier_price_lists_supplier
  ON supplier_price_lists(store_id, supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_price_lists_active
  ON supplier_price_lists(store_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_supplier_price_lists_source_date
  ON supplier_price_lists(store_id, supplier_id, source_date);

CREATE TABLE IF NOT EXISTS supplier_price_list_items (
  id uuid PRIMARY KEY,
  list_id uuid NOT NULL REFERENCES supplier_price_lists(id) ON DELETE CASCADE,
  product_code text NOT NULL,
  product_name text NOT NULL,
  units_per_case numeric(18, 3) NULL,
  price_a numeric(18, 4) NULL,
  price_b numeric(18, 4) NULL,
  unit_price_a numeric(18, 4) NULL,
  unit_price_b numeric(18, 4) NULL,
  supplier_name text NULL,
  source_date date NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_price_list_items_list
  ON supplier_price_list_items(list_id);

CREATE INDEX IF NOT EXISTS idx_supplier_price_list_items_code
  ON supplier_price_list_items(list_id, product_code);

CREATE INDEX IF NOT EXISTS idx_supplier_price_list_items_name
  ON supplier_price_list_items(list_id, product_name);
