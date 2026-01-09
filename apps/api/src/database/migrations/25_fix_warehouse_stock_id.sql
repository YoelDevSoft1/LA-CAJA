-- ============================================
-- FIX: Agregar columna id a warehouse_stock si no existe
-- ============================================
-- Esta migración corrige el problema donde warehouse_stock no tiene la columna id
-- que es requerida por la entidad TypeORM

-- Verificar y agregar columna id si no existe
DO $$
BEGIN
  -- Verificar si la columna id existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'warehouse_stock' 
      AND column_name = 'id'
  ) THEN
    -- Agregar columna id con valores por defecto
    ALTER TABLE warehouse_stock 
    ADD COLUMN id UUID DEFAULT gen_random_uuid();
    
    -- Actualizar registros existentes con IDs únicos
    UPDATE warehouse_stock 
    SET id = gen_random_uuid() 
    WHERE id IS NULL;
    
    -- Hacer la columna NOT NULL
    ALTER TABLE warehouse_stock 
    ALTER COLUMN id SET NOT NULL;
    
    -- Verificar si ya existe una PRIMARY KEY
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_constraint 
      WHERE conrelid = 'warehouse_stock'::regclass 
        AND contype = 'p'
    ) THEN
      -- Si no hay PRIMARY KEY, eliminar cualquier constraint UNIQUE en la combinación
      -- y crear PRIMARY KEY en id
      ALTER TABLE warehouse_stock 
      DROP CONSTRAINT IF EXISTS warehouse_stock_warehouse_id_product_id_variant_id_key;
      
      -- Agregar PRIMARY KEY constraint en id
      ALTER TABLE warehouse_stock 
      ADD CONSTRAINT warehouse_stock_pkey PRIMARY KEY (id);
      
      -- Restaurar el constraint UNIQUE en la combinación
      ALTER TABLE warehouse_stock 
      ADD CONSTRAINT warehouse_stock_warehouse_id_product_id_variant_id_key 
      UNIQUE (warehouse_id, product_id, variant_id);
    END IF;
    
    -- Asegurar que el default funcione para futuros inserts
    ALTER TABLE warehouse_stock 
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
    
    RAISE NOTICE 'Columna id agregada a warehouse_stock exitosamente';
  ELSE
    RAISE NOTICE 'Columna id ya existe en warehouse_stock';
  END IF;
END $$;

-- Agregar comentario si no existe
COMMENT ON COLUMN warehouse_stock.id IS 'ID único del registro de stock';
