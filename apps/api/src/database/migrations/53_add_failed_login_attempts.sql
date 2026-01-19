-- Migración 53: Agregar campos para bloqueo de cuenta por intentos fallidos
-- Implementa bloqueo de cuenta individual después de N intentos fallidos

-- Agregar columnas a store_members
ALTER TABLE store_members
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Crear índice para búsquedas de cuentas bloqueadas
CREATE INDEX IF NOT EXISTS idx_store_members_locked_until 
ON store_members(locked_until) 
WHERE locked_until IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN store_members.failed_login_attempts IS 'Número de intentos de login fallidos consecutivos';
COMMENT ON COLUMN store_members.locked_until IS 'Fecha hasta cuando la cuenta está bloqueada (null si no está bloqueada)';
