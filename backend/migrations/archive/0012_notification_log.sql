-- MVP 1.2 / A0 Watchtower: журнал ops- и будущих player-уведомлений

CREATE TABLE IF NOT EXISTS notification_log (
    id SERIAL PRIMARY KEY,
    audience VARCHAR(16) NOT NULL DEFAULT 'admin',
    kind VARCHAR(64) NOT NULL,
    dedupe_key VARCHAR(160),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    game_profile_id INTEGER REFERENCES game_profiles(id) ON DELETE SET NULL,
    payload_json TEXT NOT NULL DEFAULT '{}',
    telegram_sent INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS ix_notification_log_audience_created
    ON notification_log (audience, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_notification_log_dedupe_key
    ON notification_log (dedupe_key)
    WHERE dedupe_key IS NOT NULL;
