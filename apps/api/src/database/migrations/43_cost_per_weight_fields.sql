-- Migration: Add cost_per_weight fields to products
-- This allows storing the cost per weight unit (e.g., cost per gram) separately from the base cost

-- Add cost_per_weight_bs column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS cost_per_weight_bs NUMERIC(18, 6) DEFAULT NULL;

-- Add cost_per_weight_usd column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS cost_per_weight_usd NUMERIC(18, 6) DEFAULT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN products.cost_per_weight_bs IS 'Cost per weight unit in Bolivares (e.g., cost per gram if weight_unit is g)';
COMMENT ON COLUMN products.cost_per_weight_usd IS 'Cost per weight unit in USD (e.g., cost per gram if weight_unit is g)';

-- Update existing weight products to calculate cost_per_weight from base cost
-- Assuming cost_usd is per kg, calculate cost per gram for products with weight_unit = 'g'
UPDATE products
SET
  cost_per_weight_usd = CASE
    WHEN weight_unit = 'g' THEN cost_usd / 1000  -- Convert from per-kg cost to per-gram cost
    WHEN weight_unit = 'kg' THEN cost_usd
    WHEN weight_unit = 'lb' THEN cost_usd / 2.20462  -- Convert from per-kg to per-lb
    WHEN weight_unit = 'oz' THEN cost_usd / 35.274   -- Convert from per-kg to per-oz
    ELSE cost_usd
  END,
  cost_per_weight_bs = CASE
    WHEN weight_unit = 'g' THEN cost_bs / 1000
    WHEN weight_unit = 'kg' THEN cost_bs
    WHEN weight_unit = 'lb' THEN cost_bs / 2.20462
    WHEN weight_unit = 'oz' THEN cost_bs / 35.274
    ELSE cost_bs
  END
WHERE is_weight_product = true
  AND cost_per_weight_usd IS NULL
  AND cost_usd > 0;
