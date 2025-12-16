-- Añadir control de aprobación a movimientos de inventario
ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS requested_by uuid NULL,
ADD COLUMN IF NOT EXISTS approved_by uuid NULL,
ADD COLUMN IF NOT EXISTS approved_at timestamptz NULL;

-- Marcar existentes como aprobados
UPDATE inventory_movements SET approved = true WHERE approved IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_approved ON inventory_movements(approved);
