-- PR-17 / PLT-107: последний заход игрока (bootstrap) — D7-прокси и «кто застрял» в Watchtower.
-- NULL у существующих пользователей = заход до появления поля (без backfill).

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP NULL;
CREATE INDEX IF NOT EXISTS ix_users_last_seen_at ON users (last_seen_at);
