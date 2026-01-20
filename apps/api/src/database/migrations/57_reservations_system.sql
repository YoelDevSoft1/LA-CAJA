-- ============================================
-- 57. SISTEMA DE RESERVAS
-- ============================================
-- Sistema para gestión de reservas de mesas

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  table_id UUID NULL REFERENCES tables(id) ON DELETE SET NULL,
  customer_id UUID NULL REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'seated', 'cancelled', 'completed')),
  special_requests TEXT NULL,
  note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE reservations IS 'Reservas de mesas para restaurantes';
COMMENT ON COLUMN reservations.table_id IS 'Mesa asignada (NULL si aún no se asigna)';
COMMENT ON COLUMN reservations.reservation_date IS 'Fecha de la reserva';
COMMENT ON COLUMN reservations.reservation_time IS 'Hora de la reserva';
COMMENT ON COLUMN reservations.party_size IS 'Número de personas';
COMMENT ON COLUMN reservations.status IS 'Estado de la reserva (pending, confirmed, seated, cancelled, completed)';

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_reservations_store ON reservations(store_id);
CREATE INDEX IF NOT EXISTS idx_reservations_table ON reservations(table_id) WHERE table_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_date_time ON reservations(reservation_date, reservation_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id) WHERE customer_id IS NOT NULL;
