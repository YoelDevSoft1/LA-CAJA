-- ============================================
-- 60. CONFIGURACIÓN DE WHATSAPP
-- ============================================
-- Sistema para configurar WhatsApp por tienda y enviar mensajes automáticos

-- Tabla de configuración de WhatsApp por tienda
CREATE TABLE IF NOT EXISTS whatsapp_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  whatsapp_number VARCHAR(20) NULL, -- Número de WhatsApp conectado
  thank_you_message TEXT NULL, -- Mensaje personalizado de agradecimiento
  enabled BOOLEAN NOT NULL DEFAULT false, -- Habilitar envío automático de ventas
  debt_notifications_enabled BOOLEAN NOT NULL DEFAULT false, -- Habilitar notificaciones de deudas
  debt_reminders_enabled BOOLEAN NOT NULL DEFAULT false, -- Habilitar recordatorios automáticos de deudas
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT whatsapp_configs_store_id_unique UNIQUE (store_id)
);

COMMENT ON TABLE whatsapp_configs IS 'Configuración de WhatsApp por tienda - Permite configurar número, mensajes personalizados y habilitar/deshabilitar notificaciones automáticas';
COMMENT ON COLUMN whatsapp_configs.id IS 'ID único de la configuración';
COMMENT ON COLUMN whatsapp_configs.store_id IS 'ID de la tienda (único por tienda)';
COMMENT ON COLUMN whatsapp_configs.whatsapp_number IS 'Número de WhatsApp conectado (extraído del QR)';
COMMENT ON COLUMN whatsapp_configs.thank_you_message IS 'Mensaje personalizado de agradecimiento (puede incluir variables como {storeName}, {customerName})';
COMMENT ON COLUMN whatsapp_configs.enabled IS 'Habilitar envío automático de detalles de compra cuando se realiza una venta';
COMMENT ON COLUMN whatsapp_configs.debt_notifications_enabled IS 'Habilitar notificaciones cuando se crea una deuda (FIAO)';
COMMENT ON COLUMN whatsapp_configs.debt_reminders_enabled IS 'Habilitar recordatorios automáticos de deudas pendientes';

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_store_id ON whatsapp_configs(store_id);
