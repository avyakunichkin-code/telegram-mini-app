-- Идемпотентность денежных POST (Idempotency-Key), PostgreSQL.

CREATE TABLE IF NOT EXISTS api_idempotency_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  route_key VARCHAR(128) NOT NULL,
  idempotency_key VARCHAR(128) NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 200,
  response_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_idempotency_user_route_key UNIQUE (user_id, route_key, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_user_created
  ON api_idempotency_records (user_id, created_at DESC);
