-- ============================================
-- 61. COLA DE MENSAJES DE WHATSAPP
-- ============================================
-- Cola de mensajes pendientes para envío automático (offline-first)

-- Tabla de cola de mensajes de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('sale', 'debt', 'debt_reminder', 'customer', 'custom')),
  reference_id UUID NULL, -- ID de referencia (sale_id, debt_id, customer_id, etc.)
  customer_phone VARCHAR(20) NOT NULL, -- Teléfono del cliente
  message TEXT NOT NULL, -- Mensaje a enviar
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
  attempts INT NOT NULL DEFAULT 0, -- Número de intentos de envío
  max_attempts INT NOT NULL DEFAULT 3, -- Máximo de intentos permitidos
  error_message TEXT NULL, -- Mensaje de error si falla
  sent_at TIMESTAMPTZ NULL, -- Fecha y hora en que se envió exitosamente
  scheduled_for TIMESTAMPTZ NULL, -- Para mensajes programados
  device_id VARCHAR(255) NULL, -- ID del dispositivo que creó el mensaje (offline tracking)
  seq BIGINT NULL, -- Secuencia del evento offline
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE whatsapp_message_queue IS 'Cola de mensajes de WhatsApp pendientes de envío - Soporta offline-first con tracking de device_id y seq';
COMMENT ON COLUMN whatsapp_message_queue.id IS 'ID único del mensaje en cola';
COMMENT ON COLUMN whatsapp_message_queue.store_id IS 'ID de la tienda';
COMMENT ON COLUMN whatsapp_message_queue.message_type IS 'Tipo de mensaje: sale (venta), debt (deuda), debt_reminder (recordatorio), customer (cliente), custom (personalizado)';
COMMENT ON COLUMN whatsapp_message_queue.reference_id IS 'ID de referencia según el tipo: sale_id, debt_id, customer_id, etc.';
COMMENT ON COLUMN whatsapp_message_queue.customer_phone IS 'Teléfono del cliente (formato internacional)';
COMMENT ON COLUMN whatsapp_message_queue.message IS 'Mensaje completo a enviar';
COMMENT ON COLUMN whatsapp_message_queue.status IS 'Estado del mensaje: pending (pendiente), sent (enviado), failed (fallido), retrying (reintentando)';
COMMENT ON COLUMN whatsapp_message_queue.attempts IS 'Número de intentos de envío realizados';
COMMENT ON COLUMN whatsapp_message_queue.max_attempts IS 'Máximo de intentos permitidos antes de marcar como fallido';
COMMENT ON COLUMN whatsapp_message_queue.error_message IS 'Mensaje de error si el envío falla';
COMMENT ON COLUMN whatsapp_message_queue.sent_at IS 'Fecha y hora en que se envió exitosamente';
COMMENT ON COLUMN whatsapp_message_queue.scheduled_for IS 'Fecha y hora programada para envío (para mensajes programados)';
COMMENT ON COLUMN whatsapp_message_queue.device_id IS 'ID del dispositivo que creó el mensaje (para tracking offline)';
COMMENT ON COLUMN whatsapp_message_queue.seq IS 'Secuencia del evento offline (para tracking)';

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_queue_store_status ON whatsapp_message_queue(store_id, status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_queue_store_type ON whatsapp_message_queue(store_id, message_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_queue_store_reference ON whatsapp_message_queue(store_id, reference_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_queue_status_created ON whatsapp_message_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_queue_scheduled ON whatsapp_message_queue(scheduled_for) WHERE scheduled_for IS NOT NULL;
