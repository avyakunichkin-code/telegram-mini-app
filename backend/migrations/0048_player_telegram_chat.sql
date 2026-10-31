-- PLT-203: player bot — chat_id для исходящих сообщений (TG-105)

ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_started_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS ix_users_telegram_chat_id
  ON users (telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;
