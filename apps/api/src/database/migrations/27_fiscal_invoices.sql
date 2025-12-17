-- ============================================
-- 27. FACTURACIÓN FISCAL/TRIBUTARIA
-- ============================================
-- Sistema para generar facturas fiscales con información tributaria completa

-- Tabla de facturas fiscales
CREATE TABLE IF NOT EXISTS fiscal_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  sale_id UUID NULL REFERENCES sales(id) ON DELETE SET NULL, -- Venta asociada (opcional)
  invoice_number VARCHAR(50) NOT NULL, -- Número de factura fiscal
  fiscal_number VARCHAR(100) NULL, -- Número fiscal único (control fiscal)
  invoice_series_id UUID NULL REFERENCES invoice_series(id) ON DELETE SET NULL,
  invoice_type VARCHAR(20) NOT NULL DEFAULT 'invoice' CHECK (invoice_type IN ('invoice', 'credit_note', 'debit_note')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'cancelled', 'rejected')),
  issued_at TIMESTAMPTZ NULL,
  cancelled_at TIMESTAMPTZ NULL,
  -- Información del emisor (tienda)
  issuer_name VARCHAR(200) NOT NULL,
  issuer_tax_id VARCHAR(50) NOT NULL, -- RIF de la tienda
  issuer_address TEXT NULL,
  issuer_phone VARCHAR(50) NULL,
  issuer_email VARCHAR(255) NULL,
  -- Información del cliente
  customer_id UUID NULL REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(200) NULL,
  customer_tax_id VARCHAR(50) NULL, -- RIF/Cédula del cliente
  customer_address TEXT NULL,
  customer_phone VARCHAR(50) NULL,
  customer_email VARCHAR(255) NULL,
  -- Totales
  subtotal_bs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  subtotal_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  tax_amount_bs NUMERIC(18, 2) NOT NULL DEFAULT 0, -- IVA u otros impuestos
  tax_amount_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0, -- Tasa de impuesto (ej: 16% IVA)
  discount_bs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  discount_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_bs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  exchange_rate NUMERIC(18, 6) NOT NULL DEFAULT 0,
  currency VARCHAR(20) NOT NULL DEFAULT 'BS' CHECK (currency IN ('BS', 'USD', 'MIXED')),
  -- Información fiscal adicional
  fiscal_control_code VARCHAR(100) NULL, -- Código de control fiscal
  fiscal_authorization_number VARCHAR(100) NULL, -- Número de autorización fiscal
  fiscal_qr_code TEXT NULL, -- QR code para verificación
  payment_method VARCHAR(50) NULL,
  note TEXT NULL,
  created_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, invoice_number)
);

COMMENT ON TABLE fiscal_invoices IS 'Facturas fiscales/tributarias';
COMMENT ON COLUMN fiscal_invoices.invoice_type IS 'Tipo: invoice (factura), credit_note (nota de crédito), debit_note (nota de débito)';
COMMENT ON COLUMN fiscal_invoices.status IS 'Estado: draft (borrador), issued (emitida), cancelled (cancelada), rejected (rechazada)';
COMMENT ON COLUMN fiscal_invoices.fiscal_number IS 'Número fiscal único asignado por el control fiscal';
COMMENT ON COLUMN fiscal_invoices.fiscal_control_code IS 'Código de control fiscal (SENIAT, etc.)';
COMMENT ON COLUMN fiscal_invoices.tax_rate IS 'Tasa de impuesto aplicada (ej: 16 para IVA del 16%)';

-- Tabla de items de factura fiscal
CREATE TABLE IF NOT EXISTS fiscal_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_invoice_id UUID NOT NULL REFERENCES fiscal_invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID NULL REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name VARCHAR(200) NOT NULL, -- Nombre al momento de la factura
  product_code VARCHAR(100) NULL, -- Código del producto
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_bs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  unit_price_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  discount_bs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  discount_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  subtotal_bs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  subtotal_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  tax_amount_bs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  tax_amount_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_bs NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE fiscal_invoice_items IS 'Items individuales de cada factura fiscal';
COMMENT ON COLUMN fiscal_invoice_items.product_name IS 'Nombre del producto al momento de la factura (snapshot)';

-- Tabla de configuración fiscal por tienda
CREATE TABLE IF NOT EXISTS fiscal_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  tax_id VARCHAR(50) NOT NULL, -- RIF de la tienda
  business_name VARCHAR(200) NOT NULL,
  business_address TEXT NOT NULL,
  business_phone VARCHAR(50) NULL,
  business_email VARCHAR(255) NULL,
  default_tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 16.00, -- IVA por defecto
  fiscal_authorization_number VARCHAR(100) NULL,
  fiscal_authorization_date DATE NULL,
  fiscal_authorization_expiry DATE NULL,
  fiscal_control_system VARCHAR(50) NULL, -- Sistema de control fiscal (SENIAT, etc.)
  is_active BOOLEAN NOT NULL DEFAULT true,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id)
);

COMMENT ON TABLE fiscal_configs IS 'Configuración fiscal por tienda';
COMMENT ON COLUMN fiscal_configs.default_tax_rate IS 'Tasa de impuesto por defecto (ej: 16 para IVA del 16%)';
COMMENT ON COLUMN fiscal_configs.fiscal_control_system IS 'Sistema de control fiscal (SENIAT, etc.)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_store ON fiscal_invoices(store_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_sale ON fiscal_invoices(sale_id) WHERE sale_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_customer ON fiscal_invoices(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_status ON fiscal_invoices(store_id, status);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_number ON fiscal_invoices(store_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoices_issued ON fiscal_invoices(store_id, issued_at DESC) WHERE issued_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fiscal_invoice_items_invoice ON fiscal_invoice_items(fiscal_invoice_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_invoice_items_product ON fiscal_invoice_items(product_id);

CREATE INDEX IF NOT EXISTS idx_fiscal_configs_store ON fiscal_configs(store_id);

