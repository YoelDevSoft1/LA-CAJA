-- ============================================
-- 48. ORDEN Y COMISIONES DE METODOS DE PAGO
-- ============================================

ALTER TABLE payment_method_configs
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN payment_method_configs.sort_order IS 'Orden de visualizacion del metodo';
COMMENT ON COLUMN payment_method_configs.commission_percentage IS 'Comision porcentual aplicada al metodo';

-- Asignar orden por defecto a configuraciones existentes
UPDATE payment_method_configs
SET sort_order = CASE method
  WHEN 'CASH_USD' THEN 10
  WHEN 'CASH_BS' THEN 20
  WHEN 'PAGO_MOVIL' THEN 30
  WHEN 'TRANSFER' THEN 40
  WHEN 'OTHER' THEN 50
  ELSE 90
END
WHERE sort_order = 0;

CREATE INDEX IF NOT EXISTS idx_payment_configs_sort_order ON payment_method_configs(store_id, sort_order);
