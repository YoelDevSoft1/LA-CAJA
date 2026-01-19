-- Migración 52: Tokens de recuperación de PIN
-- Implementa sistema de recuperación de PIN olvidado

-- Tabla para tokens de recuperación de PIN
CREATE TABLE IF NOT EXISTS pin_recovery_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para pin_recovery_tokens
CREATE INDEX IF NOT EXISTS idx_pin_recovery_tokens_user_id 
ON pin_recovery_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_pin_recovery_tokens_store_id 
ON pin_recovery_tokens(store_id);

CREATE INDEX IF NOT EXISTS idx_pin_recovery_tokens_token 
ON pin_recovery_tokens(token);

CREATE INDEX IF NOT EXISTS idx_pin_recovery_tokens_expires_at 
ON pin_recovery_tokens(expires_at);

-- Comentarios para documentación
COMMENT ON TABLE pin_recovery_tokens IS 'Tokens para recuperación de PIN olvidado. Expiran después de 1 hora.';
COMMENT ON COLUMN pin_recovery_tokens.token IS 'Token único para recuperar PIN';
COMMENT ON COLUMN pin_recovery_tokens.expires_at IS 'Fecha de expiración del token (1 hora)';
COMMENT ON COLUMN pin_recovery_tokens.used_at IS 'Fecha cuando se usó el token (null si no se ha usado)';
COMMENT ON COLUMN pin_recovery_tokens.ip_address IS 'IP desde donde se solicitó la recuperación';
