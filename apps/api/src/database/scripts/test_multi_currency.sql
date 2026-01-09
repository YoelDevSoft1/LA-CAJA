-- ============================================
-- SCRIPT DE PRUEBAS: SISTEMA MULTI-MONEDA
-- ============================================
-- Ejecutar DESPUÉS de la migración 37
-- Este script prueba todas las funciones y verifica
-- que el sistema funciona correctamente
-- ============================================

-- ============================================
-- 1. PRUEBAS DE FUNCIONES MATEMÁTICAS
-- ============================================

DO $$
DECLARE
    v_result NUMERIC;
    v_cents BIGINT;
BEGIN
    RAISE NOTICE '=== PRUEBAS DE FUNCIONES MATEMÁTICAS ===';

    -- Test to_cents
    v_cents := to_cents(123.45);
    ASSERT v_cents = 12345, 'to_cents(123.45) debería ser 12345, pero fue ' || v_cents;
    RAISE NOTICE '✓ to_cents(123.45) = %', v_cents;

    v_cents := to_cents(0.01);
    ASSERT v_cents = 1, 'to_cents(0.01) debería ser 1';
    RAISE NOTICE '✓ to_cents(0.01) = %', v_cents;

    v_cents := to_cents(99999.99);
    ASSERT v_cents = 9999999, 'to_cents(99999.99) debería ser 9999999';
    RAISE NOTICE '✓ to_cents(99999.99) = %', v_cents;

    -- Test from_cents
    v_result := from_cents(12345);
    ASSERT v_result = 123.45, 'from_cents(12345) debería ser 123.45';
    RAISE NOTICE '✓ from_cents(12345) = %', v_result;

    -- Test usd_to_bs
    v_result := usd_to_bs(100, 36.50);
    ASSERT v_result = 3650.00, 'usd_to_bs(100, 36.50) debería ser 3650.00';
    RAISE NOTICE '✓ usd_to_bs(100, 36.50) = %', v_result;

    v_result := usd_to_bs(1.99, 36.50);
    ASSERT v_result = 72.64, 'usd_to_bs(1.99, 36.50) debería ser 72.64';
    RAISE NOTICE '✓ usd_to_bs(1.99, 36.50) = %', v_result;

    -- Test bs_to_usd
    v_result := bs_to_usd(3650, 36.50);
    ASSERT v_result = 100.00, 'bs_to_usd(3650, 36.50) debería ser 100.00';
    RAISE NOTICE '✓ bs_to_usd(3650, 36.50) = %', v_result;

    v_result := bs_to_usd(100, 36.50);
    ASSERT v_result = 2.74, 'bs_to_usd(100, 36.50) debería ser 2.74';
    RAISE NOTICE '✓ bs_to_usd(100, 36.50) = %', v_result;

    -- Test banker_round
    v_result := banker_round(2.5, 0);
    ASSERT v_result = 2, 'banker_round(2.5, 0) debería ser 2 (redondea al par)';
    RAISE NOTICE '✓ banker_round(2.5, 0) = % (redondea al par)', v_result;

    v_result := banker_round(3.5, 0);
    ASSERT v_result = 4, 'banker_round(3.5, 0) debería ser 4 (redondea al par)';
    RAISE NOTICE '✓ banker_round(3.5, 0) = % (redondea al par)', v_result;

    v_result := banker_round(2.55, 1);
    ASSERT v_result = 2.6, 'banker_round(2.55, 1) debería ser 2.6';
    RAISE NOTICE '✓ banker_round(2.55, 1) = %', v_result;

    RAISE NOTICE '';
    RAISE NOTICE '=== TODAS LAS PRUEBAS MATEMÁTICAS PASARON ===';
END $$;

-- ============================================
-- 2. PRUEBA DE DESGLOSE DE CAMBIO
-- ============================================

