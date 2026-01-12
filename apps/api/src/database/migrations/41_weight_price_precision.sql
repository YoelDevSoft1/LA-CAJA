-- La vista materializada mv_top_products_30d depende de sale_items.unit_price_*,
-- por eso se elimina temporalmente antes de alterar columnas.
DROP MATERIALIZED VIEW IF EXISTS mv_top_products_30d;

ALTER TABLE products
  ALTER COLUMN price_per_weight_bs TYPE numeric(18, 4)
    USING price_per_weight_bs::numeric,
  ALTER COLUMN price_per_weight_usd TYPE numeric(18, 4)
    USING price_per_weight_usd::numeric;

ALTER TABLE sale_items
  ALTER COLUMN unit_price_bs TYPE numeric(18, 4)
    USING unit_price_bs::numeric,
  ALTER COLUMN unit_price_usd TYPE numeric(18, 4)
    USING unit_price_usd::numeric,
  ALTER COLUMN price_per_weight_bs TYPE numeric(18, 4)
    USING price_per_weight_bs::numeric,
  ALTER COLUMN price_per_weight_usd TYPE numeric(18, 4)
    USING price_per_weight_usd::numeric;

ALTER TABLE fiscal_invoice_items
  ALTER COLUMN unit_price_bs TYPE numeric(18, 4)
    USING unit_price_bs::numeric,
  ALTER COLUMN unit_price_usd TYPE numeric(18, 4)
    USING unit_price_usd::numeric;

-- Re-crear vista materializada de productos más vendidos (últimos 30 días)
CREATE MATERIALIZED VIEW mv_top_products_30d AS
SELECT 
  si.product_id,
  p.name as product_name,
  p.category,
  s.store_id,
  SUM(si.qty) as total_qty_sold,
  SUM(si.unit_price_bs * si.qty) as revenue_bs,
  SUM(si.unit_price_usd * si.qty) as revenue_usd,
  COUNT(DISTINCT si.sale_id) as times_sold,
  AVG(si.unit_price_bs) as avg_price_bs,
  AVG(si.unit_price_usd) as avg_price_usd
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
JOIN products p ON si.product_id = p.id
WHERE s.sold_at >= NOW() - INTERVAL '30 days'
GROUP BY si.product_id, p.name, p.category, s.store_id;

CREATE INDEX IF NOT EXISTS idx_mv_top_products_store_qty 
  ON mv_top_products_30d(store_id, total_qty_sold DESC);

CREATE INDEX IF NOT EXISTS idx_mv_top_products_store_revenue 
  ON mv_top_products_30d(store_id, revenue_bs DESC);

CREATE INDEX IF NOT EXISTS idx_mv_top_products_category 
  ON mv_top_products_30d(store_id, category, total_qty_sold DESC);

COMMENT ON MATERIALIZED VIEW mv_top_products_30d IS 'Top productos vendidos en los últimos 30 días';
