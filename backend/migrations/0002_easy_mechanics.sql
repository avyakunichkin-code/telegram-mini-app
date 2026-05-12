-- Idempotent migration for Money Quest (PostgreSQL)
-- Adds: events, investments, insurance, asset income fields, overdue fields.
-- Safe to run multiple times.

-- =========================
-- 1) finance_liabilities: overdue fields
-- =========================
ALTER TABLE IF EXISTS finance_liabilities
  ADD COLUMN IF NOT EXISTS overdue_amount DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS finance_liabilities
  ADD COLUMN IF NOT EXISTS overdue_periods INTEGER NOT NULL DEFAULT 0;

-- =========================
-- 2) finance_assets: kind + monthly_income
-- =========================
ALTER TABLE IF EXISTS finance_assets
  ADD COLUMN IF NOT EXISTS kind VARCHAR(50) NOT NULL DEFAULT 'generic';

ALTER TABLE IF EXISTS finance_assets
  ADD COLUMN IF NOT EXISTS monthly_income DOUBLE PRECISION NOT NULL DEFAULT 0;

-- =========================
-- 3) events tables
-- =========================
CREATE TABLE IF NOT EXISTS event_definitions (
  id SERIAL PRIMARY KEY,
  key VARCHAR(80) UNIQUE NOT NULL,
  mode VARCHAR(20) NOT NULL DEFAULT 'light',
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  weight INTEGER NOT NULL DEFAULT 100,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_event_definitions_id ON event_definitions (id);
CREATE INDEX IF NOT EXISTS ix_event_definitions_key ON event_definitions (key);

CREATE TABLE IF NOT EXISTS event_choices (
  id SERIAL PRIMARY KEY,
  definition_id INTEGER NOT NULL REFERENCES event_definitions(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  effects_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS ix_event_choices_id ON event_choices (id);
CREATE INDEX IF NOT EXISTS ix_event_choices_definition_id ON event_choices (definition_id);

CREATE TABLE IF NOT EXISTS event_instances (
  id SERIAL PRIMARY KEY,
  game_profile_id INTEGER NOT NULL REFERENCES game_profiles(id) ON DELETE CASCADE,
  period_index INTEGER NOT NULL,
  definition_id INTEGER NOT NULL REFERENCES event_definitions(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  selected_choice_id INTEGER NULL REFERENCES event_choices(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
  resolved_at TIMESTAMP WITHOUT TIME ZONE NULL
);

CREATE INDEX IF NOT EXISTS ix_event_instances_id ON event_instances (id);
CREATE INDEX IF NOT EXISTS ix_event_instances_game_profile_id ON event_instances (game_profile_id);
CREATE INDEX IF NOT EXISTS ix_event_instances_period_index ON event_instances (period_index);
CREATE INDEX IF NOT EXISTS ix_event_instances_definition_id ON event_instances (definition_id);

-- =========================
-- 4) investments
-- =========================
CREATE TABLE IF NOT EXISTS investment_positions (
  id SERIAL PRIMARY KEY,
  game_profile_id INTEGER NOT NULL REFERENCES game_profiles(id) ON DELETE CASCADE,
  kind VARCHAR(30) NOT NULL,
  title VARCHAR(160) NOT NULL,
  principal DOUBLE PRECISION NOT NULL DEFAULT 0,
  annual_rate_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
  started_period INTEGER NOT NULL,
  last_accrued_period INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_investment_positions_id ON investment_positions (id);
CREATE INDEX IF NOT EXISTS ix_investment_positions_game_profile_id ON investment_positions (game_profile_id);

-- =========================
-- 5) insurance
-- =========================
CREATE TABLE IF NOT EXISTS insurance_policies (
  id SERIAL PRIMARY KEY,
  game_profile_id INTEGER NOT NULL REFERENCES game_profiles(id) ON DELETE CASCADE,
  kind VARCHAR(30) NOT NULL,
  title VARCHAR(160) NOT NULL,
  monthly_premium DOUBLE PRECISION NOT NULL DEFAULT 0,
  coverage_limit DOUBLE PRECISION NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_insurance_policies_id ON insurance_policies (id);
CREATE INDEX IF NOT EXISTS ix_insurance_policies_game_profile_id ON insurance_policies (game_profile_id);

