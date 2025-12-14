-- Migración: Índices para optimización de performance
-- Fecha: 2024
-- Descripción: Agrega índices compuestos y simples para mejorar el rendimiento de queries frecuentes

-- ============================================
-- ÍNDICES PARA VENTAS (SALES)
-- ============================================

-- Índice compuesto para búsqueda de ventas por tienda y fecha (muy común)
CREATE INDEX IF NOT EXISTS idx_sales_store_date 
ON sales(store_id, sold_at DESC);

-- Índice para búsqueda de ventas por sesión de caja
CREATE INDEX IF NOT EXISTS idx_sales_cash_session 
ON sales(cash_session_id) 
WHERE cash_session_id IS NOT NULL;

-- Índice para búsqueda de ventas por cliente
CREATE INDEX IF NOT EXISTS idx_sales_customer 
ON sales(customer_id) 
WHERE customer_id IS NOT NULL;

-- Índice para búsqueda de ventas por usuario vendedor
CREATE INDEX IF NOT EXISTS idx_sales_sold_by 
ON sales(sold_by_user_id) 
WHERE sold_by_user_id IS NOT NULL;

-- ============================================
-- ÍNDICES PARA EVENTOS (SYNC)
-- ============================================

-- Índice compuesto para queries de sincronización (muy crítico)
CREATE INDEX IF NOT EXISTS idx_events_store_device_sync 
ON events(store_id, device_id, sync_status);

-- Índice para búsqueda por event_id (deduplicación)
CREATE INDEX IF NOT EXISTS idx_events_event_id 
ON events(event_id);

-- Índice compuesto para obtener eventos pendientes ordenados
CREATE INDEX IF NOT EXISTS idx_events_sync_created 
ON events(sync_status, created_at) 
WHERE sync_status = 'pending';

-- Índice para búsqueda por secuencia (para ordenamiento)
CREATE INDEX IF NOT EXISTS idx_events_device_seq 
ON events(device_id, seq);

-- ============================================
-- ÍNDICES PARA PRODUCTOS
-- ============================================

-- Índice compuesto para búsqueda de productos activos por tienda
CREATE INDEX IF NOT EXISTS idx_products_store_active 
ON products(store_id, is_active) 
WHERE is_active = true;

-- Índice para búsqueda por SKU (si se usa frecuentemente)
CREATE INDEX IF NOT EXISTS idx_products_sku 
ON products(sku) 
WHERE sku IS NOT NULL;

-- Índice para búsqueda por barcode (si se usa frecuentemente)
CREATE INDEX IF NOT EXISTS idx_products_barcode 
ON products(barcode) 
WHERE barcode IS NOT NULL;

-- Índice para búsqueda por categoría
CREATE INDEX IF NOT EXISTS idx_products_category 
ON products(store_id, category) 
WHERE category IS NOT NULL;

-- ============================================
-- ÍNDICES PARA INVENTARIO
-- ============================================

-- Índice compuesto para cálculo de stock actual (muy crítico)
CREATE INDEX IF NOT EXISTS idx_inventory_store_product 
ON inventory_movements(store_id, product_id);

-- Índice para búsqueda por tipo de movimiento
CREATE INDEX IF NOT EXISTS idx_inventory_movement_type 
ON inventory_movements(store_id, movement_type);

-- Índice para búsqueda por fecha (para reportes)
CREATE INDEX IF NOT EXISTS idx_inventory_happened_at 
ON inventory_movements(store_id, happened_at DESC);

-- ============================================
-- ÍNDICES PARA DEUDAS Y PAGOS
-- ============================================

-- Índice compuesto para búsqueda de deudas por cliente
CREATE INDEX IF NOT EXISTS idx_debts_customer_status 
ON debts(store_id, customer_id, status);

-- Índice para búsqueda de deudas por venta
CREATE INDEX IF NOT EXISTS idx_debts_sale 
ON debts(sale_id) 
WHERE sale_id IS NOT NULL;

-- Índice para búsqueda de pagos por deuda (optimiza queries N+1)
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt 
ON debt_payments(debt_id);

-- Índice compuesto para búsqueda de pagos por tienda y fecha
CREATE INDEX IF NOT EXISTS idx_debt_payments_store_date 
ON debt_payments(store_id, paid_at DESC);

-- ============================================
-- ÍNDICES PARA CLIENTES
-- ============================================

-- Índice para búsqueda por documento (muy común)
CREATE INDEX IF NOT EXISTS idx_customers_document 
ON customers(store_id, document_id) 
WHERE document_id IS NOT NULL;

-- Índice para búsqueda por nombre (búsqueda de texto)
CREATE INDEX IF NOT EXISTS idx_customers_name 
ON customers(store_id, name);

-- ============================================
-- ÍNDICES PARA SESIONES DE CAJA
-- ============================================

-- Índice compuesto para búsqueda de sesiones por tienda y estado
CREATE INDEX IF NOT EXISTS idx_cash_sessions_store_status 
ON cash_sessions(store_id, closed_at) 
WHERE closed_at IS NULL;

-- Índice para búsqueda de sesiones por usuario
CREATE INDEX IF NOT EXISTS idx_cash_sessions_opened_by 
ON cash_sessions(store_id, opened_by);

-- ============================================
-- ÍNDICES PARA ITEMS DE VENTA
-- ============================================

-- Índice para búsqueda de items por venta (ya debería existir por FK, pero lo agregamos por si acaso)
CREATE INDEX IF NOT EXISTS idx_sale_items_sale 
ON sale_items(sale_id);

-- Índice para búsqueda de items por producto (para reportes)
CREATE INDEX IF NOT EXISTS idx_sale_items_product 
ON sale_items(product_id);

-- ============================================
-- COMENTARIOS Y NOTAS
-- ============================================

-- Los índices parciales (WHERE condition) solo indexan filas que cumplen la condición,
-- lo que los hace más pequeños y eficientes para queries que filtran por esos valores.

-- Los índices compuestos están optimizados para el orden de las columnas en las queries más comunes.

-- Revisar periódicamente el uso de índices con:
-- SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public' ORDER BY idx_scan DESC;

