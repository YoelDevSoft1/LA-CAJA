-- ============================================
-- 47. NUMERO SECUENCIAL DE VENTA
-- ============================================
-- Genera consecutivo por tienda para ventas

CREATE TABLE IF NOT EXISTS sale_sequences (
  store_id UUID PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
  current_number BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS sale_number BIGINT NULL;

COMMENT ON TABLE sale_sequences IS 'Consecutivo de ventas por tienda';
COMMENT ON COLUMN sales.sale_number IS 'Numero secuencial de venta por tienda';

-- Backfill sale_number para ventas existentes (si aplica)
WITH max_numbers AS (
  SELECT store_id, COALESCE(MAX(sale_number), 0) AS max_number
  FROM sales
  GROUP BY store_id
),
ranked AS (
  SELECT s.id,
         s.store_id,
         ROW_NUMBER() OVER (PARTITION BY s.store_id ORDER BY s.sold_at ASC, s.id ASC) + m.max_number AS sale_number
  FROM sales s
  JOIN max_numbers m ON m.store_id = s.store_id
  WHERE s.sale_number IS NULL
)
UPDATE sales
SET sale_number = ranked.sale_number
FROM ranked
WHERE sales.id = ranked.id;

-- Inicializar secuencia por tienda con el maximo sale_number existente
INSERT INTO sale_sequences (store_id, current_number, created_at, updated_at)
SELECT store_id,
       COALESCE(MAX(sale_number), 0) AS current_number,
       NOW(),
       NOW()
FROM sales
GROUP BY store_id
ON CONFLICT (store_id)
DO UPDATE SET current_number = EXCLUDED.current_number,
              updated_at = NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_store_sale_number
  ON sales(store_id, sale_number)
  WHERE sale_number IS NOT NULL;
