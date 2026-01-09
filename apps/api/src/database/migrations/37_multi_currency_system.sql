-- ============================================
-- 37. SISTEMA MULTI-MONEDA VENEZUELA
-- ============================================
-- Sistema completo para manejar múltiples tasas de cambio
-- y pagos mixtos con lógica matemática precisa
--
-- Autor: LA CAJA POS
-- Fecha: 2025
-- ============================================

-- ============================================
-- PARTE 1: TIPOS ENUMERADOS
-- ============================================

-- Tipo de tasa de cambio
DO $$ BEGIN
    CREATE TYPE exchange_rate_type AS ENUM (
        'BCV',       -- Tasa oficial Banco Central de Venezuela
        'PARALLEL',  -- Tasa paralela / Monitor Dólar
        'CASH',      -- Tasa para dólar físico en efectivo
        'ZELLE'      -- Tasa específica para pagos Zelle
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de método de pago extendido
DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM (
        'CASH_USD',
        'CASH_BS',
        'PAGO_MOVIL',
        'TRANSFER',
        'POINT_OF_SALE',
        'ZELLE',
        'OTHER',
        'FIAO',
        'SPLIT'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- PARTE 2: MODIFICAR TABLA exchange_rates
-- ============================================

-- Agregar columna rate_type si no existe
DO $$ BEGIN
    ALTER TABLE exchange_rates
    ADD COLUMN rate_type VARCHAR(20) NOT NULL DEFAULT 'BCV';
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Agregar constraint de valores válidos
DO $$ BEGIN
    ALTER TABLE exchange_rates
    ADD CONSTRAINT chk_rate_type
    CHECK (rate_type IN ('BCV', 'PARALLEL', 'CASH', 'ZELLE'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Agregar columna para marcar tasa preferida por tipo
DO $$ BEGIN
    ALTER TABLE exchange_rates
    ADD COLUMN is_preferred BOOLEAN NOT NULL DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Comentarios actualizados
COMMENT ON COLUMN exchange_rates.rate_type IS 'Tipo de tasa: BCV (oficial), PARALLEL (paralelo), CASH (efectivo), ZELLE';
COMMENT ON COLUMN exchange_rates.is_preferred IS 'Si es la tasa preferida para este tipo (solo una activa por tipo/tienda)';

-- Índice para búsqueda por tipo de tasa
CREATE INDEX IF NOT EXISTS idx_exchange_rates_type
ON exchange_rates(store_id, rate_type, is_active)
WHERE is_active = true;

-- Índice único para tasa preferida por tipo
CREATE UNIQUE INDEX IF NOT EXISTS idx_exchange_rates_preferred
ON exchange_rates(store_id, rate_type)
WHERE is_active = true AND is_preferred = true;

-- ============================================
-- PARTE 3: TABLA DE CONFIGURACIÓN DE TASAS
-- ============================================

CREATE TABLE IF NOT EXISTS store_rate_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Tasas predeterminadas por método de pago
    -- Mapea: método de pago -> tipo de tasa a usar
    cash_usd_rate_type VARCHAR(20) NOT NULL DEFAULT 'CASH',
    cash_bs_rate_type VARCHAR(20) NOT NULL DEFAULT 'BCV',
    pago_movil_rate_type VARCHAR(20) NOT NULL DEFAULT 'BCV',
    transfer_rate_type VARCHAR(20) NOT NULL DEFAULT 'BCV',
    point_of_sale_rate_type VARCHAR(20) NOT NULL DEFAULT 'BCV',
    zelle_rate_type VARCHAR(20) NOT NULL DEFAULT 'ZELLE',

    -- Configuración de redondeo
    rounding_mode VARCHAR(20) NOT NULL DEFAULT 'NEAREST',
    rounding_precision INTEGER NOT NULL DEFAULT 2,

    -- Configuración de cambio
    prefer_change_in VARCHAR(10) NOT NULL DEFAULT 'BS',
    auto_convert_small_change BOOLEAN NOT NULL DEFAULT true,
    small_change_threshold_usd NUMERIC(10,2) NOT NULL DEFAULT 1.00,

    -- Configuración de sobrepago
    allow_overpayment BOOLEAN NOT NULL DEFAULT true,
    max_overpayment_usd NUMERIC(10,2) NOT NULL DEFAULT 10.00,
    overpayment_action VARCHAR(20) NOT NULL DEFAULT 'CHANGE',

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,

    UNIQUE(store_id),

    -- Constraints
    CONSTRAINT chk_cash_usd_rate CHECK (cash_usd_rate_type IN ('BCV', 'PARALLEL', 'CASH', 'ZELLE')),
    CONSTRAINT chk_cash_bs_rate CHECK (cash_bs_rate_type IN ('BCV', 'PARALLEL', 'CASH', 'ZELLE')),
    CONSTRAINT chk_pago_movil_rate CHECK (pago_movil_rate_type IN ('BCV', 'PARALLEL', 'CASH', 'ZELLE')),
    CONSTRAINT chk_transfer_rate CHECK (transfer_rate_type IN ('BCV', 'PARALLEL', 'CASH', 'ZELLE')),
    CONSTRAINT chk_pos_rate CHECK (point_of_sale_rate_type IN ('BCV', 'PARALLEL', 'CASH', 'ZELLE')),
    CONSTRAINT chk_zelle_rate CHECK (zelle_rate_type IN ('BCV', 'PARALLEL', 'CASH', 'ZELLE')),
    CONSTRAINT chk_rounding_mode CHECK (rounding_mode IN ('UP', 'DOWN', 'NEAREST', 'BANKER')),
    CONSTRAINT chk_prefer_change CHECK (prefer_change_in IN ('USD', 'BS', 'SAME')),
    CONSTRAINT chk_overpayment_action CHECK (overpayment_action IN ('CHANGE', 'CREDIT', 'TIP', 'REJECT'))
);

COMMENT ON TABLE store_rate_configs IS 'Configuración de tasas de cambio y comportamiento por tienda';
COMMENT ON COLUMN store_rate_configs.cash_usd_rate_type IS 'Tipo de tasa a usar para efectivo USD';
COMMENT ON COLUMN store_rate_configs.rounding_mode IS 'Modo de redondeo: UP, DOWN, NEAREST, BANKER';
COMMENT ON COLUMN store_rate_configs.prefer_change_in IS 'Moneda preferida para dar cambio: USD, BS, SAME (misma que recibió)';
COMMENT ON COLUMN store_rate_configs.overpayment_action IS 'Qué hacer con sobrepagos: CHANGE, CREDIT, TIP, REJECT';

-- ============================================
-- PARTE 4: TABLA DE PAGOS DIVIDIDOS (SPLIT)
-- ============================================

CREATE TABLE IF NOT EXISTS sale_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,

    -- Información del pago
    payment_order INTEGER NOT NULL DEFAULT 1,
    method VARCHAR(20) NOT NULL,

    -- Montos (siempre en centavos para precisión)
    amount_cents_usd BIGINT NOT NULL,
    amount_cents_bs BIGINT NOT NULL,

    -- Tasa aplicada a este pago específico
    rate_type VARCHAR(20) NOT NULL DEFAULT 'BCV',
    applied_rate NUMERIC(18,6) NOT NULL,

    -- Detalles opcionales según método
    reference VARCHAR(100) NULL,
    bank_code VARCHAR(10) NULL,
    phone VARCHAR(20) NULL,
    card_last_4 VARCHAR(4) NULL,
    authorization_code VARCHAR(20) NULL,

    -- Estado
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    confirmed_at TIMESTAMPTZ NULL,
    confirmed_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,

    -- Notas
    note TEXT NULL,

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_payment_method CHECK (method IN (
        'CASH_USD', 'CASH_BS', 'PAGO_MOVIL', 'TRANSFER',
        'POINT_OF_SALE', 'ZELLE', 'OTHER', 'FIAO'
    )),
    CONSTRAINT chk_payment_rate_type CHECK (rate_type IN ('BCV', 'PARALLEL', 'CASH', 'ZELLE')),
    CONSTRAINT chk_payment_status CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'REFUNDED')),
    CONSTRAINT chk_positive_amounts CHECK (amount_cents_usd >= 0 AND amount_cents_bs >= 0)
);