DO $$
DECLARE
    v_breakdown JSONB;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== PRUEBA DE DESGLOSE DE CAMBIO ===';

    -- Cambio de 785 Bs
    v_breakdown := calculate_bs_change_breakdown(785.00);
    RAISE NOTICE 'Cambio de 785 Bs:';
    RAISE NOTICE '  Desglose: %', v_breakdown;

    -- Verificar que suma correctamente
    ASSERT (v_breakdown->>'total_bs')::NUMERIC = 785.00,
        'Total debería ser 785.00';

    -- Cambio de 1567.50 Bs
    v_breakdown := calculate_bs_change_breakdown(1567.50);
    RAISE NOTICE '';
    RAISE NOTICE 'Cambio de 1567.50 Bs:';
    RAISE NOTICE '  Desglose: %', v_breakdown;

    -- Cambio pequeño de 3.75 Bs
    v_breakdown := calculate_bs_change_breakdown(3.75);
    RAISE NOTICE '';
    RAISE NOTICE 'Cambio de 3.75 Bs:';
    RAISE NOTICE '  Desglose: %', v_breakdown;
    RAISE NOTICE '  Exceso (centavos sin billete): % Bs', v_breakdown->>'excess_bs';

    RAISE NOTICE '';
    RAISE NOTICE '=== PRUEBA DE DESGLOSE COMPLETADA ===';
END $$;

-- ============================================
-- 3. EJEMPLO: INSERTAR TASAS PARA UNA TIENDA
-- ============================================

-- Nota: Reemplaza 'TU_STORE_ID' con un ID real de tienda
-- Este es solo un ejemplo de cómo insertar tasas

/*
-- Insertar tasa BCV
INSERT INTO exchange_rates (store_id, rate, rate_type, source, is_preferred)
VALUES ('TU_STORE_ID', 36.50, 'BCV', 'api', true);

-- Insertar tasa paralela (usualmente más alta)
INSERT INTO exchange_rates (store_id, rate, rate_type, source, is_preferred, note)
VALUES ('TU_STORE_ID', 38.75, 'PARALLEL', 'manual', true, 'Monitor Dólar');

-- Insertar tasa de efectivo (usualmente la más alta)
INSERT INTO exchange_rates (store_id, rate, rate_type, source, is_preferred, note)
VALUES ('TU_STORE_ID', 40.00, 'CASH', 'manual', true, 'Tasa efectivo calle');

-- Insertar tasa Zelle (entre BCV y paralelo)
INSERT INTO exchange_rates (store_id, rate, rate_type, source, is_preferred, note)
VALUES ('TU_STORE_ID', 37.50, 'ZELLE', 'manual', true, 'Tasa para pagos Zelle');
*/

-- ============================================
-- 4. EJEMPLO: REGISTRAR PAGO MIXTO
-- ============================================

/*
-- Supongamos una venta de $50 USD
-- El cliente paga:
-- - $20 en efectivo USD (tasa CASH: 40.00)
-- - $15 con Pago Móvil (tasa BCV: 36.50)
-- - $15 con Zelle (tasa ZELLE: 37.50)

-- Pago 1: Efectivo USD
INSERT INTO sale_payments (
    sale_id,
    payment_order,
    method,
    amount_cents_usd,
    amount_cents_bs,
    rate_type,
    applied_rate
) VALUES (
    'SALE_ID',
    1,
    'CASH_USD',
    2000,           -- $20.00 en centavos
    80000,          -- $20 * 40.00 = 800 Bs en centavos
    'CASH',
    40.00
);

-- Pago 2: Pago Móvil
INSERT INTO sale_payments (
    sale_id,
    payment_order,
    method,
    amount_cents_usd,
    amount_cents_bs,
    rate_type,
    applied_rate,
    reference,
    bank_code
) VALUES (
    'SALE_ID',
    2,
    'PAGO_MOVIL',
    1500,           -- $15.00 en centavos
    54750,          -- $15 * 36.50 = 547.50 Bs en centavos
    'BCV',
    36.50,
    '123456789',
    '0102'
);

-- Pago 3: Zelle
INSERT INTO sale_payments (
    sale_id,
    payment_order,
    method,
    amount_cents_usd,
    amount_cents_bs,
    rate_type,
    applied_rate,
    reference
) VALUES (
    'SALE_ID',
    3,
    'ZELLE',
    1500,           -- $15.00 en centavos
    56250,          -- $15 * 37.50 = 562.50 Bs en centavos
    'ZELLE',
    37.50,
    'ZELLE-REF-12345'
);
*/

