-- Migración 54: Agregar device_fingerprint a refresh_tokens
-- Mejora la detección y validación de dispositivos

ALTER TABLE refresh_tokens
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_device_fingerprint 
ON refresh_tokens(device_fingerprint) 
WHERE device_fingerprint IS NOT NULL;

COMMENT ON COLUMN refresh_tokens.device_fingerprint IS 'Fingerprint del dispositivo para detección de nuevos dispositivos';