COMMENT ON TABLE sale_payments IS 'Pagos individuales de una venta (soporta pagos mixtos/divididos)';
COMMENT ON COLUMN sale_payments.amount_cents_usd IS 'Monto en centavos de USD (dividir por 100 para obtener USD)';
COMMENT ON COLUMN sale_payments.amount_cents_bs IS 'Monto en centavos de Bs (dividir por 100 para obtener Bs)';
COMMENT ON COLUMN sale_payments.applied_rate IS 'Tasa de cambio aplicada en el momento del pago';

-- Índices
CREATE INDEX IF NOT EXISTS idx_sale_payments_sale ON sale_payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_payments_method ON sale_payments(method);
CREATE INDEX IF NOT EXISTS idx_sale_payments_status ON sale_payments(status) WHERE status != 'CONFIRMED';

-- ============================================
-- PARTE 5: TABLA DE CAMBIO/VUELTO
-- ============================================

CREATE TABLE IF NOT EXISTS sale_change (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,

    -- Montos de cambio (en centavos)
    change_cents_usd BIGINT NOT NULL DEFAULT 0,
    change_cents_bs BIGINT NOT NULL DEFAULT 0,

    -- Cómo se dio el cambio
    change_method VARCHAR(20) NOT NULL DEFAULT 'CASH_BS',
    applied_rate NUMERIC(18,6) NOT NULL,

    -- Desglose de denominaciones (JSON)
    -- Ej: {"bills": [{"denomination": 100, "count": 1}, {"denomination": 50, "count": 1}], "excess": 0}
    breakdown JSONB NULL,

    -- Exceso/redondeo
    excess_cents_bs BIGINT NOT NULL DEFAULT 0,
    excess_action VARCHAR(20) NOT NULL DEFAULT 'FAVOR_CUSTOMER',

    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_change_method CHECK (change_method IN ('CASH_USD', 'CASH_BS', 'CREDIT', 'TIP', 'MIXED')),
    CONSTRAINT chk_excess_action CHECK (excess_action IN ('FAVOR_CUSTOMER', 'FAVOR_STORE', 'CREDIT', 'TIP'))
);