-- ============================================
-- 5. CONSULTAS ÚTILES
-- ============================================

-- Ver todas las tasas de una tienda
-- SELECT * FROM get_all_active_rates('TU_STORE_ID');

-- Ver resumen de tasas de todas las tiendas
SELECT * FROM v_store_rates_summary LIMIT 5;

-- Ver configuración de tasas por tienda
SELECT
    src.*,
    s.name AS store_name
FROM store_rate_configs src
JOIN stores s ON s.id = src.store_id
LIMIT 5;

-- ============================================
-- 6. VERIFICAR ESTRUCTURA DE TABLAS
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICACIÓN DE ESTRUCTURA ===';

    -- Verificar exchange_rates tiene rate_type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'exchange_rates' AND column_name = 'rate_type'
    ) THEN
        RAISE NOTICE '✓ exchange_rates.rate_type existe';
    ELSE
        RAISE NOTICE '✗ exchange_rates.rate_type NO existe';
    END IF;

    -- Verificar store_rate_configs existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'store_rate_configs'
    ) THEN
        RAISE NOTICE '✓ Tabla store_rate_configs existe';
    ELSE
        RAISE NOTICE '✗ Tabla store_rate_configs NO existe';
    END IF;

    -- Verificar sale_payments existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'sale_payments'
    ) THEN
        RAISE NOTICE '✓ Tabla sale_payments existe';
    ELSE
        RAISE NOTICE '✗ Tabla sale_payments NO existe';
    END IF;

    -- Verificar sale_change existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'sale_change'
    ) THEN
        RAISE NOTICE '✓ Tabla sale_change existe';
    ELSE
        RAISE NOTICE '✗ Tabla sale_change NO existe';
    END IF;

    -- Verificar funciones
    IF EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'to_cents'
    ) THEN
        RAISE NOTICE '✓ Función to_cents existe';
    ELSE
        RAISE NOTICE '✗ Función to_cents NO existe';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'calculate_bs_change_breakdown'
    ) THEN
        RAISE NOTICE '✓ Función calculate_bs_change_breakdown existe';
    ELSE
        RAISE NOTICE '✗ Función calculate_bs_change_breakdown NO existe';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICACIÓN COMPLETADA ===';
END $$;

-- ============================================
-- 7. RESUMEN DE LO CREADO
-- ============================================

SELECT '
============================================
RESUMEN DE LA MIGRACIÓN 37
============================================

TABLAS NUEVAS:
- store_rate_configs: Configuración de tasas por tienda
- sale_payments: Pagos individuales (soporta mixtos)
- sale_change: Registro de cambio/vuelto

COLUMNAS NUEVAS EN exchange_rates:
- rate_type: BCV, PARALLEL, CASH, ZELLE
- is_preferred: Marca la tasa preferida por tipo

FUNCIONES MATEMÁTICAS:
- to_cents(amount): Convierte a centavos (precisión)
- from_cents(cents): Convierte de centavos
- usd_to_bs(amount, rate): Conversión USD → BS
- bs_to_usd(amount, rate): Conversión BS → USD
- banker_round(value, decimals): Redondeo bancario
- get_active_rate(store_id, type): Obtiene tasa activa
- get_all_active_rates(store_id): Todas las tasas
- calculate_bs_change_breakdown(amount): Desglose de cambio
- calculate_sale_totals(sale_id): Totales de venta

VISTAS:
- v_store_rates_summary: Resumen de tasas por tienda
- v_sales_with_payments: Ventas con pagos detallados

TRIGGERS:
- trg_single_preferred_rate: Solo una tasa preferida por tipo
- trg_store_rate_configs_updated: Auto-actualiza timestamp
- trg_validate_payment: Valida límites de pago

============================================
' AS resumen;
