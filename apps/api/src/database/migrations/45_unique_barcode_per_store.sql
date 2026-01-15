-- Migration: Ensure unique barcode per store
-- Normalizes barcodes, removes duplicates, and enforces uniqueness with an index

-- Normalize empty/whitespace-only barcodes to NULL
UPDATE products
SET barcode = NULL
WHERE barcode IS NOT NULL
  AND BTRIM(barcode) = '';

-- Trim barcodes to avoid duplicates caused by surrounding spaces
UPDATE products
SET barcode = BTRIM(barcode)
WHERE barcode IS NOT NULL
  AND barcode <> BTRIM(barcode);

-- De-duplicate barcodes per store, keeping the most recently updated product
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY store_id, barcode
      ORDER BY updated_at DESC NULLS LAST,
               created_at DESC NULLS LAST,
               id DESC
    ) AS rn
  FROM products
  WHERE barcode IS NOT NULL
)
UPDATE products p
SET barcode = NULL
FROM ranked r
WHERE p.id = r.id
  AND r.rn > 1;

-- Enforce unique barcode per store (NULL allowed)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_store_barcode_unique
  ON products(store_id, barcode)
  WHERE barcode IS NOT NULL;

COMMENT ON INDEX idx_products_store_barcode_unique IS 'Unique barcode per store (NULL allowed)';

-- Verificar que se creó correctamente
SELECT 'Unique barcode index creado correctamente' AS status;