COMMENT ON TABLE sale_change IS 'Registro del cambio/vuelto dado en una venta';
COMMENT ON COLUMN sale_change.breakdown IS 'Desglose de billetes/monedas: {"bills": [{"denomination": 100, "count": 2}]}';
COMMENT ON COLUMN sale_change.excess_cents_bs IS 'Exceso por redondeo a denominaciones disponibles';

CREATE INDEX IF NOT EXISTS idx_sale_change_sale ON sale_change(sale_id);

-- ============================================
-- PARTE 6: FUNCIONES MATEMÁTICAS DE PRECISIÓN
-- ============================================

-- Función: Convertir monto a centavos (evita errores de punto flotante)
CREATE OR REPLACE FUNCTION to_cents(amount NUMERIC)
RETURNS BIGINT AS $$
BEGIN
    RETURN ROUND(amount * 100)::BIGINT;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

COMMENT ON FUNCTION to_cents IS 'Convierte un monto decimal a centavos (entero) para cálculos precisos';

-- Función: Convertir centavos a monto decimal
CREATE OR REPLACE FUNCTION from_cents(cents BIGINT)
RETURNS NUMERIC AS $$
BEGIN
    RETURN cents / 100.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

COMMENT ON FUNCTION from_cents IS 'Convierte centavos (entero) a monto decimal';

