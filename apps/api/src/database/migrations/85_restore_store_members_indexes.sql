-- 85. RESTORE STORE_MEMBERS INDEXES FOR RLS PERFORMANCE
-- Restaura índices eliminados que son críticos para políticas RLS y consultas por store/user.

CREATE INDEX IF NOT EXISTS idx_store_members_store_id
  ON store_members(store_id);

CREATE INDEX IF NOT EXISTS idx_store_members_user_id
  ON store_members(user_id);

CREATE INDEX IF NOT EXISTS idx_store_members_user_store
  ON store_members(user_id, store_id);
