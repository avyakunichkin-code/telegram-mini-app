-- 0038_character_needs_fields.sql
-- Character needs (4 axes) + defeat streak + treat-self cooldown tracking.
-- Idempotent: safe to re-run.

ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS need_comfort DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS need_status DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS need_social DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS need_health DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS needs_zero_periods_streak INTEGER NOT NULL DEFAULT 0;

ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS treat_self_last_period_index INTEGER NOT NULL DEFAULT 0;