-- Función: Convertir USD a BS con tasa específica
CREATE OR REPLACE FUNCTION usd_to_bs(
    amount_usd NUMERIC,
    rate NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
    IF rate IS NULL OR rate <= 0 THEN
        RAISE EXCEPTION 'Tasa de cambio inválida: %', rate;
    END IF;
    RETURN ROUND(amount_usd * rate, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION usd_to_bs IS 'Convierte USD a BS usando la tasa proporcionada';

-- Función: Convertir BS a USD con tasa específica
CREATE OR REPLACE FUNCTION bs_to_usd(
    amount_bs NUMERIC,
    rate NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
    IF rate IS NULL OR rate <= 0 THEN
        RAISE EXCEPTION 'Tasa de cambio inválida: %', rate;
    END IF;
    RETURN ROUND(amount_bs / rate, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION bs_to_usd IS 'Convierte BS a USD usando la tasa proporcionada';

-- Función: Redondeo bancario (Banker's rounding / Round half to even)
CREATE OR REPLACE FUNCTION banker_round(
    value NUMERIC,
    decimals INTEGER DEFAULT 2
)
RETURNS NUMERIC AS $$
DECLARE
    factor NUMERIC;
    scaled NUMERIC;
    truncated NUMERIC;
    remainder NUMERIC;
BEGIN
    factor := POWER(10, decimals);
    scaled := value * factor;
    truncated := TRUNC(scaled);
    remainder := scaled - truncated;

    -- Si el resto es exactamente 0.5, redondear al par más cercano
    IF ABS(remainder - 0.5) < 0.0000001 THEN
        IF MOD(truncated::BIGINT, 2) = 0 THEN
            RETURN truncated / factor;
        ELSE
            RETURN (truncated + 1) / factor;
        END IF;
    ELSE
        -- Redondeo normal
        RETURN ROUND(value, decimals);
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION banker_round IS 'Redondeo bancario: 0.5 se redondea al número par más cercano';

-- Función: Obtener tasa activa por tipo para una tienda
CREATE OR REPLACE FUNCTION get_active_rate(
    p_store_id UUID,
    p_rate_type VARCHAR DEFAULT 'BCV'
)
RETURNS NUMERIC AS $$
DECLARE
    v_rate NUMERIC;
BEGIN
    -- Buscar tasa activa y preferida
    SELECT rate INTO v_rate
    FROM exchange_rates
    WHERE store_id = p_store_id
      AND rate_type = p_rate_type
      AND is_active = true
      AND effective_from <= NOW()
      AND (effective_until IS NULL OR effective_until >= NOW())
    ORDER BY is_preferred DESC, effective_from DESC
    LIMIT 1;

    -- Si no hay tasa del tipo solicitado, buscar BCV como fallback
    IF v_rate IS NULL AND p_rate_type != 'BCV' THEN
        SELECT rate INTO v_rate
        FROM exchange_rates
        WHERE store_id = p_store_id
          AND rate_type = 'BCV'
          AND is_active = true
          AND effective_from <= NOW()
          AND (effective_until IS NULL OR effective_until >= NOW())
        ORDER BY is_preferred DESC, effective_from DESC
        LIMIT 1;
    END IF;

    RETURN v_rate;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_active_rate IS 'Obtiene la tasa activa de un tipo específico, con fallback a BCV';

-- Función: Obtener todas las tasas activas de una tienda
CREATE OR REPLACE FUNCTION get_all_active_rates(p_store_id UUID)
RETURNS TABLE (
    rate_type VARCHAR,
    rate NUMERIC,
    source VARCHAR,
    effective_from TIMESTAMPTZ,
    is_preferred BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (er.rate_type)
        er.rate_type,
        er.rate,
        er.source,
        er.effective_from,
        er.is_preferred
    FROM exchange_rates er
    WHERE er.store_id = p_store_id
      AND er.is_active = true
      AND er.effective_from <= NOW()
      AND (er.effective_until IS NULL OR er.effective_until >= NOW())
    ORDER BY er.rate_type, er.is_preferred DESC, er.effective_from DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_all_active_rates IS 'Obtiene todas las tasas activas de una tienda (una por tipo)';

-- Función: Calcular cambio óptimo en denominaciones Bs
CREATE OR REPLACE FUNCTION calculate_bs_change_breakdown(
    p_change_bs NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_remaining BIGINT;
    v_bills JSONB := '[]'::JSONB;
    v_denominations INTEGER[] := ARRAY[500, 200, 100, 50, 20, 10, 5, 1];
    v_denom INTEGER;
    v_count INTEGER;
BEGIN
    v_remaining := to_cents(p_change_bs);

    FOREACH v_denom IN ARRAY v_denominations LOOP
        v_count := (v_remaining / 100) / v_denom;
        IF v_count > 0 THEN
            v_bills := v_bills || jsonb_build_object(
                'denomination', v_denom,
                'count', v_count,
                'subtotal', v_denom * v_count
            );
            v_remaining := v_remaining - (v_count * v_denom * 100);
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'bills', v_bills,
        'total_bs', p_change_bs,
        'excess_cents', v_remaining,
        'excess_bs', from_cents(v_remaining)
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_bs_change_breakdown IS 'Calcula el desglose óptimo de billetes para dar cambio en Bs';

-- Función: Calcular el total de una venta con pagos mixtos
CREATE OR REPLACE FUNCTION calculate_sale_totals(p_sale_id UUID)
RETURNS TABLE (
    total_paid_usd NUMERIC,
    total_paid_bs NUMERIC,
    total_due_usd NUMERIC,
    total_due_bs NUMERIC,
    balance_usd NUMERIC,
    balance_bs NUMERIC,
    is_paid BOOLEAN,
    is_overpaid BOOLEAN
) AS $$
DECLARE
    v_sale_total_usd NUMERIC;
    v_sale_rate NUMERIC;
BEGIN
    -- Obtener total de la venta
    SELECT
        (totals->>'total_usd')::NUMERIC,
        exchange_rate
    INTO v_sale_total_usd, v_sale_rate
    FROM sales
    WHERE id = p_sale_id;

    IF v_sale_total_usd IS NULL THEN
        RAISE EXCEPTION 'Venta no encontrada: %', p_sale_id;
    END IF;

    RETURN QUERY
    SELECT
        COALESCE(SUM(from_cents(sp.amount_cents_usd)), 0) AS total_paid_usd,
        COALESCE(SUM(from_cents(sp.amount_cents_bs)), 0) AS total_paid_bs,
        v_sale_total_usd AS total_due_usd,
        usd_to_bs(v_sale_total_usd, v_sale_rate) AS total_due_bs,
        COALESCE(SUM(from_cents(sp.amount_cents_usd)), 0) - v_sale_total_usd AS balance_usd,
        COALESCE(SUM(from_cents(sp.amount_cents_bs)), 0) - usd_to_bs(v_sale_total_usd, v_sale_rate) AS balance_bs,
        COALESCE(SUM(from_cents(sp.amount_cents_usd)), 0) >= v_sale_total_usd AS is_paid,
        COALESCE(SUM(from_cents(sp.amount_cents_usd)), 0) > v_sale_total_usd AS is_overpaid
    FROM sale_payments sp
    WHERE sp.sale_id = p_sale_id
      AND sp.status = 'CONFIRMED';
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_sale_totals IS 'Calcula los totales pagados vs debidos de una venta';

-- ============================================
-- PARTE 7: TRIGGERS
-- ============================================

-- Trigger: Asegurar solo una tasa preferida por tipo/tienda
CREATE OR REPLACE FUNCTION trg_ensure_single_preferred_rate()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_preferred = true AND NEW.is_active = true THEN
        -- Desactivar otras tasas preferidas del mismo tipo
        UPDATE exchange_rates
        SET is_preferred = false
        WHERE store_id = NEW.store_id
          AND rate_type = NEW.rate_type
          AND id != NEW.id
          AND is_preferred = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_preferred_rate ON exchange_rates;
CREATE TRIGGER trg_single_preferred_rate
    BEFORE INSERT OR UPDATE ON exchange_rates
    FOR EACH ROW
    EXECUTE FUNCTION trg_ensure_single_preferred_rate();

-- Trigger: Actualizar updated_at en store_rate_configs
CREATE OR REPLACE FUNCTION trg_update_store_rate_configs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_store_rate_configs_updated ON store_rate_configs;
CREATE TRIGGER trg_store_rate_configs_updated
    BEFORE UPDATE ON store_rate_configs
    FOR EACH ROW
    EXECUTE FUNCTION trg_update_store_rate_configs_timestamp();

-- Trigger: Validar que los pagos no excedan límites configurados
CREATE OR REPLACE FUNCTION trg_validate_payment_limits()
RETURNS TRIGGER AS $$
DECLARE
    v_config RECORD;
    v_amount_usd NUMERIC;
BEGIN
    v_amount_usd := from_cents(NEW.amount_cents_usd);

    -- Buscar configuración del método de pago
    SELECT * INTO v_config
    FROM payment_method_configs
    WHERE store_id = (SELECT store_id FROM sales WHERE id = NEW.sale_id)
      AND method = NEW.method
      AND enabled = true;

    IF v_config IS NOT NULL THEN
        -- Validar mínimo
        IF v_config.min_amount_usd IS NOT NULL AND v_amount_usd < v_config.min_amount_usd THEN
            RAISE EXCEPTION 'Monto % USD es menor al mínimo permitido % USD para %',
                v_amount_usd, v_config.min_amount_usd, NEW.method;
        END IF;

        -- Validar máximo
        IF v_config.max_amount_usd IS NOT NULL AND v_amount_usd > v_config.max_amount_usd THEN
            RAISE EXCEPTION 'Monto % USD excede el máximo permitido % USD para %',
                v_amount_usd, v_config.max_amount_usd, NEW.method;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_payment ON sale_payments;
CREATE TRIGGER trg_validate_payment
    BEFORE INSERT ON sale_payments
    FOR EACH ROW
    EXECUTE FUNCTION trg_validate_payment_limits();

-- ============================================
-- PARTE 8: VISTAS ÚTILES
-- ============================================

-- Vista: Resumen de tasas por tienda
CREATE OR REPLACE VIEW v_store_rates_summary AS
SELECT
    s.id AS store_id,
    s.name AS store_name,
    (SELECT rate FROM exchange_rates WHERE store_id = s.id AND rate_type = 'BCV' AND is_active = true ORDER BY is_preferred DESC, effective_from DESC LIMIT 1) AS bcv_rate,
    (SELECT rate FROM exchange_rates WHERE store_id = s.id AND rate_type = 'PARALLEL' AND is_active = true ORDER BY is_preferred DESC, effective_from DESC LIMIT 1) AS parallel_rate,
    (SELECT rate FROM exchange_rates WHERE store_id = s.id AND rate_type = 'CASH' AND is_active = true ORDER BY is_preferred DESC, effective_from DESC LIMIT 1) AS cash_rate,
    (SELECT rate FROM exchange_rates WHERE store_id = s.id AND rate_type = 'ZELLE' AND is_active = true ORDER BY is_preferred DESC, effective_from DESC LIMIT 1) AS zelle_rate,
    (SELECT effective_from FROM exchange_rates WHERE store_id = s.id AND rate_type = 'BCV' AND is_active = true ORDER BY is_preferred DESC, effective_from DESC LIMIT 1) AS bcv_updated_at
FROM stores s;

COMMENT ON VIEW v_store_rates_summary IS 'Resumen de todas las tasas activas por tienda';

-- Vista: Ventas con desglose de pagos
CREATE OR REPLACE VIEW v_sales_with_payments AS
SELECT
    s.id AS sale_id,
    s.store_id,
    s.sold_at,
    s.exchange_rate AS sale_rate,
    (s.totals->>'total_usd')::NUMERIC AS total_usd,
    (s.totals->>'total_bs')::NUMERIC AS total_bs,
    COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
            'method', sp.method,
            'amount_usd', from_cents(sp.amount_cents_usd),
            'amount_bs', from_cents(sp.amount_cents_bs),
            'rate_type', sp.rate_type,
            'applied_rate', sp.applied_rate,
            'reference', sp.reference
        ) ORDER BY sp.payment_order)
        FROM sale_payments sp
        WHERE sp.sale_id = s.id AND sp.status = 'CONFIRMED'),
        '[]'::JSONB
    ) AS payments,
    (SELECT COUNT(*) FROM sale_payments WHERE sale_id = s.id AND status = 'CONFIRMED') AS payment_count,
    CASE
        WHEN (SELECT COUNT(*) FROM sale_payments WHERE sale_id = s.id AND status = 'CONFIRMED') > 1 THEN 'SPLIT'
        ELSE COALESCE((SELECT method FROM sale_payments WHERE sale_id = s.id AND status = 'CONFIRMED' LIMIT 1), s.payment->>'method')
    END AS payment_type
FROM sales s;

COMMENT ON VIEW v_sales_with_payments IS 'Ventas con información detallada de pagos';

-- ============================================
-- PARTE 9: DATOS INICIALES
-- ============================================

-- Insertar configuración por defecto para tiendas existentes que no la tengan
INSERT INTO store_rate_configs (store_id)
SELECT id FROM stores
WHERE NOT EXISTS (
    SELECT 1 FROM store_rate_configs WHERE store_id = stores.id
)
ON CONFLICT (store_id) DO NOTHING;

-- ============================================
-- PARTE 10: PERMISOS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE store_rate_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_change ENABLE ROW LEVEL SECURITY;

-- Políticas para store_rate_configs
DROP POLICY IF EXISTS "Users can view their store rate configs" ON store_rate_configs;
CREATE POLICY "Users can view their store rate configs" ON store_rate_configs
    FOR SELECT USING (
        store_id IN (
            SELECT sm.store_id FROM store_members sm WHERE sm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their store rate configs" ON store_rate_configs;
CREATE POLICY "Users can update their store rate configs" ON store_rate_configs
    FOR UPDATE USING (
        store_id IN (
            SELECT sm.store_id FROM store_members sm WHERE sm.user_id = auth.uid()
        )
    );

-- Políticas para sale_payments
DROP POLICY IF EXISTS "Users can view sale payments" ON sale_payments;
CREATE POLICY "Users can view sale payments" ON sale_payments
    FOR SELECT USING (
        sale_id IN (
            SELECT s.id FROM sales s
            JOIN store_members sm ON sm.store_id = s.store_id
            WHERE sm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert sale payments" ON sale_payments;
CREATE POLICY "Users can insert sale payments" ON sale_payments
    FOR INSERT WITH CHECK (
        sale_id IN (
            SELECT s.id FROM sales s
            JOIN store_members sm ON sm.store_id = s.store_id
            WHERE sm.user_id = auth.uid()
        )
    );

-- Políticas para sale_change
DROP POLICY IF EXISTS "Users can view sale change" ON sale_change;
CREATE POLICY "Users can view sale change" ON sale_change
    FOR SELECT USING (
        sale_id IN (
            SELECT s.id FROM sales s
            JOIN store_members sm ON sm.store_id = s.store_id
            WHERE sm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert sale change" ON sale_change;
CREATE POLICY "Users can insert sale change" ON sale_change
    FOR INSERT WITH CHECK (
        sale_id IN (
            SELECT s.id FROM sales s
            JOIN store_members sm ON sm.store_id = s.store_id
            WHERE sm.user_id = auth.uid()
        )
    );

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
