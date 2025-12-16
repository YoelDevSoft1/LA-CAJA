# Bitácora de Implementación · La Caja POS/SaaS

Estructura por fases. Añade la fecha, autor y breve nota de cada entrega. Usa ✅ cuando la tarea esté lista, 🔄 en progreso, 🔲 pendiente.

## Fase 0 · Setup y Fundamentos
- 🔄 2025-12-15 · Licenciamiento: campos `license_*` en stores, guard, página de bloqueo.
- 🔲 2025-12-15 · Crear usuario owner inicial por consola/seed segura.
- 🔲 2025-12-15 · CORS/headers admin `x-admin-key` alineado para panel administrativo.
- 🔲 2025-12-15 · Documentar flujos de login admin/owner/cashier.

## Fase 1 · Núcleo de Caja y Turnos
- 🔲 Turnos: apertura/cierre con arqueo, corte X/Z, reimpresión de tickets.
- 🔲 Multipagos y topes: mínimos/limites, bitácora de entradas/salidas.
- 🔲 Descuentos con autorización por rol/PIN.
- 🔲 Modo caja rápida (límite de ítems, teclas rápidas, teclado táctil).

## Fase 2 · Multimoneda y Precios
- 🔲 Tasa BCV + fallback manual, redondeo/decimales configurables.
- 🔲 Listas de precio y ofertas con vigencia; tope de descuento global por rol.

## Fase 3 · Inventario y Variantes
- ✅ 2025-12-15 · Aprobación de entradas: movimientos `received` requieren aprobación de owner; stock solo suma aprobados.
- 🔲 Variantes (talla/color), PLU/códigos alternos.
- 🔲 Lotes/vencimientos, seriales, balanza peso-precio.

## Fase 4 · Cuentas abiertas y verticales
- 🔲 Mesas/órdenes: crear, pausar, mover, fusionar; recibos parciales.

## Fase 5 · Licenciamiento y SaaS
- 🔲 Planes trial/free/paid con límites (usuarios, productos, transacciones/día, offline).
- 🔲 Panel admin: crear tiendas, usuarios, asignar/suspender planes, extender trial.
- 🔲 Alertas de expiración + gracia; página de licencia con CTA a renovar.
- 🔲 Auditoría de acciones sensibles (descuentos altos, anulaciones, cierres, cambios de precio).

## Fase 6 · Reportes y Control
- 🔲 Ventas por hora/turno/cajero, margen, rotación, vencimientos, seriales, arqueos/diferencias.
- 🔲 Exportables CSV/PDF y filtros por fecha/tienda/usuario.
- 🔲 Dashboard de licencias y salud de sincronización.

## Fase 7 · Offline-first y Sync
- 🔲 Cola priorizada con backoff y métricas; mensajes claros de errores/rechazos.
- 🔲 Purga/compacción de eventos antiguos.

## Fase 8 · Multibodega y Compras (opcional)
- 🔲 Bodegas por tienda, transferencias, costos (promedio/UEPS), órdenes de compra/recepción.

## Fase 9 · Cumplimiento local (opcional)
- 🔲 Facturación fiscal/tributaria y reglas locales de impresión/moneda.

## UX/UI
- 🔲 POS táctil: botones grandes, indicadores de estado (online/offline, sync, licencia).
- 🔲 Admin “nave”: sidebar/topbar, badges de plan/estatus, sheets para usuarios/tiendas, acciones rápidas.

## Seguridad
- 🔲 Roles (owner/admin/cashier), PIN cajeros, autorización de descuentos/retiros.
- 🔲 Logs de auditoría; 2FA para admin (si se añade).

## Notas rápidas
- Mantener este archivo como fuente de verdad; actualizar al cerrar cada ítem.
- Referenciar PR/commit o ticket al marcar tareas.
