-- Anonymous identities keep the same user_id when claimed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_guest INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS guest_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_guest_sessions_user_id ON guest_sessions(user_id);
