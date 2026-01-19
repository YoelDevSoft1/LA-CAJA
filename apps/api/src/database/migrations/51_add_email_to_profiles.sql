-- Migración 51: Agregar email y verificación de email a profiles
-- Implementa validación de email en registro y verificación de cuenta

-- Agregar columnas de email a profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Crear índice único para email (permitir NULL pero único si existe)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique 
ON profiles(email) 
WHERE email IS NOT NULL;

-- Crear índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email) 
WHERE email IS NOT NULL;

-- Tabla para tokens de verificación de email
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para email_verification_tokens
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id 
ON email_verification_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token 
ON email_verification_tokens(token);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at 
ON email_verification_tokens(expires_at);

-- Comentarios para documentación
COMMENT ON COLUMN profiles.email IS 'Email del usuario (requerido para registro)';
COMMENT ON COLUMN profiles.email_verified IS 'Indica si el email ha sido verificado';
COMMENT ON COLUMN profiles.email_verified_at IS 'Fecha y hora de verificación del email';
COMMENT ON TABLE email_verification_tokens IS 'Tokens para verificación de email. Expiran después de 24 horas.';
COMMENT ON COLUMN email_verification_tokens.token IS 'Token único para verificar email';
COMMENT ON COLUMN email_verification_tokens.expires_at IS 'Fecha de expiración del token (24 horas)';
COMMENT ON COLUMN email_verification_tokens.used_at IS 'Fecha cuando se usó el token (null si no se ha usado)';
