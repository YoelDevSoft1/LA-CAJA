-- ============================================
-- 56. GESTIÓN DE RESTAURANTES: QR CODES Y EXTENSIONES DE MESAS
-- ============================================
-- Sistema para menú QR y gestión avanzada de restaurantes/bares

-- Tabla de códigos QR para mesas
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE UNIQUE,
  qr_code VARCHAR(100) NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE qr_codes IS 'Códigos QR únicos para acceso público a menú desde mesa';
COMMENT ON COLUMN qr_codes.table_id IS 'ID de la mesa asociada (único por mesa)';
COMMENT ON COLUMN qr_codes.qr_code IS 'Código QR único generado';
COMMENT ON COLUMN qr_codes.public_url IS 'URL pública para acceder al menú de la mesa';
COMMENT ON COLUMN qr_codes.is_active IS 'Si el código QR está activo';
COMMENT ON COLUMN qr_codes.expires_at IS 'Fecha de expiración (NULL si no expira)';

-- Extender tabla de mesas con campos adicionales
ALTER TABLE tables
  ADD COLUMN IF NOT EXISTS qr_code_id UUID NULL REFERENCES qr_codes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS zone VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS coordinates JSONB NULL,
  ADD COLUMN IF NOT EXISTS estimated_dining_time INTEGER NULL;

COMMENT ON COLUMN tables.qr_code_id IS 'ID del código QR asociado a la mesa';
COMMENT ON COLUMN tables.zone IS 'Zona del local (terraza, interior, barra, VIP, etc.)';
COMMENT ON COLUMN tables.coordinates IS 'Coordenadas para vista de plano (ej: {"x": 100, "y": 200})';
COMMENT ON COLUMN tables.estimated_dining_time IS 'Tiempo estimado de comida en minutos';

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_qr_codes_store ON qr_codes(store_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_table ON qr_codes(table_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_code ON qr_codes(qr_code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_active ON qr_codes(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_tables_qr_code ON tables(qr_code_id) WHERE qr_code_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tables_zone ON tables(zone) WHERE zone IS NOT NULL;
