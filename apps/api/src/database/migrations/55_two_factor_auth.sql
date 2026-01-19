-- Migración 55: Autenticación de Dos Factores (2FA)
-- Implementa 2FA opcional con TOTP (Time-based One-Time Password)

-- Tabla para configuración de 2FA
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  secret TEXT NOT NULL, -- Secret para generar códigos TOTP
  backup_codes TEXT[], -- Códigos de respaldo (hasheados)
  is_enabled BOOLEAN DEFAULT FALSE,
  enabled_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- Índices para two_factor_auth
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_store 
ON two_factor_auth(user_id, store_id);

CREATE INDEX IF NOT EXISTS idx_two_factor_auth_enabled 
ON two_factor_auth(is_enabled) 
WHERE is_enabled = TRUE;

-- Comentarios para documentación
COMMENT ON TABLE two_factor_auth IS 'Configuración de autenticación de dos factores (2FA) con TOTP';
COMMENT ON COLUMN two_factor_auth.secret IS 'Secret para generar códigos TOTP (encriptado)';
COMMENT ON COLUMN two_factor_auth.backup_codes IS 'Códigos de respaldo hasheados para recuperación';
COMMENT ON COLUMN two_factor_auth.is_enabled IS 'Indica si 2FA está habilitado para este usuario';
