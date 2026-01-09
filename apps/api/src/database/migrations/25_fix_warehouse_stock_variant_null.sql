-- ============================================
-- FIX: Permitir NULL en variant_id de warehouse_stock
-- ============================================
-- Esta migración corrige el problema donde warehouse_stock.variant_id
-- tiene un constraint NOT NULL cuando debería permitir NULL
-- Maneja el caso donde variant_id está en una PRIMARY KEY compuesta

DO $$
DECLARE
  pk_constraint_name TEXT;
  pk_columns TEXT[];
  has_id_column BOOLEAN := FALSE;
  has_composite_pk BOOLEAN := FALSE;
BEGIN
  -- Verificar si existe la columna id
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'warehouse_stock' 
      AND column_name = 'id'
  ) INTO has_id_column;
  
  -- Verificar si variant_id está en una PRIMARY KEY compuesta
  SELECT 
    conname,
    array_agg(a.attname ORDER BY array_position(pk.conkey, a.attnum))::TEXT[]
  INTO pk_constraint_name, pk_columns
  FROM pg_constraint pk
  JOIN pg_attribute a ON a.attrelid = pk.conrelid AND a.attnum = ANY(pk.conkey)
  WHERE pk.conrelid = 'warehouse_stock'::regclass
    AND pk.contype = 'p'
    AND 'variant_id' = ANY(SELECT attname::TEXT FROM pg_attribute WHERE attrelid = pk.conrelid AND attnum = ANY(pk.conkey))
  GROUP BY conname;
  
  IF pk_constraint_name IS NOT NULL THEN
    has_composite_pk := TRUE;
    RAISE NOTICE 'PRIMARY KEY compuesta encontrada: % incluye variant_id', pk_constraint_name;
  END IF;
  
  -- Caso 1: La tabla tiene PRIMARY KEY compuesta con variant_id
  IF has_composite_pk THEN
    RAISE NOTICE 'Eliminando PRIMARY KEY compuesta que incluye variant_id...';
    
    -- Eliminar la PRIMARY KEY compuesta
    EXECUTE format('ALTER TABLE warehouse_stock DROP CONSTRAINT IF EXISTS %I', pk_constraint_name);
    
    -- Agregar columna id si no existe
    IF NOT has_id_column THEN
      RAISE NOTICE 'Agregando columna id...';
      ALTER TABLE warehouse_stock 
      ADD COLUMN id UUID DEFAULT gen_random_uuid();
      
      -- Actualizar registros existentes con IDs únicos
      UPDATE warehouse_stock 
      SET id = gen_random_uuid() 
      WHERE id IS NULL;
      
      -- Hacer la columna NOT NULL
      ALTER TABLE warehouse_stock 
      ALTER COLUMN id SET NOT NULL;
      
      -- Agregar PRIMARY KEY en id
      ALTER TABLE warehouse_stock 
      ADD CONSTRAINT warehouse_stock_pkey PRIMARY KEY (id);
    END IF;
    
    -- Permitir NULL en variant_id
    ALTER TABLE warehouse_stock 
    ALTER COLUMN variant_id DROP NOT NULL;
    
    -- Agregar constraint UNIQUE en la combinación (si no existe)
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_constraint 
      WHERE conrelid = 'warehouse_stock'::regclass 
        AND contype = 'u'
        AND conkey::text LIKE '%warehouse_id%'
        AND conkey::text LIKE '%product_id%'
        AND conkey::text LIKE '%variant_id%'
    ) THEN
      ALTER TABLE warehouse_stock 
      ADD CONSTRAINT warehouse_stock_warehouse_id_product_id_variant_id_key 
      UNIQUE (warehouse_id, product_id, variant_id);
    END IF;
    
    RAISE NOTICE 'PRIMARY KEY compuesta eliminada, columna id agregada como PRIMARY KEY, variant_id ahora permite NULL';
    
  -- Caso 2: La tabla solo tiene constraint NOT NULL en variant_id (no en PK)
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'warehouse_stock' 
      AND column_name = 'variant_id'
      AND is_nullable = 'NO'
  ) THEN
    RAISE NOTICE 'Eliminando constraint NOT NULL de variant_id...';
    
    -- Permitir NULL en variant_id
    ALTER TABLE warehouse_stock 
    ALTER COLUMN variant_id DROP NOT NULL;
    
    RAISE NOTICE 'Constraint NOT NULL eliminado de warehouse_stock.variant_id';
    
  ELSE
    RAISE NOTICE 'warehouse_stock.variant_id ya permite NULL, no se requiere cambio';
  END IF;
  
END $$;

-- Verificar que el constraint UNIQUE permite NULL correctamente
-- PostgreSQL permite múltiples filas con NULL en columnas UNIQUE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conrelid = 'warehouse_stock'::regclass 
      AND contype = 'u'
      AND conkey::text LIKE '%variant_id%'
  ) THEN
    RAISE NOTICE 'Constraint UNIQUE verificado: PostgreSQL maneja NULL automáticamente en variant_id';
  ELSE
    RAISE WARNING 'No se encontró constraint UNIQUE que incluya variant_id';
  END IF;
END $$;

COMMENT ON COLUMN warehouse_stock.variant_id IS 'ID de la variante del producto (NULL si el producto no tiene variantes)';
