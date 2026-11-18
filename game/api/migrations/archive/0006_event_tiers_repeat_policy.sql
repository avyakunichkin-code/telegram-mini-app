-- MVP 1.1: event_tier, repeat_policy на event_definitions (PostgreSQL, идемпотентно)

ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS event_tier INTEGER NOT NULL DEFAULT 1;
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS repeat_policy VARCHAR(32) NOT NULL DEFAULT 'repeatable';
