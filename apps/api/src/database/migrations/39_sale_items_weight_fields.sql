ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS is_weight_product boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS weight_unit varchar(10) NULL,
  ADD COLUMN IF NOT EXISTS weight_value numeric(18, 3) NULL,
  ADD COLUMN IF NOT EXISTS price_per_weight_bs numeric(18, 2) NULL,
  ADD COLUMN IF NOT EXISTS price_per_weight_usd numeric(18, 2) NULL;
