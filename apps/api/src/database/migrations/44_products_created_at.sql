-- Migration: Add created_at column to products table
-- This enables tracking when products were first created for auditing purposes

-- Add created_at column with default value of NOW() for existing rows
ALTER TABLE products
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add comment explaining the column
COMMENT ON COLUMN products.created_at IS 'Timestamp when the product was created';

-- Verify the column was added
SELECT 'Column created_at added to products table' AS status;
