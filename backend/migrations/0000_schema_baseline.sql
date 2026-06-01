-- Schema baseline: ТВОЙ ХОД (PostgreSQL)
-- Generated: 2026-06-01 00:29:09 UTC
-- Source: SQLAlchemy models + concat migrations/*.sql
-- Regenerate: python scripts/dump_schema_baseline.py
-- Apply empty DB: .\migrate.ps1 -BaselineOnly
--
-- DDL only. Reference data: main.py seeds + data/events/mvp11 YAML sync.
--

-- === Core schema (SQLAlchemy models / create_all) ===

CREATE TABLE achievement_chains (
	id SERIAL NOT NULL, 
	chain_key VARCHAR(80) NOT NULL, 
	category VARCHAR(50) NOT NULL, 
	title VARCHAR(160) NOT NULL, 
	description TEXT NOT NULL, 
	max_tier INTEGER NOT NULL, 
	is_active INTEGER NOT NULL, 
	sort_order INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
)

;

CREATE TABLE asset_templates (
	id SERIAL NOT NULL, 
	template_key VARCHAR(80) NOT NULL, 
	title VARCHAR(160) NOT NULL, 
	kind VARCHAR(50) NOT NULL, 
	asset_value FLOAT NOT NULL, 
	monthly_maintenance_cost FLOAT NOT NULL, 
	monthly_income FLOAT NOT NULL, 
	estate_role VARCHAR(20) NOT NULL, 
	monthly_rent_cost FLOAT NOT NULL, 
	monthly_utilities_cost FLOAT NOT NULL, 
	income_yield_annual FLOAT, 
	has_tenants_default INTEGER NOT NULL, 
	is_active INTEGER NOT NULL, 
	sort_order INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
)

;

CREATE TABLE event_definitions (
	id SERIAL NOT NULL, 
	key VARCHAR(80) NOT NULL, 
	mode VARCHAR(20) NOT NULL, 
	title VARCHAR(160) NOT NULL, 
	description TEXT NOT NULL, 
	weight INTEGER NOT NULL, 
	is_active INTEGER NOT NULL, 
	mandatory INTEGER NOT NULL, 
	mandatory_gate VARCHAR(32) NOT NULL, 
	category VARCHAR(80), 
	metadata_json TEXT NOT NULL, 
	prerequisites_json TEXT NOT NULL, 
	event_tier INTEGER NOT NULL, 
	repeat_policy VARCHAR(32) NOT NULL, 
	repeat_max INTEGER, 
	cooldown_periods INTEGER NOT NULL, 
	content_class VARCHAR(32) NOT NULL, 
	event_slot VARCHAR(32) NOT NULL, 
	audience_template_keys TEXT NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
)

;

CREATE TABLE expense_category_definitions (
	category_key VARCHAR(40) NOT NULL, 
	title VARCHAR(120) NOT NULL, 
	default_tier VARCHAR(20) NOT NULL, 
	sort_order INTEGER NOT NULL, 
	icon_key VARCHAR(40), 
	is_active INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (category_key)
)

;

CREATE TABLE game_starter_templates (
	id SERIAL NOT NULL, 
	template_key VARCHAR(80) NOT NULL, 
	title VARCHAR(160) NOT NULL, 
	difficulty_rank INTEGER NOT NULL, 
	base_monthly_lifestyle_expense FLOAT NOT NULL, 
	blueprint_json TEXT NOT NULL, 
	victory_config_json TEXT NOT NULL, 
	is_active INTEGER NOT NULL, 
	sort_order INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	applies_to_save_kind VARCHAR(20) NOT NULL, 
	PRIMARY KEY (id)
)

;

CREATE TABLE liability_templates (
	id SERIAL NOT NULL, 
	template_key VARCHAR(80) NOT NULL, 
	title VARCHAR(160) NOT NULL, 
	total_debt FLOAT NOT NULL, 
	annual_rate_percent FLOAT NOT NULL, 
	is_active INTEGER NOT NULL, 
	sort_order INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
)

;

CREATE TABLE users (
	id SERIAL NOT NULL, 
	username VARCHAR(50) NOT NULL, 
	email VARCHAR(100), 
	hashed_password VARCHAR(200) NOT NULL, 
	full_name VARCHAR(100), 
	telegram_id INTEGER, 
	guidance_completed INTEGER NOT NULL, 
	guidance_progress_json TEXT NOT NULL, 
	guidance_completed_at TIMESTAMP WITHOUT TIME ZONE, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	UNIQUE (telegram_id)
)

;

CREATE TABLE achievement_tier_definitions (
	id SERIAL NOT NULL, 
	chain_key VARCHAR(80) NOT NULL, 
	tier_index INTEGER NOT NULL, 
	tier_key VARCHAR(80) NOT NULL, 
	title VARCHAR(160) NOT NULL, 
	description TEXT NOT NULL, 
	criteria_json TEXT NOT NULL, 
	xp_reward INTEGER NOT NULL, 
	sort_order INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_achievement_tier_chain_index UNIQUE (chain_key, tier_index), 
	FOREIGN KEY(chain_key) REFERENCES achievement_chains (chain_key)
)

;

CREATE TABLE api_idempotency_records (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	route_key VARCHAR(128) NOT NULL, 
	idempotency_key VARCHAR(128) NOT NULL, 
	status_code INTEGER NOT NULL, 
	response_json TEXT NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_idempotency_user_route_key UNIQUE (user_id, route_key, idempotency_key), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;

CREATE TABLE event_choices (
	id SERIAL NOT NULL, 
	definition_id INTEGER NOT NULL, 
	title VARCHAR(160) NOT NULL, 
	description TEXT NOT NULL, 
	effects_json TEXT NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(definition_id) REFERENCES event_definitions (id)
)

;

CREATE TABLE game_profiles (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	save_kind VARCHAR(16) NOT NULL, 
	starter_template_key VARCHAR(80), 
	starter_params_json TEXT NOT NULL, 
	base_monthly_lifestyle_expense FLOAT NOT NULL, 
	delta_monthly_lifestyle_expense FLOAT NOT NULL, 
	is_active INTEGER NOT NULL, 
	is_archived INTEGER NOT NULL, 
	league VARCHAR(50) NOT NULL, 
	streak INTEGER NOT NULL, 
	time_state VARCHAR(20) NOT NULL, 
	period_index INTEGER NOT NULL, 
	period_duration_seconds INTEGER NOT NULL, 
	period_anchor_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	base_params_locked INTEGER NOT NULL, 
	onboarding_state VARCHAR(30) NOT NULL, 
	onboarding_step VARCHAR(40) NOT NULL, 
	cash_balance FLOAT NOT NULL, 
	safety_fund_balance FLOAT NOT NULL, 
	negative_periods_count INTEGER NOT NULL, 
	last_period_salary_claimed INTEGER NOT NULL, 
	clean_period_streak INTEGER NOT NULL, 
	progression_milestones_awarded TEXT NOT NULL, 
	need_comfort FLOAT NOT NULL, 
	need_status FLOAT NOT NULL, 
	need_social FLOAT NOT NULL, 
	need_health FLOAT NOT NULL, 
	needs_zero_periods_streak INTEGER NOT NULL, 
	treat_self_last_period_index INTEGER NOT NULL, 
	salary_miss_streak INTEGER NOT NULL, 
	negative_close_streak INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;

CREATE TABLE game_starter_template_expense_allocations (
	id SERIAL NOT NULL, 
	template_key VARCHAR(80) NOT NULL, 
	category_key VARCHAR(64) NOT NULL, 
	weight FLOAT NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_gst_exp_alloc_cat UNIQUE (template_key, category_key), 
	FOREIGN KEY(template_key) REFERENCES game_starter_templates (template_key) ON DELETE CASCADE
)

;

CREATE TABLE event_instances (
	id SERIAL NOT NULL, 
	game_profile_id INTEGER NOT NULL, 
	period_index INTEGER NOT NULL, 
	definition_id INTEGER NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	selected_choice_id INTEGER, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	resolved_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(game_profile_id) REFERENCES game_profiles (id), 
	FOREIGN KEY(definition_id) REFERENCES event_definitions (id), 
	FOREIGN KEY(selected_choice_id) REFERENCES event_choices (id)
)

;

CREATE TABLE event_profile_counters (
	game_profile_id INTEGER NOT NULL, 
	definition_id INTEGER NOT NULL, 
	times_selected INTEGER NOT NULL, 
	last_selected_period_index INTEGER, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (game_profile_id, definition_id), 
	FOREIGN KEY(game_profile_id) REFERENCES game_profiles (id), 
	FOREIGN KEY(definition_id) REFERENCES event_definitions (id)
)

;

CREATE TABLE finance_assets (
	id SERIAL NOT NULL, 
	game_profile_id INTEGER NOT NULL, 
	title VARCHAR(120) NOT NULL, 
	kind VARCHAR(50) NOT NULL, 
	asset_value FLOAT NOT NULL, 
	monthly_maintenance_cost FLOAT NOT NULL, 
	monthly_income FLOAT NOT NULL, 
	has_tenants INTEGER NOT NULL, 
	is_active INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(game_profile_id) REFERENCES game_profiles (id)
)

;

CREATE TABLE finance_liabilities (
	id SERIAL NOT NULL, 
	game_profile_id INTEGER NOT NULL, 
	title VARCHAR(120) NOT NULL, 
	total_debt FLOAT NOT NULL, 
	annual_rate_percent FLOAT NOT NULL, 
	monthly_payment FLOAT NOT NULL, 
	overdue_amount FLOAT NOT NULL, 
	overdue_periods INTEGER NOT NULL, 
	is_active INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(game_profile_id) REFERENCES game_profiles (id)
)

;

CREATE TABLE finance_salaries (
	id SERIAL NOT NULL, 
	game_profile_id INTEGER NOT NULL, 
	monthly_amount FLOAT NOT NULL, 
	monthly_receipts_count INTEGER NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(game_profile_id) REFERENCES game_profiles (id)
)

;

CREATE TABLE insurance_policies (
	id SERIAL NOT NULL, 
	game_profile_id INTEGER NOT NULL, 
	product VARCHAR(30), 
	insured_object VARCHAR(30), 
	kind VARCHAR(40) NOT NULL, 
	title VARCHAR(160) NOT NULL, 
	monthly_premium FLOAT NOT NULL, 
	payout_amount FLOAT, 
	coverage_limit FLOAT NOT NULL, 
	term_periods INTEGER NOT NULL, 
	started_period_index INTEGER, 
	expires_period_index INTEGER, 
	claimed_period_index INTEGER, 
	is_active INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(game_profile_id) REFERENCES game_profiles (id)
)

;

CREATE TABLE investment_positions (
	id SERIAL NOT NULL, 
	game_profile_id INTEGER NOT NULL, 
	kind VARCHAR(30) NOT NULL, 
	title VARCHAR(160) NOT NULL, 
	principal FLOAT NOT NULL, 
	annual_rate_percent FLOAT NOT NULL, 
	started_period INTEGER NOT NULL, 
	last_accrued_period INTEGER NOT NULL, 
	is_active INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(game_profile_id) REFERENCES game_profiles (id)
)

;

CREATE TABLE notification_log (
	id SERIAL NOT NULL, 
	audience VARCHAR(16) NOT NULL, 
	kind VARCHAR(64) NOT NULL, 
	dedupe_key VARCHAR(160), 
	user_id INTEGER, 
	game_profile_id INTEGER, 
	payload_json TEXT NOT NULL, 
	telegram_sent INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(game_profile_id) REFERENCES game_profiles (id)
)

;

CREATE TABLE period_economy_closings (
	id SERIAL NOT NULL, 
	game_profile_id INTEGER NOT NULL, 
	period_index INTEGER NOT NULL, 
	cash_balance FLOAT NOT NULL, 
	safety_fund_balance FLOAT NOT NULL, 
	total_overdue_amount FLOAT NOT NULL, 
	monthly_burn_total FLOAT NOT NULL, 
	period_income_rate FLOAT NOT NULL, 
	period_expense_total FLOAT NOT NULL, 
	total_debt_balance FLOAT NOT NULL, 
	closed_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_period_economy_closing_pi UNIQUE (game_profile_id, period_index), 
	FOREIGN KEY(game_profile_id) REFERENCES game_profiles (id)
)

;

CREATE TABLE period_snapshots (
	id SERIAL NOT NULL, 
	game_profile_id INTEGER NOT NULL, 
	period_index INTEGER NOT NULL, 
	salary_claimed INTEGER NOT NULL, 
	salary_amount FLOAT NOT NULL, 
	safety_fund_contribution FLOAT NOT NULL, 
	safety_fund_total FLOAT NOT NULL, 
	total_expenses FLOAT NOT NULL, 
	is_completed INTEGER NOT NULL, 
	completed_at TIMESTAMP WITHOUT TIME ZONE, 
	net_savings FLOAT NOT NULL, 
	xp_earned INTEGER NOT NULL, 
	safety_contribute_xp_grants INTEGER NOT NULL, 
	safety_withdraw_xp_grants INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(game_profile_id) REFERENCES game_profiles (id)
)

;

CREATE TABLE profile_achievement_unlocks (
	game_profile_id INTEGER NOT NULL, 
	tier_definition_id INTEGER NOT NULL, 
	unlocked_at TIMESTAMP WITHOUT TIME ZONE, 
	period_index INTEGER NOT NULL, 
	PRIMARY KEY (game_profile_id, tier_definition_id), 
	FOREIGN KEY(game_profile_id) REFERENCES game_profiles (id), 
	FOREIGN KEY(tier_definition_id) REFERENCES achievement_tier_definitions (id)
)

;

CREATE TABLE profile_expense_lines (
	id SERIAL NOT NULL, 
	game_profile_id INTEGER NOT NULL, 
	category_key VARCHAR(40) NOT NULL, 
	amount_monthly FLOAT NOT NULL, 
	title_override VARCHAR(160), 
	source_kind VARCHAR(20) NOT NULL, 
	source_ref VARCHAR(120), 
	tier VARCHAR(20) NOT NULL, 
	created_period_index INTEGER NOT NULL, 
	expires_period_index INTEGER, 
	revoked_at TIMESTAMP WITHOUT TIME ZONE, 
	is_active INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(game_profile_id) REFERENCES game_profiles (id), 
	FOREIGN KEY(category_key) REFERENCES expense_category_definitions (category_key)
)

;

CREATE TABLE transactions (
	id SERIAL NOT NULL, 
	game_profile_id INTEGER NOT NULL, 
	amount FLOAT NOT NULL, 
	type VARCHAR(50) NOT NULL, 
	description TEXT, 
	period_index INTEGER NOT NULL, 
	timestamp TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(game_profile_id) REFERENCES game_profiles (id)
)

;

CREATE TABLE event_profile_chains (
	id SERIAL NOT NULL, 
	game_profile_id INTEGER NOT NULL, 
	chain_key VARCHAR(80) NOT NULL, 
	status VARCHAR(24) NOT NULL, 
	followup_definition_key VARCHAR(80) NOT NULL, 
	after_periods INTEGER NOT NULL, 
	due_period_index INTEGER NOT NULL, 
	context_json TEXT NOT NULL, 
	surfaced_instance_id INTEGER, 
	created_period_index INTEGER NOT NULL, 
	completed_period_index INTEGER, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(game_profile_id) REFERENCES game_profiles (id), 
	FOREIGN KEY(surfaced_instance_id) REFERENCES event_instances (id)
)

;
CREATE INDEX ix_achievement_chains_id ON achievement_chains (id);
CREATE UNIQUE INDEX ix_achievement_chains_chain_key ON achievement_chains (chain_key);
CREATE UNIQUE INDEX ix_asset_templates_template_key ON asset_templates (template_key);
CREATE INDEX ix_asset_templates_id ON asset_templates (id);
CREATE UNIQUE INDEX ix_event_definitions_key ON event_definitions (key);
CREATE INDEX ix_event_definitions_id ON event_definitions (id);
CREATE UNIQUE INDEX ix_game_starter_templates_template_key ON game_starter_templates (template_key);
CREATE INDEX ix_game_starter_templates_id ON game_starter_templates (id);
CREATE INDEX ix_liability_templates_id ON liability_templates (id);
CREATE UNIQUE INDEX ix_liability_templates_template_key ON liability_templates (template_key);
CREATE UNIQUE INDEX ix_users_username ON users (username);
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE INDEX ix_users_id ON users (id);
CREATE UNIQUE INDEX ix_achievement_tier_definitions_tier_key ON achievement_tier_definitions (tier_key);
CREATE INDEX ix_achievement_tier_definitions_id ON achievement_tier_definitions (id);
CREATE INDEX ix_achievement_tier_definitions_chain_key ON achievement_tier_definitions (chain_key);
CREATE INDEX ix_api_idempotency_records_user_id ON api_idempotency_records (user_id);
CREATE INDEX ix_api_idempotency_records_id ON api_idempotency_records (id);
CREATE INDEX ix_event_choices_definition_id ON event_choices (definition_id);
CREATE INDEX ix_event_choices_id ON event_choices (id);
CREATE INDEX ix_game_profiles_user_id ON game_profiles (user_id);
CREATE INDEX ix_game_profiles_id ON game_profiles (id);
CREATE INDEX ix_game_starter_template_expense_allocations_id ON game_starter_template_expense_allocations (id);
CREATE INDEX ix_game_starter_template_expense_allocations_template_key ON game_starter_template_expense_allocations (template_key);
CREATE INDEX ix_event_instances_game_profile_id ON event_instances (game_profile_id);
CREATE INDEX ix_event_instances_definition_id ON event_instances (definition_id);
CREATE INDEX ix_event_instances_id ON event_instances (id);
CREATE INDEX ix_event_instances_period_index ON event_instances (period_index);
CREATE INDEX ix_finance_assets_game_profile_id ON finance_assets (game_profile_id);
CREATE INDEX ix_finance_assets_id ON finance_assets (id);
CREATE INDEX ix_finance_liabilities_game_profile_id ON finance_liabilities (game_profile_id);
CREATE INDEX ix_finance_liabilities_id ON finance_liabilities (id);
CREATE INDEX ix_finance_salaries_id ON finance_salaries (id);
CREATE UNIQUE INDEX ix_finance_salaries_game_profile_id ON finance_salaries (game_profile_id);
CREATE INDEX ix_insurance_policies_id ON insurance_policies (id);
CREATE INDEX ix_insurance_policies_game_profile_id ON insurance_policies (game_profile_id);
CREATE INDEX ix_investment_positions_game_profile_id ON investment_positions (game_profile_id);
CREATE INDEX ix_investment_positions_id ON investment_positions (id);
CREATE UNIQUE INDEX ix_notification_log_dedupe_key ON notification_log (dedupe_key);
CREATE INDEX ix_notification_log_user_id ON notification_log (user_id);
CREATE INDEX ix_notification_log_audience ON notification_log (audience);
CREATE INDEX ix_notification_log_kind ON notification_log (kind);
CREATE INDEX ix_notification_log_game_profile_id ON notification_log (game_profile_id);
CREATE INDEX ix_notification_log_id ON notification_log (id);
CREATE INDEX ix_notification_log_created_at ON notification_log (created_at);
CREATE INDEX ix_period_economy_closings_id ON period_economy_closings (id);
CREATE INDEX ix_period_economy_closings_game_profile_id ON period_economy_closings (game_profile_id);
CREATE INDEX ix_period_snapshots_id ON period_snapshots (id);
CREATE INDEX ix_period_snapshots_game_profile_id ON period_snapshots (game_profile_id);
CREATE INDEX ix_profile_expense_lines_game_profile_id ON profile_expense_lines (game_profile_id);
CREATE INDEX ix_profile_expense_lines_id ON profile_expense_lines (id);
CREATE INDEX ix_transactions_id ON transactions (id);
CREATE INDEX ix_transactions_game_profile_id ON transactions (game_profile_id);
CREATE INDEX ix_event_profile_chains_id ON event_profile_chains (id);
CREATE INDEX ix_event_profile_chains_chain_key ON event_profile_chains (chain_key);
CREATE INDEX ix_event_profile_chains_game_profile_id ON event_profile_chains (game_profile_id);
CREATE INDEX ix_event_profile_chains_due_period_index ON event_profile_chains (due_period_index);

-- === Incremental migrations (idempotent ALTER/seed) ===
-- >>> 0002_easy_mechanics.sql
﻿-- Idempotent migration for ТВОЙ ХОД / tvoy-hod (PostgreSQL)
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

-- >>> 0003_asset_liability_templates_events.sql
-- Idempotent migration: templates for assets/liabilities + расширение событий
-- PostgreSQL.

-- ---------- asset_templates ----------
CREATE TABLE IF NOT EXISTS asset_templates (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(80) UNIQUE NOT NULL,
  title VARCHAR(160) NOT NULL,
  kind VARCHAR(50) NOT NULL DEFAULT 'generic',
  asset_value DOUBLE PRECISION NOT NULL,
  monthly_maintenance_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
  monthly_income DOUBLE PRECISION NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_asset_templates_key ON asset_templates (template_key);
CREATE INDEX IF NOT EXISTS ix_asset_templates_active ON asset_templates (is_active);

INSERT INTO asset_templates (template_key, title, kind, asset_value, monthly_maintenance_cost, monthly_income, is_active, sort_order)
VALUES
  ('home', 'Жилая квартира', 'home', 4500000, 6000, 0, 1, 10),
  ('rental_home', 'Доходная квартира (аренда)', 'rental_home', 5200000, 7000, 35000, 1, 20),
  ('car_personal', 'Личная машина', 'car_personal', 1200000, 12000, 0, 1, 30),
  ('car_taxi', 'Машина для такси (аренда)', 'car_taxi', 1500000, 18000, 45000, 1, 40)
ON CONFLICT (template_key) DO NOTHING;

-- ---------- liability_templates ----------
CREATE TABLE IF NOT EXISTS liability_templates (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(80) UNIQUE NOT NULL,
  title VARCHAR(160) NOT NULL,
  total_debt DOUBLE PRECISION NOT NULL,
  annual_rate_percent DOUBLE PRECISION NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_liability_templates_key ON liability_templates (template_key);
CREATE INDEX IF NOT EXISTS ix_liability_templates_active ON liability_templates (is_active);

INSERT INTO liability_templates (template_key, title, total_debt, annual_rate_percent, is_active, sort_order)
VALUES
  ('mortgage', 'Ипотека', 3500000, 9, 1, 10),
  ('car_loan', 'Автокредит', 850000, 14, 1, 20),
  ('consumer', 'Потребительский кредит', 400000, 18, 1, 30),
  ('credit_card', 'Кредитная карта', 150000, 22, 1, 40)
ON CONFLICT (template_key) DO NOTHING;

-- ---------- event_definitions: поля под будущие сценарии ----------
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS mandatory INTEGER NOT NULL DEFAULT 0;
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS category VARCHAR(80);
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS metadata_json TEXT NOT NULL DEFAULT '{}';

-- Одна библиотека сценариев для всех режимов игры (выборка фильтруется по mode в коде)
UPDATE event_definitions SET mode = 'any' WHERE mode = 'light';

-- Пересчёт ежемесячных платежей как тело × (ставка%/100) / 12 для уже существующих обязательств
UPDATE finance_liabilities
SET monthly_payment = (
  ROUND(
    (CAST(total_debt AS NUMERIC) * CAST(annual_rate_percent AS NUMERIC) / 100 / 12),
    2
  )
)::double precision;

-- >>> 0004_save_kind_game_templates.sql
-- G1 / ADR-001: save_kind на профиле, таблица шаблонов старта Game, семантика event_definitions.mode → game|plan|any

-- Таблица шаблонов (идемпотентно)
CREATE TABLE IF NOT EXISTS game_starter_templates (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  difficulty_rank INTEGER NOT NULL DEFAULT 1,
  base_monthly_lifestyle_expense DOUBLE PRECISION NOT NULL DEFAULT 0,
  blueprint_json TEXT NOT NULL DEFAULT '{}',
  victory_config_json TEXT NOT NULL DEFAULT '{}',
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Профиль: новые поля (PostgreSQL — без IF NOT EXISTS для ADD COLUMN; при необходимости выполнять выборочно)
ALTER TABLE game_profiles ADD COLUMN IF NOT EXISTS save_kind VARCHAR(16) NOT NULL DEFAULT 'game';
ALTER TABLE game_profiles ADD COLUMN IF NOT EXISTS starter_template_key VARCHAR(80);
ALTER TABLE game_profiles ADD COLUMN IF NOT EXISTS starter_params_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE game_profiles ADD COLUMN IF NOT EXISTS base_monthly_lifestyle_expense DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE game_profiles ADD COLUMN IF NOT EXISTS delta_monthly_lifestyle_expense DOUBLE PRECISION NOT NULL DEFAULT 0;

-- После появления save_kind убираем legacy mode у профиля
ALTER TABLE game_profiles DROP COLUMN IF EXISTS mode;

-- Каталог событий: light/hardcore → game (совместимо с фильтром по save_kind профиля)
UPDATE event_definitions SET mode = 'game' WHERE mode IN ('light', 'hardcore');

-- Базовый шаблон (как в backend/main.py ensure_schema_compatibility)
INSERT INTO game_starter_templates
  (template_key, title, difficulty_rank, base_monthly_lifestyle_expense,
   blueprint_json, victory_config_json, is_active, sort_order)
VALUES
  (
    'mq_game_basic_v1',
    'Базовый старт',
    1,
    12000,
    '{"period_duration_seconds":300,"cash_balance":8000,"monthly_salary":45000,"assets":[],"liabilities":[]}',
    '{}',
    1,
    10
  )
ON CONFLICT (template_key) DO NOTHING;

-- >>> 0005_game_templates_catalog.sql
-- Расширение каталога стартов Game (новые ключи; mq_game_basic_v1 уже мог быть из 0004 / сидера приложения).

INSERT INTO game_starter_templates
  (template_key, title, difficulty_rank, base_monthly_lifestyle_expense,
   blueprint_json, victory_config_json, is_active, sort_order)
VALUES
  (
    'mq_game_tight_budget_v1',
    'Зарплата до зарплаты',
    2,
    14800,
    $bp2$
{"description":"Мало наличных на старте, потребительский кредит и авто с обслуживанием.","period_duration_seconds":300,"cash_balance":9000,"monthly_salary":45000,"assets":[{"title":"Авто","kind":"vehicle","asset_value":210000,"monthly_maintenance_cost":3000,"monthly_income":0}],"liabilities":[{"title":"Потребительский кредит","total_debt":240000,"annual_rate_percent":19}]}
$bp2$,
    '{}',
    1,
    20
  ),
  (
    'mq_game_mortgage_stress_v1',
    'Ипотека под давлением',
    3,
    17100,
    $bp3$
{"description":"Высокий ипотечный платёж и машина: ошибки по кэшу быстро ощущаются.","period_duration_seconds":300,"cash_balance":6500,"monthly_salary":46500,"assets":[{"title":"Авто","kind":"vehicle","asset_value":260000,"monthly_maintenance_cost":4000,"monthly_income":0}],"liabilities":[{"title":"Ипотека","total_debt":690000,"annual_rate_percent":13.5}]}
$bp3$,
    '{}',
    1,
    30
  ),
  (
    'mq_game_debt_stack_v1',
    'Красная зона',
    4,
    19600,
    $bp4$
{"description":"Два долга, «жизнь» дороже и почти пустой счёт — для опытных игроков.","period_duration_seconds":300,"cash_balance":4500,"monthly_salary":43500,"assets":[{"title":"Подержанное авто","kind":"vehicle","asset_value":145000,"monthly_maintenance_cost":2900,"monthly_income":0}],"liabilities":[{"title":"Ипотека","total_debt":520000,"annual_rate_percent":14},{"title":"Кредитная карта","total_debt":110000,"annual_rate_percent":24}]}
$bp4$,
    '{}',
    1,
    40
  )
ON CONFLICT (template_key) DO NOTHING;

-- >>> 0006_event_tiers_repeat_policy.sql
-- MVP 1.1: event_tier, repeat_policy на event_definitions (PostgreSQL, идемпотентно)

ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS event_tier INTEGER NOT NULL DEFAULT 1;
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS repeat_policy VARCHAR(32) NOT NULL DEFAULT 'repeatable';

-- >>> 0007_event_profile_counters.sql
-- MVP: cooldown, repeat_max, mandatory_gate, счётчики событий на профиль (PostgreSQL, идемпотентно)

-- ---- event_definitions: поля отбора и гейтов ----
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS cooldown_periods INTEGER NOT NULL DEFAULT 0;
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS repeat_max INTEGER NULL;
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS mandatory_gate VARCHAR(32) NOT NULL DEFAULT 'none';
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS prerequisites_json TEXT NOT NULL DEFAULT '{}';

-- legacy mandatory (0/1) → mandatory_gate при первом прогоне
UPDATE event_definitions
SET mandatory_gate = 'blocks_period_end'
WHERE mandatory = 1 AND mandatory_gate = 'none';

CREATE INDEX IF NOT EXISTS ix_event_definitions_mode_active_tier
  ON event_definitions (mode, is_active, event_tier);

-- ---- счётчики выбора событий по профилю ----
CREATE TABLE IF NOT EXISTS event_profile_counters (
  game_profile_id INTEGER NOT NULL REFERENCES game_profiles(id) ON DELETE CASCADE,
  definition_id INTEGER NOT NULL REFERENCES event_definitions(id) ON DELETE CASCADE,
  times_selected INTEGER NOT NULL DEFAULT 0,
  last_selected_period_index INTEGER NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
  PRIMARY KEY (game_profile_id, definition_id)
);

CREATE INDEX IF NOT EXISTS ix_event_profile_counters_profile
  ON event_profile_counters (game_profile_id);

-- бэкфилл из уже выбранных инстансов
INSERT INTO event_profile_counters (game_profile_id, definition_id, times_selected, last_selected_period_index)
SELECT
  ei.game_profile_id,
  ei.definition_id,
  COUNT(*)::INTEGER,
  MAX(ei.period_index)::INTEGER
FROM event_instances ei
WHERE ei.status = 'selected'
GROUP BY ei.game_profile_id, ei.definition_id
ON CONFLICT (game_profile_id, definition_id) DO UPDATE SET
  times_selected = GREATEST(event_profile_counters.times_selected, EXCLUDED.times_selected),
  last_selected_period_index = GREATEST(
    COALESCE(event_profile_counters.last_selected_period_index, 0),
    COALESCE(EXCLUDED.last_selected_period_index, 0)
  );

-- >>> 0008_drop_legacy_user_finance.sql
-- Удаление legacy-слоя финансов и демо-сообщений на users (игра живёт в game_profiles + finance_*).

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS salary_profiles CASCADE;
DROP TABLE IF EXISTS liabilities CASCADE;
DROP TABLE IF EXISTS assets CASCADE;

-- >>> 0008_insurance_product_object.sql
-- Страховки: продукт + объект, сумма выплаты, срок, статус выплаты.
-- Механика: при страховом случае — полная payout_amount на счёт, полис деактивируется (claimed_period_index).

ALTER TABLE IF EXISTS insurance_policies
  ADD COLUMN IF NOT EXISTS product VARCHAR(30);

ALTER TABLE IF EXISTS insurance_policies
  ADD COLUMN IF NOT EXISTS insured_object VARCHAR(30);

ALTER TABLE IF EXISTS insurance_policies
  ADD COLUMN IF NOT EXISTS payout_amount DOUBLE PRECISION;

ALTER TABLE IF EXISTS insurance_policies
  ADD COLUMN IF NOT EXISTS term_periods INTEGER NOT NULL DEFAULT 12;

ALTER TABLE IF EXISTS insurance_policies
  ADD COLUMN IF NOT EXISTS started_period_index INTEGER;

ALTER TABLE IF EXISTS insurance_policies
  ADD COLUMN IF NOT EXISTS expires_period_index INTEGER;

ALTER TABLE IF EXISTS insurance_policies
  ADD COLUMN IF NOT EXISTS claimed_period_index INTEGER;

-- payout из legacy coverage_limit
UPDATE insurance_policies
SET payout_amount = coverage_limit
WHERE payout_amount IS NULL AND coverage_limit IS NOT NULL;

-- product / object из legacy kind
UPDATE insurance_policies
SET product = 'health', insured_object = 'life', kind = 'health_life'
WHERE (product IS NULL OR product = '') AND kind = 'health';

UPDATE insurance_policies
SET product = 'property', insured_object = 'property', kind = 'property_property'
WHERE (product IS NULL OR product = '') AND kind = 'property';

UPDATE insurance_policies
SET product = 'auto', insured_object = 'property', kind = 'auto_property'
WHERE (product IS NULL OR product = '') AND kind = 'car';

-- kind = product_object для уже заполненных пар
UPDATE insurance_policies
SET kind = product || '_' || insured_object
WHERE product IS NOT NULL AND product <> '' AND insured_object IS NOT NULL AND insured_object <> ''
  AND (kind IS NULL OR kind = '' OR kind IN ('health', 'property', 'car'));

-- срок: если не задан — 12 периодов с момента создания (оценка started = 1)
UPDATE insurance_policies
SET term_periods = 12
WHERE term_periods IS NULL OR term_periods <= 0;

UPDATE insurance_policies
SET started_period_index = 1
WHERE started_period_index IS NULL;

UPDATE insurance_policies
SET expires_period_index = started_period_index + term_periods
WHERE expires_period_index IS NULL AND started_period_index IS NOT NULL;

-- >>> 0009_achievement_chains.sql
-- Достижения: цепочки (chain) + ступени (tier) + разблокировки на game_profile.

CREATE TABLE IF NOT EXISTS achievement_chains (
  id SERIAL PRIMARY KEY,
  chain_key VARCHAR(80) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  max_tier INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_achievement_chains_active
  ON achievement_chains (is_active, sort_order);

CREATE TABLE IF NOT EXISTS achievement_tier_definitions (
  id SERIAL PRIMARY KEY,
  chain_key VARCHAR(80) NOT NULL REFERENCES achievement_chains(chain_key) ON DELETE CASCADE,
  tier_index INTEGER NOT NULL,
  tier_key VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  criteria_json TEXT NOT NULL DEFAULT '{}',
  xp_reward INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 100,
  CONSTRAINT uq_achievement_tier_chain_index UNIQUE (chain_key, tier_index)
);

CREATE INDEX IF NOT EXISTS ix_achievement_tier_chain
  ON achievement_tier_definitions (chain_key, tier_index);

CREATE TABLE IF NOT EXISTS profile_achievement_unlocks (
  game_profile_id INTEGER NOT NULL REFERENCES game_profiles(id) ON DELETE CASCADE,
  tier_definition_id INTEGER NOT NULL REFERENCES achievement_tier_definitions(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
  period_index INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (game_profile_id, tier_definition_id)
);

CREATE INDEX IF NOT EXISTS ix_profile_achievement_unlocks_profile
  ON profile_achievement_unlocks (game_profile_id);

-- >>> 0010_victory_config_seeds.sql
-- Victory v2: заполнение victory_config_json для всех Game-шаблонов (идемпотентно).

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version":1,"min_period_index_for_victory":7,"required_goals_met":3,"goals":[{"key":"safety_3x","type":"safety_fund_months","title":"Подушка ≥ 3× обязательств","months_multiplier":3,"required":false,"enabled":true},{"key":"no_overdue","type":"no_overdue","title":"Нет просрочки","required":false,"enabled":true},{"key":"flow_nonneg","type":"net_monthly_cashflow_nonneg","title":"Неотрицательный месячный поток","required":false,"enabled":true}]}'
WHERE template_key = 'mq_game_basic_v1';

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version":1,"min_period_index_for_victory":7,"required_goals_met":3,"goals":[{"key":"safety_6x","type":"safety_fund_months","title":"Подушка ≥ 6× обязательств","months_multiplier":6,"required":false,"enabled":true},{"key":"no_overdue","type":"no_overdue","title":"Нет просрочки","required":false,"enabled":true},{"key":"avg_liquid_6p","type":"avg_liquid_delta_6p","title":"Средний прирост ликвидности за 6 периодов","window":6,"min_samples":3,"salary_multiplier":5,"required":false,"enabled":true},{"key":"level_5","type":"character_level","title":"Уровень персонажа ≥ 5","min_level":5,"required":false,"enabled":true},{"key":"cash_floor","type":"cash_balance_min","title":"Наличные ≥ 12 000","min_cash":12000,"required":false,"enabled":true}]}'
WHERE template_key = 'mq_game_tight_budget_v1';

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version":1,"min_period_index_for_victory":7,"required_goals_met":3,"goals":[{"key":"safety_6x","type":"safety_fund_months","title":"Подушка ≥ 6× обязательств","months_multiplier":6,"required":false,"enabled":true},{"key":"no_overdue","type":"no_overdue","title":"Нет просрочки","required":false,"enabled":true},{"key":"avg_liquid_6p","type":"avg_liquid_delta_6p","title":"Средний прирост ликвидности за 6 периодов","window":6,"min_samples":3,"salary_multiplier":5,"required":false,"enabled":true},{"key":"level_5","type":"character_level","title":"Уровень персонажа ≥ 5","min_level":5,"required":false,"enabled":true},{"key":"cash_floor","type":"cash_balance_min","title":"Наличные ≥ 15 000","min_cash":15000,"required":false,"enabled":true}]}'
WHERE template_key = 'mq_game_mortgage_stress_v1';

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version":1,"min_period_index_for_victory":7,"required_goals_met":3,"goals":[{"key":"safety_6x","type":"safety_fund_months","title":"Подушка ≥ 6× обязательств","months_multiplier":6,"required":false,"enabled":true},{"key":"no_overdue","type":"no_overdue","title":"Нет просрочки","required":false,"enabled":true},{"key":"avg_liquid_6p","type":"avg_liquid_delta_6p","title":"Средний прирост ликвидности за 6 периодов","window":6,"min_samples":3,"salary_multiplier":5,"required":false,"enabled":true},{"key":"level_5","type":"character_level","title":"Уровень персонажа ≥ 5","min_level":5,"required":false,"enabled":true},{"key":"cash_floor","type":"cash_balance_min","title":"Наличные ≥ 18 000","min_cash":18000,"required":false,"enabled":true}]}'
WHERE template_key = 'mq_game_debt_stack_v1';

-- >>> 0011_api_idempotency.sql
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

-- >>> 0012_notification_log.sql
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

-- >>> 0013_profile_expense_lines.sql
-- E1: каталог категорий расходов + статьи бюджета на профиле
-- Идемпотентно: таблица могла быть создана через SQLAlchemy create_all без DEFAULT на is_active.

CREATE TABLE IF NOT EXISTS expense_category_definitions (
  category_key VARCHAR(40) NOT NULL PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  default_tier VARCHAR(20) NOT NULL DEFAULT 'must',
  sort_order INTEGER NOT NULL DEFAULT 100,
  icon_key VARCHAR(40),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

-- Догоняем схему, если таблица уже была без DEFAULT / created_at
ALTER TABLE expense_category_definitions
  ADD COLUMN IF NOT EXISTS is_active INTEGER;

ALTER TABLE expense_category_definitions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc');

UPDATE expense_category_definitions SET is_active = 1 WHERE is_active IS NULL;

ALTER TABLE expense_category_definitions
  ALTER COLUMN is_active SET DEFAULT 1;

ALTER TABLE expense_category_definitions
  ALTER COLUMN is_active SET NOT NULL;

INSERT INTO expense_category_definitions (
  category_key, title, default_tier, sort_order, icon_key, is_active
)
VALUES
  ('housing', 'Жильё', 'must', 10, 'housing', 1),
  ('food', 'Еда', 'must', 20, 'food', 1),
  ('transport', 'Транспорт', 'must', 30, 'transport', 1),
  ('health', 'Здоровье', 'must', 40, 'health', 1),
  ('clothing', 'Одежда и быт', 'must', 50, 'clothing', 1),
  ('communications', 'Связь и подписки', 'must', 60, 'communications', 1),
  ('leisure', 'Досуг', 'discretionary', 70, 'leisure', 1),
  ('other', 'Прочее', 'discretionary', 80, 'other', 1)
ON CONFLICT (category_key) DO UPDATE SET
  title = EXCLUDED.title,
  default_tier = EXCLUDED.default_tier,
  sort_order = EXCLUDED.sort_order,
  icon_key = EXCLUDED.icon_key,
  is_active = EXCLUDED.is_active;

CREATE TABLE IF NOT EXISTS profile_expense_lines (
  id SERIAL PRIMARY KEY,
  game_profile_id INTEGER NOT NULL REFERENCES game_profiles(id) ON DELETE CASCADE,
  category_key VARCHAR(40) NOT NULL REFERENCES expense_category_definitions(category_key),
  amount_monthly DOUBLE PRECISION NOT NULL DEFAULT 0,
  title_override VARCHAR(160),
  source_kind VARCHAR(20) NOT NULL DEFAULT 'template',
  source_ref VARCHAR(120),
  tier VARCHAR(20) NOT NULL DEFAULT 'must',
  created_period_index INTEGER NOT NULL DEFAULT 1,
  expires_period_index INTEGER,
  revoked_at TIMESTAMP WITHOUT TIME ZONE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS ix_profile_expense_lines_profile_active
  ON profile_expense_lines (game_profile_id, is_active);

-- >>> 0014_period_closing_burn.sql
-- E1-C: burn на закрытии периода для аналитики

ALTER TABLE period_economy_closings
  ADD COLUMN IF NOT EXISTS monthly_burn_total DOUBLE PRECISION NOT NULL DEFAULT 0;

-- >>> 0015_plan_starter_templates_allocations.sql
-- E1 / Plan: шаблоны старта с одной суммой «жизни» и весами по категориям в дочерней таблице.

ALTER TABLE game_starter_templates
  ADD COLUMN IF NOT EXISTS applies_to_save_kind VARCHAR(20) NOT NULL DEFAULT 'game';

UPDATE game_starter_templates SET applies_to_save_kind = 'game' WHERE applies_to_save_kind IS NULL;

CREATE TABLE IF NOT EXISTS game_starter_template_expense_allocations (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(80) NOT NULL REFERENCES game_starter_templates (template_key) ON DELETE CASCADE,
  category_key VARCHAR(64) NOT NULL,
  weight DOUBLE PRECISION NOT NULL CHECK (weight >= 0),
  UNIQUE (template_key, category_key)
);

CREATE INDEX IF NOT EXISTS idx_gst_exp_alloc_template
  ON game_starter_template_expense_allocations (template_key);

-- Плановые шаблоны: итог burn хранится в base_monthly_lifestyle_expense; статьи = веса × итог.
INSERT INTO game_starter_templates
  (template_key, title, difficulty_rank, base_monthly_lifestyle_expense,
   blueprint_json, victory_config_json, is_active, sort_order, applies_to_save_kind)
VALUES
  (
    'mq_plan_balanced_v1',
    'План: сбалансированный',
    2,
    32000,
    '{"description":"Типичный городской бюджет без игровых долгов и событий.","period_duration_seconds":300,"cash_balance":180000,"monthly_salary":95000,"assets":[],"liabilities":[]}',
    '{}',
    1,
    15,
    'plan'
  ),
  (
    'mq_plan_minimal_v1',
    'План: экономный',
    1,
    18000,
    '{"description":"Низкий burn — для отслеживания жёсткой экономии.","period_duration_seconds":300,"cash_balance":90000,"monthly_salary":55000,"assets":[],"liabilities":[]}',
    '{}',
    1,
    25,
    'plan'
  )
ON CONFLICT (template_key) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty_rank = EXCLUDED.difficulty_rank,
  base_monthly_lifestyle_expense = EXCLUDED.base_monthly_lifestyle_expense,
  blueprint_json = EXCLUDED.blueprint_json,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  applies_to_save_kind = EXCLUDED.applies_to_save_kind;

-- Веса (сумма = 1.0) — те же доли, что _DEFAULT_SHARES в Python; суммы по категориям получаются умножением на base_monthly.
INSERT INTO game_starter_template_expense_allocations (template_key, category_key, weight) VALUES
  ('mq_plan_balanced_v1', 'housing', 0.14),
  ('mq_plan_balanced_v1', 'food', 0.38),
  ('mq_plan_balanced_v1', 'transport', 0.12),
  ('mq_plan_balanced_v1', 'health', 0.09),
  ('mq_plan_balanced_v1', 'clothing', 0.07),
  ('mq_plan_balanced_v1', 'communications', 0.08),
  ('mq_plan_balanced_v1', 'leisure', 0.12),
  ('mq_plan_balanced_v1', 'other', 0.00),
  ('mq_plan_minimal_v1', 'housing', 0.14),
  ('mq_plan_minimal_v1', 'food', 0.38),
  ('mq_plan_minimal_v1', 'transport', 0.12),
  ('mq_plan_minimal_v1', 'health', 0.09),
  ('mq_plan_minimal_v1', 'clothing', 0.07),
  ('mq_plan_minimal_v1', 'communications', 0.08),
  ('mq_plan_minimal_v1', 'leisure', 0.12),
  ('mq_plan_minimal_v1', 'other', 0.00)
ON CONFLICT (template_key, category_key) DO NOTHING;

-- >>> 0016_progression_xp_v2.sql
-- XP v2: milestone на профиле, счётчики XP за действия подушки в снимке периода.

ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS progression_milestones_awarded TEXT NOT NULL DEFAULT '[]';

ALTER TABLE period_snapshots
  ADD COLUMN IF NOT EXISTS safety_contribute_xp_grants INTEGER NOT NULL DEFAULT 0;

ALTER TABLE period_snapshots
  ADD COLUMN IF NOT EXISTS safety_withdraw_xp_grants INTEGER NOT NULL DEFAULT 0;

-- >>> 0017_onboarding_step.sql
-- Guided onboarding: шаг coach на профиле
ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS onboarding_step VARCHAR(40) NOT NULL DEFAULT 'period_timer';

UPDATE game_profiles
SET onboarding_state = 'draft'
WHERE onboarding_state = 'started';

-- >>> 0018_event_prerequisites_and_dtp_choices.sql
-- Привязка событий к активам/долгам; ужесточение сценариев ДТП и затопления (PostgreSQL, идемпотентно)

UPDATE event_definitions
SET prerequisites_json = '{"active_asset_kinds_any":["car_personal","car_taxi"]}',
    mandatory_gate = 'blocks_period_end',
    description = 'Столкновение на вашей машине. Нужно решить, как закрыть ущерб: через ОСАГО или за свой счёт — уйти без последствий не получится.'
WHERE key = 'mq11_car_accident';

UPDATE event_definitions
SET prerequisites_json = '{"active_asset_kinds_any":["home","rental_home"]}',
    mandatory_gate = 'blocks_period_end',
    description = 'Прорвало трубу — пострадало ваше жильё. Нужно восстановить квартиру: через страховку имущества или полностью за свой счёт.'
WHERE key = 'mq11_home_water_damage';

UPDATE event_definitions
SET prerequisites_json = '{"min_active_liabilities":1}'
WHERE key = 'mq11_refinance_bank';

-- Удалить устаревший «бесплатный» третий выбор у ДТП и затопления (по заголовку)
DELETE FROM event_choices ec
USING event_definitions ed
WHERE ec.definition_id = ed.id
  AND ed.key = 'mq11_car_accident'
  AND ec.title = 'Договориться без оформления';

DELETE FROM event_choices ec
USING event_definitions ed
WHERE ec.definition_id = ed.id
  AND ed.key = 'mq11_home_water_damage'
  AND ec.title = 'Косметический ремонт (−25 000 ₽)';

-- >>> 0019_event_realism_and_impacts.sql
-- Реалистичные исходы событий, релокация +28% burn, травма ноги (PostgreSQL, идемпотентно)

INSERT INTO event_definitions (
  key, mode, title, description, weight, is_active, event_tier, repeat_policy, cooldown_periods, mandatory_gate, prerequisites_json
)
SELECT
  'mq11_sprain_leg',
  'any',
  'Травма: ушибили ногу',
  'Сильный ушиб после падения. Без лечения ходить больно — отложить визит к врачу нельзя.',
  72,
  1,
  2,
  'repeatable',
  4,
  'blocks_period_end',
  '{}'
WHERE NOT EXISTS (SELECT 1 FROM event_definitions WHERE key = 'mq11_sprain_leg');

UPDATE event_definitions
SET mandatory_gate = 'blocks_period_end',
    description = 'Телефон не включается — без связи сложно работать и оплачивать счета.'
WHERE key = 'broken_phone';

UPDATE event_definitions
SET description = 'Работодатель предлагает релокацию: бонус на переезд и заметно более дорогая жизнь в новом городе.'
WHERE key = 'mq11_relocation_bonus';

DELETE FROM event_choices ec
USING event_definitions ed
WHERE ec.definition_id = ed.id
  AND ed.key = 'broken_phone'
  AND ec.title LIKE '%Отложить%';

DELETE FROM event_choices ec
USING event_definitions ed
WHERE ec.definition_id = ed.id
  AND ed.key = 'mq11_pharmacy_stock'
  AND ec.title = 'Отложить';

-- >>> 0020_event_profile_chains.sql
-- Цепочки событий: отложенный follow-up через N периодов (PostgreSQL, идемпотентно)

CREATE TABLE IF NOT EXISTS event_profile_chains (
  id SERIAL PRIMARY KEY,
  game_profile_id INTEGER NOT NULL REFERENCES game_profiles(id) ON DELETE CASCADE,
  chain_key VARCHAR(80) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'scheduled',
  followup_definition_key VARCHAR(80) NOT NULL,
  after_periods INTEGER NOT NULL DEFAULT 2,
  due_period_index INTEGER NOT NULL,
  context_json TEXT NOT NULL DEFAULT '{}',
  surfaced_instance_id INTEGER NULL REFERENCES event_instances(id) ON DELETE SET NULL,
  created_period_index INTEGER NOT NULL,
  completed_period_index INTEGER NULL,
  created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'utc'),
  updated_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS ix_event_profile_chains_profile_status
  ON event_profile_chains (game_profile_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_event_profile_chains_active_key
  ON event_profile_chains (game_profile_id, chain_key)
  WHERE status IN ('scheduled', 'surfaced');

-- >>> 0021_used_car_event_chain.sql
-- Цепочка подержанного авто: part 1 + part 2 (идемпотентно)

INSERT INTO event_definitions (
  key, mode, title, description, weight, is_active, event_tier, repeat_policy,
  cooldown_periods, mandatory_gate, prerequisites_json
)
SELECT
  'mq11_used_car_deadline',
  'any',
  'Пора решить: подержанное авто',
  'Срок по сделке истекает. Завершите покупку по скидочной цене или откажитесь.',
  1,
  1,
  3,
  'once_per_profile',
  0,
  'blocks_period_end',
  '{}'
WHERE NOT EXISTS (SELECT 1 FROM event_definitions WHERE key = 'mq11_used_car_deadline');

UPDATE event_definitions
SET prerequisites_json = '{"forbid_active_asset_kinds_any":["car_personal","car_taxi"]}',
    description = 'Выгодная сделка на личный автомобиль. Финальное решение через 2 периода.'
WHERE key = 'mq11_used_car_offer';

-- >>> 0022_game_template_scenario_highlights.sql
-- UI сценариев: bullets + иконка + compare_note в blueprint_json (идемпотентно перезаписывает поля презентации)

UPDATE game_starter_templates SET blueprint_json = $json$
{"description":"Без долгов и обслуживания активов — чтобы освоить цикл периода без давления платежей.","scenario_icon":"fresh_start","compare_note":"Самый мягкий вход — освоить период без давления обязательств.","highlights":["Скромная зарплата (~50 000 ₽/мес)","Небольшие расходы на жизнь","Нет имущества и долгов на старте","На счёте ~15 000 ₽"],"period_duration_seconds":300,"cash_balance":15000,"monthly_salary":50000,"assets":[],"liabilities":[]}
$json$
WHERE template_key = 'mq_game_basic_v1';

UPDATE game_starter_templates SET blueprint_json = $json$
{"description":"Мало наличных на старте, потребительский кредит и авто с обслуживанием.","scenario_icon":"car_loan","compare_note":"Сложнее «Базового старта»: появились кредит и авто.","highlights":["Средняя зарплата (~45 000 ₽/мес)","Потребительский кредит","Авто: обслуживание каждый период","На счёте ~9 000 ₽"],"period_duration_seconds":300,"cash_balance":9000,"monthly_salary":45000,"assets":[{"title":"Авто","kind":"vehicle","asset_value":210000,"monthly_maintenance_cost":3000,"monthly_income":0}],"liabilities":[{"title":"Потребительский кредит","total_debt":240000,"annual_rate_percent":19}]}
$json$
WHERE template_key = 'mq_game_tight_budget_v1';

UPDATE game_starter_templates SET blueprint_json = $json$
{"description":"Высокий ипотечный платёж и машина: ошибки по кэшу быстро ощущаются.","scenario_icon":"home_mortgage","compare_note":"После «Зарплаты до зарплаты»: ипотека давит сильнее.","highlights":["Зарплата ~46 500 ₽/мес, но платёж по ипотеке высокий","Ипотека с первого периода","Авто + обслуживание","На счёте ~6 500 ₽"],"period_duration_seconds":300,"cash_balance":6500,"monthly_salary":46500,"assets":[{"title":"Авто","kind":"vehicle","asset_value":260000,"monthly_maintenance_cost":4000,"monthly_income":0}],"liabilities":[{"title":"Ипотека","total_debt":690000,"annual_rate_percent":13.5}]}
$json$
WHERE template_key = 'mq_game_mortgage_stress_v1';

UPDATE game_starter_templates SET blueprint_json = $json$
{"description":"Два долга, «жизнь» дороже и почти пустой счёт — для опытных игроков.","scenario_icon":"debt_stack","compare_note":"Максимум давления: два долга и почти пустой счёт.","highlights":["Зарплата ~43 500 ₽/мес, расходы высокие","Ипотека + кредитная карта","Подержанное авто","На счёте ~4 500 ₽"],"period_duration_seconds":300,"cash_balance":4500,"monthly_salary":43500,"assets":[{"title":"Подержанное авто","kind":"vehicle","asset_value":145000,"monthly_maintenance_cost":2900,"monthly_income":0}],"liabilities":[{"title":"Ипотека","total_debt":520000,"annual_rate_percent":14},{"title":"Кредитная карта","total_debt":110000,"annual_rate_percent":24}]}
$json$::text
WHERE template_key = 'mq_game_debt_stack_v1';

-- >>> 0023_starter_template_archetype_titles.sql
-- Архетипы сценариев: позитивные названия, нейтральные bullets, compare без «сложнее/давление»

UPDATE game_starter_templates SET
  title = 'Студент',
  blueprint_json = $json$
{"description":"Первый полноценный бюджет: без долгов, с запасом на счёте — спокойно освоить цикл периода.","scenario_icon":"fresh_start","compare_note":"Идеальный вход: почувствовать контроль над деньгами без спешки.","highlights":["Доход ~50 000 ₽/мес","Расходы на жизнь ~9 600 ₽/мес","Чистый старт — без долгов и активов","На счёте ~15 000 ₽"],"period_duration_seconds":300,"cash_balance":15000,"monthly_salary":50000,"assets":[],"liabilities":[]}
$json$
WHERE template_key = 'mq_game_basic_v1';

UPDATE game_starter_templates SET
  title = 'Профессионал',
  blueprint_json = $json$
{"description":"Карьера в разгоне: своё авто, кредит и меньше подушка — учишься держать ритм до зарплаты.","scenario_icon":"car_loan","compare_note":"Уже интереснее: машина и кредит — тренируешь баланс каждого периода.","highlights":["Доход ~45 000 ₽/мес","Расходы на жизнь ~14 800 ₽/мес","Авто в собственности, обслуживание ~3 000 ₽/мес","Потребительский кредит с первого периода","На счёте ~9 000 ₽"],"period_duration_seconds":300,"cash_balance":9000,"monthly_salary":45000,"assets":[{"title":"Авто","kind":"vehicle","asset_value":210000,"monthly_maintenance_cost":3000,"monthly_income":0}],"liabilities":[{"title":"Потребительский кредит","total_debt":240000,"annual_rate_percent":19}]}
$json$
WHERE template_key = 'mq_game_tight_budget_v1';

UPDATE game_starter_templates SET
  title = 'Руководитель',
  blueprint_json = $json$
{"description":"Свой дом и машина: несколько обязательств — уровень для уверенного ведения кэша.","scenario_icon":"home_mortgage","compare_note":"Ипотека и авто — для тех, кто любит вести несколько потоков платежей.","highlights":["Доход ~46 500 ₽/мес","Расходы на жизнь ~17 100 ₽/мес","Ипотека с первого периода","Авто + обслуживание ~4 000 ₽/мес","На счёте ~6 500 ₽"],"period_duration_seconds":300,"cash_balance":6500,"monthly_salary":46500,"assets":[{"title":"Авто","kind":"vehicle","asset_value":260000,"monthly_maintenance_cost":4000,"monthly_income":0}],"liabilities":[{"title":"Ипотека","total_debt":690000,"annual_rate_percent":13.5}]}
$json$
WHERE template_key = 'mq_game_mortgage_stress_v1';

UPDATE game_starter_templates SET
  title = 'Предприниматель',
  blueprint_json = $json$
{"description":"Два долга, плотный кэш и насыщенный период — максимум финансовых решений за цикл.","scenario_icon":"factory","compare_note":"Максимум решений за период — твой драйв, если любишь плотный ритм.","highlights":["Доход ~43 500 ₽/мес","Расходы на жизнь ~19 600 ₽/мес","Ипотека + кредитная карта","Подержанное авто","На счёте ~4 500 ₽"],"period_duration_seconds":300,"cash_balance":4500,"monthly_salary":43500,"assets":[{"title":"Подержанное авто","kind":"vehicle","asset_value":145000,"monthly_maintenance_cost":2900,"monthly_income":0}],"liabilities":[{"title":"Ипотека","total_debt":520000,"annual_rate_percent":14},{"title":"Кредитная карта","total_debt":110000,"annual_rate_percent":24}]}
$json$::text
WHERE template_key = 'mq_game_debt_stack_v1';

-- >>> 0024_scenario_icon_factory.sql
-- Предприниматель: иконка factory вместо debt_stack
UPDATE game_starter_templates
SET blueprint_json = REPLACE(blueprint_json::text, '"scenario_icon":"debt_stack"', '"scenario_icon":"factory"')::jsonb
WHERE template_key = 'mq_game_debt_stack_v1'
  AND blueprint_json::text LIKE '%"scenario_icon":"debt_stack"%';

-- >>> 0025_family_money_event_chain.sql
-- Цепочка «родственник»: callback после отказа (идемпотентно)

INSERT INTO event_definitions (
  key, mode, title, description, weight, is_active, event_tier, repeat_policy,
  cooldown_periods, mandatory_gate, prerequisites_json, metadata_json
)
SELECT
  'mq11_family_money_callback',
  'any',
  'Родственник снова просит о помощи',
  'После вашего отказа ситуация не улучшилась — просят уже больше. Можно помочь снова или твёрдо отказать.',
  1,
  1,
  2,
  'once_per_profile',
  0,
  'none',
  '{}',
  '{"event_domain":"social_family","interaction_kind":"chain_followup","scenario_shape":"chain"}'
WHERE NOT EXISTS (SELECT 1 FROM event_definitions WHERE key = 'mq11_family_money_callback');

UPDATE event_definitions
SET description = 'Близкий человек просит небольшую сумму. Помощь разовая; при отказе может снова обратиться через период.',
    metadata_json = '{"event_domain":"social_family","interaction_kind":"choice","scenario_shape":"chain"}',
    cooldown_periods = 4
WHERE key = 'mq11_family_money_request';

UPDATE event_definitions SET is_active = 0 WHERE key = 'mq11_refinance_bank';

-- >>> 0026_event_consumption_variants.sql
-- Доп. consumption-события (отдельные key, тот же домен) — идемпотентно

INSERT INTO event_definitions (
  key, mode, title, description, weight, is_active, event_tier, repeat_policy,
  cooldown_periods, mandatory_gate, prerequisites_json, metadata_json
)
SELECT
  'mq11_coffee_takeaway',
  'any',
  'Кофе каждый день',
  'Кофейня у офиса предлагает абонемент на месяц — иначе платите по чашке.',
  82,
  1,
  1,
  'repeatable',
  3,
  'none',
  '{}',
  '{"event_domain":"consumption","interaction_kind":"choice","scenario_shape":"soft_offer"}'
WHERE NOT EXISTS (SELECT 1 FROM event_definitions WHERE key = 'mq11_coffee_takeaway');

INSERT INTO event_definitions (
  key, mode, title, description, weight, is_active, event_tier, repeat_policy,
  cooldown_periods, mandatory_gate, prerequisites_json, metadata_json
)
SELECT
  'mq11_clothing_clearance',
  'any',
  'Распродажа одежды',
  'Магазин закрывает сезон — скидки на базовый гардероб и «полный апгрейд».',
  76,
  1,
  1,
  'repeatable',
  3,
  'none',
  '{}',
  '{"event_domain":"consumption","interaction_kind":"choice","scenario_shape":"soft_offer"}'
WHERE NOT EXISTS (SELECT 1 FROM event_definitions WHERE key = 'mq11_clothing_clearance');

INSERT INTO event_definitions (
  key, mode, title, description, weight, is_active, event_tier, repeat_policy,
  cooldown_periods, mandatory_gate, prerequisites_json, metadata_json
)
SELECT
  'mq11_food_delivery_promo',
  'any',
  'Акция доставки еды',
  'Сервис доставки даёт скидку на неделю заказов — удобно, но дороже готовки дома.',
  88,
  1,
  1,
  'repeatable',
  3,
  'none',
  '{}',
  '{"event_domain":"consumption","interaction_kind":"choice","scenario_shape":"soft_offer"}'
WHERE NOT EXISTS (SELECT 1 FROM event_definitions WHERE key = 'mq11_food_delivery_promo');

INSERT INTO event_definitions (
  key, mode, title, description, weight, is_active, event_tier, repeat_policy,
  cooldown_periods, mandatory_gate, prerequisites_json, metadata_json
)
SELECT
  'mq11_appliance_sale',
  'any',
  'Скидка на бытовую технику',
  'Ритейлер распродаёт мелкую технику — можно заменить износившуюся или отложить.',
  74,
  1,
  1,
  'repeatable',
  3,
  'none',
  '{}',
  '{"event_domain":"consumption","interaction_kind":"choice","scenario_shape":"soft_offer"}'
WHERE NOT EXISTS (SELECT 1 FROM event_definitions WHERE key = 'mq11_appliance_sale');

-- >>> 0027_victory_playtest_criteria.sql
-- Временные критерии победы для плейтеста (playtest_mode v1). Откат: victory_seeds.VICTORY_CONFIG_LEGACY_BY_TEMPLATE_KEY

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version":1,"playtest_mode":"v1","min_period_index_for_victory":7,"required_goals_met":3,"goals":[{"key":"safety_3x","type":"safety_fund_months","title":"Подушка ≥ 3× обязательств","months_multiplier":3,"required":false,"enabled":true},{"key":"passive_income_100k","type":"passive_income_monthly_min","title":"Пассивный доход ≥ 100 000 ₽/мес","min_monthly":100000,"required":false,"enabled":true},{"key":"car_owned","type":"asset_kind_any_owned","title":"Машина в собственности","asset_kinds_any":["car","car_personal","car_taxi","rental_car","vehicle"],"required":false,"enabled":true}]}'
WHERE template_key = 'mq_game_basic_v1';

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version":1,"playtest_mode":"v1","min_period_index_for_victory":7,"required_goals_met":5,"goals":[{"key":"safety_6x","type":"safety_fund_months","title":"Подушка ≥ 6× обязательств","months_multiplier":6,"required":false,"enabled":true},{"key":"passive_net_250k","type":"passive_income_net_monthly_min","title":"Пассивный доход − расходы ≥ 250 000 ₽/мес","min_net":250000,"required":false,"enabled":true},{"key":"level_10","type":"character_level","title":"Уровень персонажа ≥ 10","min_level":10,"required":false,"enabled":true},{"key":"cash_10m","type":"cash_balance_min","title":"Наличные ≥ 10 000 000 ₽","min_cash":10000000,"required":false,"enabled":true},{"key":"rental_home_owned","type":"asset_kind_any_owned","title":"Сдаваемая квартира в собственности","asset_kinds_any":["rental_home"],"required":false,"enabled":true}]}'
WHERE template_key IN ('mq_game_tight_budget_v1', 'mq_game_mortgage_stress_v1', 'mq_game_debt_stack_v1');

-- >>> 0028_period_close_compare_metrics.sql
-- Сравнение доходов/расходов между периодами + снимок долга для итога периода
ALTER TABLE period_economy_closings ADD COLUMN IF NOT EXISTS period_income_rate DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE period_economy_closings ADD COLUMN IF NOT EXISTS period_expense_total DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE period_economy_closings ADD COLUMN IF NOT EXISTS total_debt_balance DOUBLE PRECISION NOT NULL DEFAULT 0;

-- >>> 0028_starter_template_balance_ladder.sql
-- Лестница баланса Game-шаблонов (2026-05): зарплата 50/100/150/200k, free flow 25/15/10/~-3k.
-- См. docs/vision/ideas/starter-template-balance-ladder.md

UPDATE game_starter_templates
SET
  base_monthly_lifestyle_expense = 25000,
  blueprint_json = '{"description":"Первый бюджет без долгов: комфортный free flow и запас на счёте — освоить цикл периода.","scenario_icon":"fresh_start","compare_note":"Идеальный вход: зарплата 50k, жизнь ~25k, без обязательств.","highlights":["Доход ~50 000 ₽/мес","Расходы на жизнь ~25 000 ₽/мес","Свободно ~25 000 ₽/мес после расходов","Чистый старт — без долгов и активов","На счёте ~15 000 ₽"],"period_duration_seconds":300,"cash_balance":15000,"monthly_salary":50000,"assets":[],"liabilities":[],"expense_budget":{"housing":5500,"food":9500,"transport":2800,"communications":2200,"health":2200,"clothing":1800,"leisure":1000,"other":0}}'
WHERE template_key = 'mq_game_basic_v1';

UPDATE game_starter_templates
SET
  base_monthly_lifestyle_expense = 56000,
  blueprint_json = '{"description":"Карьера и аренда: машина из каталога, автокредит, жильё снимаешь — free flow уже плотнее.","scenario_icon":"car_loan","compare_note":"После Студента: авто 1,2 млн, обслуживание ~18k, аренда в бюджете жилья.","highlights":["Доход ~100 000 ₽/мес","Расходы на жизнь ~56 000 ₽/мес (в т.ч. аренда ~28 000)","Авто: обслуживание ~18 000 ₽/мес + кредит ~12 000","Свободно ~14 000 ₽/мес после обязательств","На счёте ~25 000 ₽"],"period_duration_seconds":300,"cash_balance":25000,"monthly_salary":100000,"assets":[{"title":"Личная машина","kind":"car_personal","asset_value":1200000,"monthly_maintenance_cost":18000,"monthly_income":0}],"liabilities":[{"title":"Автокредит","total_debt":900000,"annual_rate_percent":16}],"expense_budget":{"housing":28000,"food":12000,"transport":4000,"communications":2500,"health":3000,"clothing":2500,"leisure":4000,"other":0}}'
WHERE template_key = 'mq_game_tight_budget_v1';

UPDATE game_starter_templates
SET
  base_monthly_lifestyle_expense = 68000,
  blueprint_json = '{"description":"Семья: своя квартира, ипотека, два автомобиля — несколько потоков платежей и узкий free flow.","scenario_icon":"home_mortgage","compare_note":"Ипотека ~30k/мес, два авто по ~18k, жильё в burn ~32k на семью.","highlights":["Доход ~150 000 ₽/мес","Расходы на жизнь ~68 000 ₽/мес","Квартира в активах, ипотека ~2,7 млн","Два автомобиля, обслуживание ~36 000 ₽/мес","Свободно ~10 000 ₽/мес","На счёте ~35 000 ₽"],"period_duration_seconds":300,"cash_balance":35000,"monthly_salary":150000,"assets":[{"title":"Квартира","kind":"home","asset_value":4500000,"monthly_maintenance_cost":6000,"monthly_income":0},{"title":"Семейный автомобиль","kind":"car_personal","asset_value":1200000,"monthly_maintenance_cost":18000,"monthly_income":0},{"title":"Второй автомобиль","kind":"car_personal","asset_value":1200000,"monthly_maintenance_cost":18000,"monthly_income":0}],"liabilities":[{"title":"Ипотека","total_debt":2700000,"annual_rate_percent":13.5}],"expense_budget":{"housing":32000,"food":24000,"transport":5000,"communications":2500,"health":3000,"clothing":2000,"leisure":2500,"other":0}}'
WHERE template_key = 'mq_game_mortgage_stress_v1';

UPDATE game_starter_templates
SET
  base_monthly_lifestyle_expense = 108000,
  blueprint_json = '{"description":"Максимум инструментов: свой дом, арендная квартира, два авто, ипотека и карта — free flow около нуля.","scenario_icon":"factory","compare_note":"Зарплата 200k, но обязательства ~95k; аренда даёт +35k к доходу актива.","highlights":["Доход ~200 000 ₽/мес","Расходы на жизнь ~108 000 ₽/мес","Ипотека ~3,8 млн + кредитная карта","Два авто, доходная аренда +35 000 ₽/мес","Свободно ~−3 000 ₽/мес до дохода активов","На счёте ~45 000 ₽"],"period_duration_seconds":300,"cash_balance":45000,"monthly_salary":200000,"assets":[{"title":"Жилая квартира","kind":"home","asset_value":4500000,"monthly_maintenance_cost":6000,"monthly_income":0},{"title":"Квартира под сдачу","kind":"rental_home","asset_value":5200000,"monthly_maintenance_cost":7000,"monthly_income":35000},{"title":"Автомобиль","kind":"car_personal","asset_value":1200000,"monthly_maintenance_cost":18000,"monthly_income":0},{"title":"Второй автомобиль","kind":"car_personal","asset_value":1200000,"monthly_maintenance_cost":18000,"monthly_income":0}],"liabilities":[{"title":"Ипотека","total_debt":3800000,"annual_rate_percent":13.5},{"title":"Кредитная карта","total_debt":150000,"annual_rate_percent":24}],"expense_budget":{"housing":38000,"food":32000,"transport":8000,"communications":4000,"health":5000,"clothing":4000,"leisure":17000,"other":0}}'
WHERE template_key = 'mq_game_debt_stack_v1';

-- >>> 0029_real_estate_asset_catalog.sql
-- Каталог недвижимости: owned / income / leased. Legacy home, rental_home снимаем.

ALTER TABLE asset_templates ADD COLUMN IF NOT EXISTS estate_role VARCHAR(20) NOT NULL DEFAULT 'owned';
ALTER TABLE asset_templates ADD COLUMN IF NOT EXISTS monthly_rent_cost DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE asset_templates ADD COLUMN IF NOT EXISTS monthly_utilities_cost DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE asset_templates ADD COLUMN IF NOT EXISTS income_yield_annual DOUBLE PRECISION NULL;
ALTER TABLE asset_templates ADD COLUMN IF NOT EXISTS has_tenants_default INTEGER NOT NULL DEFAULT 0;

ALTER TABLE finance_assets ADD COLUMN IF NOT EXISTS has_tenants INTEGER NOT NULL DEFAULT 0;

UPDATE asset_templates SET is_active = 0 WHERE template_key IN ('home', 'rental_home');

-- owned
INSERT INTO asset_templates (template_key, title, kind, asset_value, monthly_maintenance_cost, monthly_income, estate_role, is_active, sort_order)
VALUES
  ('apt_1br', '1-комнатная квартира', 'home', 5000000, 15000, 0, 'owned', 1, 11),
  ('apt_2br', '2-комнатная квартира', 'home', 10000000, 30000, 0, 'owned', 1, 12),
  ('apt_3br', '3-комнатная квартира', 'home', 15000000, 45000, 0, 'owned', 1, 13),
  ('land_plot', 'Участок', 'land', 2500000, 10000, 0, 'owned', 1, 14),
  ('house_private', 'Частный дом', 'house', 20000000, 80000, 0, 'owned', 1, 15),
  ('mansion', 'Особняк 300+ м²', 'mansion', 50000000, 200000, 0, 'owned', 1, 16)
ON CONFLICT (template_key) DO UPDATE SET
  title = EXCLUDED.title, kind = EXCLUDED.kind, asset_value = EXCLUDED.asset_value,
  monthly_maintenance_cost = EXCLUDED.monthly_maintenance_cost, monthly_income = EXCLUDED.monthly_income,
  estate_role = EXCLUDED.estate_role, is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;

-- income
INSERT INTO asset_templates (template_key, title, kind, asset_value, monthly_maintenance_cost, monthly_income, estate_role, income_yield_annual, has_tenants_default, is_active, sort_order)
VALUES
  ('apt_1br_income', '1-комнатная (сдача)', 'rental_home', 5000000, 7500, 37500, 'income', 0.09, 1, 1, 21),
  ('apt_2br_income', '2-комнатная (сдача)', 'rental_home', 10000000, 15000, 66667, 'income', 0.08, 1, 1, 22),
  ('apt_3br_income', '3-комнатная (сдача)', 'rental_home', 15000000, 22500, 87500, 'income', 0.07, 1, 1, 23),
  ('house_private_income', 'Частный дом (сдача)', 'rental_house', 20000000, 40000, 116667, 'income', 0.07, 1, 1, 24),
  ('mansion_income', 'Особняк (сдача)', 'rental_mansion', 50000000, 100000, 250000, 'income', 0.06, 1, 1, 25)
ON CONFLICT (template_key) DO UPDATE SET
  title = EXCLUDED.title, kind = EXCLUDED.kind, asset_value = EXCLUDED.asset_value,
  monthly_maintenance_cost = EXCLUDED.monthly_maintenance_cost, monthly_income = EXCLUDED.monthly_income,
  estate_role = EXCLUDED.estate_role, income_yield_annual = EXCLUDED.income_yield_annual,
  has_tenants_default = EXCLUDED.has_tenants_default, is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;

-- leased (платёж = rent + utilities в monthly_maintenance_cost)
INSERT INTO asset_templates (template_key, title, kind, asset_value, monthly_maintenance_cost, monthly_income, estate_role, monthly_rent_cost, monthly_utilities_cost, is_active, sort_order)
VALUES
  ('lease_studio', 'Студия (аренда)', 'leased_dwelling', 0, 27500, 0, 'leased', 22500, 5000, 1, 31),
  ('lease_apt_2br', '2-комнатная (аренда)', 'leased_dwelling', 0, 52500, 0, 'leased', 45000, 7500, 1, 32),
  ('lease_apt_3br', '3-комнатная (аренда)', 'leased_dwelling', 0, 82500, 0, 'leased', 70000, 12500, 1, 33),
  ('lease_house', 'Дом (аренда)', 'leased_dwelling', 0, 115000, 0, 'leased', 100000, 15000, 1, 34)
ON CONFLICT (template_key) DO UPDATE SET
  title = EXCLUDED.title, kind = EXCLUDED.kind, asset_value = EXCLUDED.asset_value,
  monthly_maintenance_cost = EXCLUDED.monthly_maintenance_cost, monthly_income = EXCLUDED.monthly_income,
  estate_role = EXCLUDED.estate_role, monthly_rent_cost = EXCLUDED.monthly_rent_cost,
  monthly_utilities_cost = EXCLUDED.monthly_utilities_cost, is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;

-- >>> 0030_starter_templates_housing_out.sql
-- Стартовые шаблоны: жильё в активах, burn без housing (см. main.py).

UPDATE game_starter_templates SET base_monthly_lifestyle_expense = 37500.0, blueprint_json = '{"description": "Первый бюджет без долгов и без жилья в старте — еда, транспорт, досуг; жильё выбираешь в игре.", "scenario_icon": "fresh_start", "compare_note": "Зарплата ~62,5k, жизнь ~37,5k (без аренды), свободно ~25k.", "highlights": ["Доход ~62 500 ₽/мес", "Расходы на жизнь ~37 500 ₽/мес (без жилья)", "Свободно ~25 000 ₽/мес", "Без долгов и активов в старте", "На счёте ~15 000 ₽"], "period_duration_seconds": 300, "cash_balance": 15000, "monthly_salary": 62500, "assets": [], "liabilities": [], "expense_budget": {"housing": 0, "food": 16600, "transport": 5200, "communications": 3500, "health": 3900, "clothing": 3100, "leisure": 5200, "other": 0}}' WHERE template_key = 'mq_game_basic_v1';

UPDATE game_starter_templates SET base_monthly_lifestyle_expense = 27500.0, blueprint_json = '{"description": "Студия в аренде, машина и автокредит — жильё и авто как отдельные платежи, не в burn.", "scenario_icon": "car_loan", "compare_note": "Аренда студии 22,5+5k, авто 18k + кредит ~12k, жизнь ~27,5k.", "highlights": ["Доход ~100 000 ₽/мес", "Аренда студии ~27 500 ₽/мес", "Авто + кредит ~30 000 ₽/мес", "Расходы на жизнь ~27 500 ₽/мес", "Свободно ~15 000 ₽/мес", "На счёте ~25 000 ₽"], "period_duration_seconds": 300, "cash_balance": 25000, "monthly_salary": 100000, "assets": [{"title": "Студия (аренда)", "kind": "leased_dwelling", "asset_value": 0, "monthly_maintenance_cost": 27500, "monthly_income": 0}, {"title": "Личная машина", "kind": "car_personal", "asset_value": 1200000, "monthly_maintenance_cost": 18000, "monthly_income": 0}], "liabilities": [{"title": "Автокредит", "total_debt": 900000, "annual_rate_percent": 16}], "expense_budget": {"housing": 0, "food": 12150, "transport": 3850, "communications": 2575, "health": 2860, "clothing": 2210, "leisure": 3855, "other": 0}}' WHERE template_key = 'mq_game_tight_budget_v1';

UPDATE game_starter_templates SET base_monthly_lifestyle_expense = 43625.0, blueprint_json = '{"description": "Своя 2-комнатная, ипотека, два авто — содержание квартиры отдельно от burn.", "scenario_icon": "home_mortgage", "compare_note": "Квартира 10 млн, содержание 30k, ипотека ~30k, два авто 36k.", "highlights": ["Доход ~150 000 ₽/мес", "2-комнатная + ипотека ~2,7 млн", "Содержание квартиры ~30 000 ₽/мес", "Два авто ~36 000 ₽/мес", "Расходы на жизнь ~43 600 ₽/мес", "Свободно ~10 000 ₽/мес", "На счёте ~35 000 ₽"], "period_duration_seconds": 300, "cash_balance": 35000, "monthly_salary": 150000, "assets": [{"title": "2-комнатная квартира", "kind": "home", "asset_value": 10000000, "monthly_maintenance_cost": 30000, "monthly_income": 0}, {"title": "Семейный автомобиль", "kind": "car_personal", "asset_value": 1200000, "monthly_maintenance_cost": 18000, "monthly_income": 0}, {"title": "Второй автомобиль", "kind": "car_personal", "asset_value": 1200000, "monthly_maintenance_cost": 18000, "monthly_income": 0}], "liabilities": [{"title": "Ипотека", "total_debt": 2700000, "annual_rate_percent": 13.5}], "expense_budget": {"housing": 0, "food": 19300, "transport": 6100, "communications": 4075, "health": 4540, "clothing": 3520, "leisure": 6090, "other": 0}}' WHERE template_key = 'mq_game_mortgage_stress_v1';

UPDATE game_starter_templates SET base_monthly_lifestyle_expense = 91250.0, blueprint_json = '{"description": "Ипотека на 2-комнатную, два авто и карта — без доходной недвижимости в старте.", "scenario_icon": "factory", "compare_note": "Максимум долгов и авто; free flow около нуля.", "highlights": ["Доход ~200 000 ₽/мес", "2-комнатная, ипотека ~3,8 млн", "Два авто + кредитная карта", "Расходы на жизнь ~91 250 ₽/мес", "Свободно ~−3 000 ₽/мес", "На счёте ~45 000 ₽"], "period_duration_seconds": 300, "cash_balance": 45000, "monthly_salary": 200000, "assets": [{"title": "2-комнатная квартира", "kind": "home", "asset_value": 10000000, "monthly_maintenance_cost": 30000, "monthly_income": 0}, {"title": "Автомобиль", "kind": "car_personal", "asset_value": 1200000, "monthly_maintenance_cost": 18000, "monthly_income": 0}, {"title": "Второй автомобиль", "kind": "car_personal", "asset_value": 1200000, "monthly_maintenance_cost": 18000, "monthly_income": 0}], "liabilities": [{"title": "Ипотека", "total_debt": 3800000, "annual_rate_percent": 13.5}, {"title": "Кредитная карта", "total_debt": 150000, "annual_rate_percent": 24}], "expense_budget": {"housing": 0, "food": 40350, "transport": 12750, "communications": 8515, "health": 9490, "clothing": 7360, "leisure": 12785, "other": 0}}' WHERE template_key = 'mq_game_debt_stack_v1';

-- >>> 0031_remove_character_progression.sql
-- Удаление character_level / character_xp и целей победы character_level.

ALTER TABLE game_profiles DROP COLUMN IF EXISTS level;
ALTER TABLE game_profiles DROP COLUMN IF EXISTS xp;

-- Убрать character_level из victory_config_json шаблонов (если JSON валиден).
UPDATE game_starter_templates
SET victory_config_json = (
    SELECT jsonb_set(
        COALESCE(victory_config_json::jsonb, '{}'::jsonb),
        '{goals}',
        COALESCE(
            (
                SELECT jsonb_agg(g)
                FROM jsonb_array_elements(COALESCE(victory_config_json::jsonb->'goals', '[]'::jsonb)) AS g
                WHERE g->>'type' IS DISTINCT FROM 'character_level'
            ),
            '[]'::jsonb
        )
    )::text
)
WHERE victory_config_json IS NOT NULL
  AND victory_config_json <> ''
  AND victory_config_json <> '{}';

-- >>> 0032_victory_goal_chain.sql
-- Цепочка целей (progression_mode chain), playtest v2. Сиды: victory_seeds.py

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version": 1, "min_period_index_for_victory": 7, "required_goals_met": 4, "progression_mode": "chain", "goals": [{"key": "flow_nonneg", "type": "net_monthly_cashflow_nonneg", "title": "Стабильный денежный поток", "required": false, "enabled": true}, {"key": "safety_3x", "type": "safety_fund_months", "title": "Подушка ≥ 3× обязательств", "months_multiplier": 3, "required": false, "enabled": true}, {"key": "no_overdue", "type": "no_overdue", "title": "Без просрочки", "required": false, "enabled": true}, {"key": "passive_income_100k", "type": "passive_income_monthly_min", "title": "Пассивный доход ≥ 100 000 ₽/мес", "min_monthly": 100000, "required": false, "enabled": true}], "playtest_mode": "v2"}'
WHERE template_key = 'mq_game_basic_v1';

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version": 1, "min_period_index_for_victory": 7, "required_goals_met": 4, "progression_mode": "chain", "goals": [{"key": "safety_6x", "type": "safety_fund_months", "title": "Подушка ≥ 6× обязательств", "months_multiplier": 6, "required": false, "enabled": true}, {"key": "passive_net_250k", "type": "passive_income_net_monthly_min", "title": "Пассивный доход − расходы ≥ 250 000 ₽/мес", "min_net": 250000, "required": false, "enabled": true}, {"key": "cash_10m", "type": "cash_balance_min", "title": "Наличные ≥ 10 000 000 ₽", "min_cash": 10000000, "required": false, "enabled": true}, {"key": "rental_home_owned", "type": "asset_kind_any_owned", "title": "Сдаваемая квартира в собственности", "asset_kinds_any": ["rental_home", "rental_house", "rental_mansion"], "required": false, "enabled": true}], "playtest_mode": "v2"}'
WHERE template_key = 'mq_game_tight_budget_v1';

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version": 1, "min_period_index_for_victory": 7, "required_goals_met": 4, "progression_mode": "chain", "goals": [{"key": "safety_6x", "type": "safety_fund_months", "title": "Подушка ≥ 6× обязательств", "months_multiplier": 6, "required": false, "enabled": true}, {"key": "passive_net_250k", "type": "passive_income_net_monthly_min", "title": "Пассивный доход − расходы ≥ 250 000 ₽/мес", "min_net": 250000, "required": false, "enabled": true}, {"key": "cash_10m", "type": "cash_balance_min", "title": "Наличные ≥ 10 000 000 ₽", "min_cash": 10000000, "required": false, "enabled": true}, {"key": "rental_home_owned", "type": "asset_kind_any_owned", "title": "Сдаваемая квартира в собственности", "asset_kinds_any": ["rental_home", "rental_house", "rental_mansion"], "required": false, "enabled": true}], "playtest_mode": "v2"}'
WHERE template_key = 'mq_game_mortgage_stress_v1';

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version": 1, "min_period_index_for_victory": 7, "required_goals_met": 4, "progression_mode": "chain", "goals": [{"key": "safety_6x", "type": "safety_fund_months", "title": "Подушка ≥ 6× обязательств", "months_multiplier": 6, "required": false, "enabled": true}, {"key": "passive_net_250k", "type": "passive_income_net_monthly_min", "title": "Пассивный доход − расходы ≥ 250 000 ₽/мес", "min_net": 250000, "required": false, "enabled": true}, {"key": "cash_10m", "type": "cash_balance_min", "title": "Наличные ≥ 10 000 000 ₽", "min_cash": 10000000, "required": false, "enabled": true}, {"key": "rental_home_owned", "type": "asset_kind_any_owned", "title": "Сдаваемая квартира в собственности", "asset_kinds_any": ["rental_home", "rental_house", "rental_mansion"], "required": false, "enabled": true}], "playtest_mode": "v2"}'
WHERE template_key = 'mq_game_debt_stack_v1';

-- >>> 0033_victory_tutorial_chain.sql
-- Учебная цепочка целей + mechanics_unlock для mq_game_basic_v1 (см. victory_seeds.py)

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version": 1, "min_period_index_for_victory": 7, "required_goals_met": 5, "progression_mode": "chain", "goals": [{"key": "tutorial_salary", "type": "action_once", "title": "Забрать зарплату (первый ход)", "action": "salary_claimed", "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "tutorial_cushion", "type": "action_once", "title": "Подушка: внести любую сумму (фундамент безопасности)", "action": "safety_contributed", "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "tutorial_invest", "type": "action_once", "title": "Инвестиции: открыть депозит или купить облигацию (можно от 1 000 ₽)", "action": "invest_opened", "requires_mechanics": ["capital_invest"], "required": false, "enabled": true}, {"key": "safety_3x", "type": "safety_fund_months", "title": "Подушка ≥ 3× текущих расходов за период", "months_multiplier": 3, "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "invest_income_15k", "type": "passive_income_monthly_min", "title": "Доход с инвестиций ≥ 15 000 ₽/мес", "min_monthly": 15000, "requires_mechanics": ["capital_invest"], "required": false, "enabled": true}], "playtest_mode": "tutorial"}'
WHERE template_key = 'mq_game_basic_v1';

UPDATE game_starter_templates
SET blueprint_json = jsonb_set(
  COALESCE(blueprint_json::jsonb, '{}'::jsonb),
  '{mechanics_unlock}',
  '[{"after_goal": null, "grant": ["capital_flows", "capital_invest"]}]'::jsonb,
  true
)::text
WHERE template_key = 'mq_game_basic_v1';

-- >>> 0034_harder_tutorial_chain.sql
-- Учебная цепочка для тяжёлых шаблонов + mechanics_unlock (см. victory_seeds.py)

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version": 1, "min_period_index_for_victory": 7, "required_goals_met": 7, "progression_mode": "chain", "goals": [{"key": "tutorial_salary", "type": "action_once", "title": "Забрать зарплату (первый ход)", "action": "salary_claimed", "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "tutorial_cushion", "type": "action_once", "title": "Подушка: внести любую сумму (фундамент безопасности)", "action": "safety_contributed", "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "tutorial_invest", "type": "action_once", "title": "Инвестиции: открыть депозит или купить облигацию (можно от 1 000 ₽)", "action": "invest_opened", "requires_mechanics": ["capital_invest"], "required": false, "enabled": true}, {"key": "tutorial_insurance", "type": "action_once", "title": "Страховка: оформить любой полис (понять премии и выплаты)", "action": "insurance_purchased", "requires_mechanics": ["capital_insurance"], "required": false, "enabled": true}, {"key": "safety_6x", "type": "safety_fund_months", "title": "Подушка ≥ 6× текущих расходов за период", "months_multiplier": 6, "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "invest_income_80k", "type": "passive_income_monthly_min", "title": "Доход с инвестиций ≥ 80 000 ₽/мес", "min_monthly": 80000, "requires_mechanics": ["capital_invest"], "required": false, "enabled": true}, {"key": "cash_10m", "type": "cash_balance_min", "title": "Наличные ≥ 10 000 000 ₽", "min_cash": 10000000, "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}], "playtest_mode": "tutorial"}'
WHERE template_key IN ('mq_game_tight_budget_v1', 'mq_game_mortgage_stress_v1');

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version": 1, "min_period_index_for_victory": 7, "required_goals_met": 7, "progression_mode": "chain", "goals": [{"key": "tutorial_salary", "type": "action_once", "title": "Забрать зарплату (первый ход)", "action": "salary_claimed", "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "tutorial_cushion", "type": "action_once", "title": "Подушка: внести любую сумму (фундамент безопасности)", "action": "safety_contributed", "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "tutorial_invest", "type": "action_once", "title": "Инвестиции: открыть депозит или купить облигацию (можно от 1 000 ₽)", "action": "invest_opened", "requires_mechanics": ["capital_invest"], "required": false, "enabled": true}, {"key": "tutorial_insurance", "type": "action_once", "title": "Страховка: оформить любой полис (понять премии и выплаты)", "action": "insurance_purchased", "requires_mechanics": ["capital_insurance"], "required": false, "enabled": true}, {"key": "safety_6x", "type": "safety_fund_months", "title": "Подушка ≥ 6× текущих расходов за период", "months_multiplier": 6, "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "invest_income_80k", "type": "passive_income_monthly_min", "title": "Доход с инвестиций ≥ 80 000 ₽/мес", "min_monthly": 80000, "requires_mechanics": ["capital_invest"], "required": false, "enabled": true}, {"key": "cash_10m", "type": "cash_balance_min", "title": "Наличные ≥ 10 000 000 ₽", "min_cash": 10000000, "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}], "playtest_mode": "tutorial"}'
WHERE template_key = 'mq_game_debt_stack_v1';

UPDATE game_starter_templates
SET blueprint_json = jsonb_set(
  COALESCE(blueprint_json::jsonb, '{}'::jsonb),
  '{mechanics_unlock}',
  '[{"after_goal": null, "grant": ["capital_flows"]}, {"after_goal": "tutorial_cushion", "grant": ["capital_liabilities", "capital_invest"]}, {"after_goal": "tutorial_invest", "grant": ["capital_insurance"]}, {"after_goal": "tutorial_insurance", "grant": ["capital_property"]}]'::jsonb,
  true
)::text
WHERE template_key IN (
  'mq_game_tight_budget_v1',
  'mq_game_mortgage_stress_v1',
  'mq_game_debt_stack_v1'
);

-- >>> 0035_basic_invest_unlock_at_start.sql
-- Студент (mq_game_basic_v1): депозиты/облигации с первого периода (см. mechanics_progression.DEFAULT_BASIC_UNLOCK)

UPDATE game_starter_templates
SET blueprint_json = jsonb_set(
  COALESCE(blueprint_json::jsonb, '{}'::jsonb),
  '{mechanics_unlock}',
  '[{"after_goal": null, "grant": ["capital_flows", "capital_invest"]}]'::jsonb,
  true
)::text
WHERE template_key = 'mq_game_basic_v1';

-- >>> 0036_victory_invest_goal_order.sql
-- Цель tutorial_invest: новый заголовок и порядок до safety_3x/6x (см. victory_seeds.py)

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version": 1, "min_period_index_for_victory": 7, "required_goals_met": 5, "progression_mode": "chain", "goals": [{"key": "tutorial_salary", "type": "action_once", "title": "Забрать зарплату (первый ход)", "action": "salary_claimed", "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "tutorial_cushion", "type": "action_once", "title": "Подушка: внести любую сумму (фундамент безопасности)", "action": "safety_contributed", "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "tutorial_invest", "type": "action_once", "title": "Инвестиции: открыть депозит или купить облигацию (можно от 1 000 ₽)", "action": "invest_opened", "requires_mechanics": ["capital_invest"], "required": false, "enabled": true}, {"key": "safety_3x", "type": "safety_fund_months", "title": "Подушка ≥ 3× текущих расходов за период", "months_multiplier": 3, "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "invest_income_15k", "type": "passive_income_monthly_min", "title": "Доход с инвестиций ≥ 15 000 ₽/мес", "min_monthly": 15000, "requires_mechanics": ["capital_invest"], "required": false, "enabled": true}], "playtest_mode": "tutorial"}'
WHERE template_key = 'mq_game_basic_v1';

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version": 1, "min_period_index_for_victory": 7, "required_goals_met": 7, "progression_mode": "chain", "goals": [{"key": "tutorial_salary", "type": "action_once", "title": "Забрать зарплату (первый ход)", "action": "salary_claimed", "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "tutorial_cushion", "type": "action_once", "title": "Подушка: внести любую сумму (фундамент безопасности)", "action": "safety_contributed", "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "tutorial_invest", "type": "action_once", "title": "Инвестиции: открыть депозит или купить облигацию (можно от 1 000 ₽)", "action": "invest_opened", "requires_mechanics": ["capital_invest"], "required": false, "enabled": true}, {"key": "tutorial_insurance", "type": "action_once", "title": "Страховка: оформить любой полис (понять премии и выплаты)", "action": "insurance_purchased", "requires_mechanics": ["capital_insurance"], "required": false, "enabled": true}, {"key": "safety_6x", "type": "safety_fund_months", "title": "Подушка ≥ 6× текущих расходов за период", "months_multiplier": 6, "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "invest_income_80k", "type": "passive_income_monthly_min", "title": "Доход с инвестиций ≥ 80 000 ₽/мес", "min_monthly": 80000, "requires_mechanics": ["capital_invest"], "required": false, "enabled": true}, {"key": "cash_10m", "type": "cash_balance_min", "title": "Наличные ≥ 10 000 000 ₽", "min_cash": 10000000, "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}], "playtest_mode": "tutorial"}'
WHERE template_key IN ('mq_game_tight_budget_v1', 'mq_game_mortgage_stress_v1');

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version": 1, "min_period_index_for_victory": 7, "required_goals_met": 7, "progression_mode": "chain", "goals": [{"key": "tutorial_salary", "type": "action_once", "title": "Забрать зарплату (первый ход)", "action": "salary_claimed", "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "tutorial_cushion", "type": "action_once", "title": "Подушка: внести любую сумму (фундамент безопасности)", "action": "safety_contributed", "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "tutorial_invest", "type": "action_once", "title": "Инвестиции: открыть депозит или купить облигацию (можно от 1 000 ₽)", "action": "invest_opened", "requires_mechanics": ["capital_invest"], "required": false, "enabled": true}, {"key": "tutorial_insurance", "type": "action_once", "title": "Страховка: оформить любой полис (понять премии и выплаты)", "action": "insurance_purchased", "requires_mechanics": ["capital_insurance"], "required": false, "enabled": true}, {"key": "safety_6x", "type": "safety_fund_months", "title": "Подушка ≥ 6× текущих расходов за период", "months_multiplier": 6, "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "invest_income_80k", "type": "passive_income_monthly_min", "title": "Доход с инвестиций ≥ 80 000 ₽/мес", "min_monthly": 80000, "requires_mechanics": ["capital_invest"], "required": false, "enabled": true}, {"key": "cash_10m", "type": "cash_balance_min", "title": "Наличные ≥ 10 000 000 ₽", "min_cash": 10000000, "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}], "playtest_mode": "tutorial"}'
WHERE template_key = 'mq_game_debt_stack_v1';

-- >>> 0037_harder_invest_unlock_after_cushion.sql
-- Инвестиции после «Внести в подушку», в одной линии с цепочкой целей (invest перед safety_6x)

UPDATE game_starter_templates
SET blueprint_json = jsonb_set(
  COALESCE(blueprint_json::jsonb, '{}'::jsonb),
  '{mechanics_unlock}',
  '[{"after_goal": null, "grant": ["capital_flows"]}, {"after_goal": "tutorial_cushion", "grant": ["capital_liabilities", "capital_invest"]}, {"after_goal": "tutorial_invest", "grant": ["capital_insurance"]}, {"after_goal": "tutorial_insurance", "grant": ["capital_property"]}]'::jsonb,
  true
)::text
WHERE template_key IN (
  'mq_game_tight_budget_v1',
  'mq_game_mortgage_stress_v1',
  'mq_game_debt_stack_v1'
);

-- >>> 0038_character_needs_fields.sql
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

-- >>> 0039_victory_goals_table.sql
-- Victory goals as DB records (by template_key).
-- Creates victory_goals catalog table and seeds goals for 4 game templates.

CREATE TABLE IF NOT EXISTS victory_goals (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(80) NOT NULL,
  goal_key VARCHAR(80) NOT NULL,
  goal_type VARCHAR(60) NOT NULL,
  title TEXT NOT NULL,
  order_index INT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  requires_mechanics JSONB NOT NULL DEFAULT '[]'::jsonb,
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_victory_goals_template_goal_key
  ON victory_goals(template_key, goal_key);

CREATE INDEX IF NOT EXISTS ix_victory_goals_template_order
  ON victory_goals(template_key, order_index);

-- Helper note:
-- We seed from the current tutorial chains (victory_seeds.py), but store as rows.
-- Later we can build admin UI around these records.

-- --------------------
-- mq_game_basic_v1 (Студент): salary -> cushion(any) -> invest -> safety_3x -> invest_income_15k
-- --------------------
INSERT INTO victory_goals (template_key, goal_key, goal_type, title, order_index, enabled, required, requires_mechanics, params)
VALUES
  ('mq_game_basic_v1','tutorial_salary','action_once','Забрать зарплату (первый ход)',10,TRUE,FALSE,'["dashboard_core"]'::jsonb,'{"action":"salary_claimed"}'::jsonb),
  ('mq_game_basic_v1','tutorial_cushion','action_once','Подушка: внести любую сумму (фундамент безопасности)',20,TRUE,FALSE,'["dashboard_core"]'::jsonb,'{"action":"safety_contributed"}'::jsonb),
  ('mq_game_basic_v1','tutorial_invest','action_once','Инвестиции: открыть депозит или купить облигацию (можно от 1 000 ₽)',30,TRUE,FALSE,'["capital_invest"]'::jsonb,'{"action":"invest_opened"}'::jsonb),
  ('mq_game_basic_v1','safety_3x','safety_fund_months','Подушка ≥ 3× текущих расходов за период',40,TRUE,FALSE,'["dashboard_core"]'::jsonb,'{"months_multiplier":3}'::jsonb),
  ('mq_game_basic_v1','invest_income_15k','passive_income_monthly_min','Доход с инвестиций ≥ 15 000 ₽/мес',50,TRUE,FALSE,'["capital_invest"]'::jsonb,'{"min_monthly":15000}'::jsonb)
ON CONFLICT (template_key, goal_key) DO UPDATE SET
  goal_type = EXCLUDED.goal_type,
  title = EXCLUDED.title,
  order_index = EXCLUDED.order_index,
  enabled = EXCLUDED.enabled,
  required = EXCLUDED.required,
  requires_mechanics = EXCLUDED.requires_mechanics,
  params = EXCLUDED.params;

-- --------------------
-- harder templates: salary -> cushion(any) -> invest -> insurance -> safety_6x -> invest_income_80k -> cash_10m
-- --------------------
INSERT INTO victory_goals (template_key, goal_key, goal_type, title, order_index, enabled, required, requires_mechanics, params)
VALUES
  ('mq_game_tight_budget_v1','tutorial_salary','action_once','Забрать зарплату (первый ход)',10,TRUE,FALSE,'["dashboard_core"]'::jsonb,'{"action":"salary_claimed"}'::jsonb),
  ('mq_game_tight_budget_v1','tutorial_cushion','action_once','Подушка: внести любую сумму (фундамент безопасности)',20,TRUE,FALSE,'["dashboard_core"]'::jsonb,'{"action":"safety_contributed"}'::jsonb),
  ('mq_game_tight_budget_v1','tutorial_invest','action_once','Инвестиции: открыть депозит или купить облигацию (можно от 1 000 ₽)',30,TRUE,FALSE,'["capital_invest"]'::jsonb,'{"action":"invest_opened"}'::jsonb),
  ('mq_game_tight_budget_v1','tutorial_insurance','action_once','Страховка: оформить любой полис (понять премии и выплаты)',40,TRUE,FALSE,'["capital_insurance"]'::jsonb,'{"action":"insurance_purchased"}'::jsonb),
  ('mq_game_tight_budget_v1','safety_6x','safety_fund_months','Подушка ≥ 6× текущих расходов за период',50,TRUE,FALSE,'["dashboard_core"]'::jsonb,'{"months_multiplier":6}'::jsonb),
  ('mq_game_tight_budget_v1','invest_income_80k','passive_income_monthly_min','Доход с инвестиций ≥ 80 000 ₽/мес',60,TRUE,FALSE,'["capital_invest"]'::jsonb,'{"min_monthly":80000}'::jsonb),
  ('mq_game_tight_budget_v1','cash_10m','cash_balance_min','Наличные ≥ 10 000 000 ₽',70,TRUE,FALSE,'["dashboard_core"]'::jsonb,'{"min_cash":10000000}'::jsonb),

  ('mq_game_mortgage_stress_v1','tutorial_salary','action_once','Забрать зарплату (первый ход)',10,TRUE,FALSE,'["dashboard_core"]'::jsonb,'{"action":"salary_claimed"}'::jsonb),
  ('mq_game_mortgage_stress_v1','tutorial_cushion','action_once','Подушка: внести любую сумму (фундамент безопасности)',20,TRUE,FALSE,'["dashboard_core"]'::jsonb,'{"action":"safety_contributed"}'::jsonb),
  ('mq_game_mortgage_stress_v1','tutorial_invest','action_once','Инвестиции: открыть депозит или купить облигацию (можно от 1 000 ₽)',30,TRUE,FALSE,'["capital_invest"]'::jsonb,'{"action":"invest_opened"}'::jsonb),
  ('mq_game_mortgage_stress_v1','tutorial_insurance','action_once','Страховка: оформить любой полис (понять премии и выплаты)',40,TRUE,FALSE,'["capital_insurance"]'::jsonb,'{"action":"insurance_purchased"}'::jsonb),
  ('mq_game_mortgage_stress_v1','safety_6x','safety_fund_months','Подушка ≥ 6× текущих расходов за период',50,TRUE,FALSE,'["dashboard_core"]'::jsonb,'{"months_multiplier":6}'::jsonb),
  ('mq_game_mortgage_stress_v1','invest_income_80k','passive_income_monthly_min','Доход с инвестиций ≥ 80 000 ₽/мес',60,TRUE,FALSE,'["capital_invest"]'::jsonb,'{"min_monthly":80000}'::jsonb),
  ('mq_game_mortgage_stress_v1','cash_10m','cash_balance_min','Наличные ≥ 10 000 000 ₽',70,TRUE,FALSE,'["dashboard_core"]'::jsonb,'{"min_cash":10000000}'::jsonb),

  ('mq_game_debt_stack_v1','tutorial_salary','action_once','Забрать зарплату (первый ход)',10,TRUE,FALSE,'["dashboard_core"]'::jsonb,'{"action":"salary_claimed"}'::jsonb),
  ('mq_game_debt_stack_v1','tutorial_cushion','action_once','Подушка: внести любую сумму (фундамент безопасности)',20,TRUE,FALSE,'["dashboard_core"]'::jsonb,'{"action":"safety_contributed"}'::jsonb),
  ('mq_game_debt_stack_v1','tutorial_invest','action_once','Инвестиции: открыть депозит или купить облигацию (можно от 1 000 ₽)',30,TRUE,FALSE,'["capital_invest"]'::jsonb,'{"action":"invest_opened"}'::jsonb),
  ('mq_game_debt_stack_v1','tutorial_insurance','action_once','Страховка: оформить любой полис (понять премии и выплаты)',40,TRUE,FALSE,'["capital_insurance"]'::jsonb,'{"action":"insurance_purchased"}'::jsonb),
  ('mq_game_debt_stack_v1','safety_6x','safety_fund_months','Подушка ≥ 6× текущих расходов за период',50,TRUE,FALSE,'["dashboard_core"]'::jsonb,'{"months_multiplier":6}'::jsonb),
  ('mq_game_debt_stack_v1','invest_income_80k','passive_income_monthly_min','Доход с инвестиций ≥ 80 000 ₽/мес',60,TRUE,FALSE,'["capital_invest"]'::jsonb,'{"min_monthly":80000}'::jsonb),
  ('mq_game_debt_stack_v1','cash_10m','cash_balance_min','Наличные ≥ 10 000 000 ₽',70,TRUE,FALSE,'["dashboard_core"]'::jsonb,'{"min_cash":10000000}'::jsonb)
ON CONFLICT (template_key, goal_key) DO UPDATE SET
  goal_type = EXCLUDED.goal_type,
  title = EXCLUDED.title,
  order_index = EXCLUDED.order_index,
  enabled = EXCLUDED.enabled,
  required = EXCLUDED.required,
  requires_mechanics = EXCLUDED.requires_mechanics,
  params = EXCLUDED.params;

-- >>> 0040_event_needs_delta_content.sql
-- CN1-012: needs_delta в effects_json выборов событий (контент для playtest)

UPDATE event_choices ec
SET effects_json = '{"cash_delta": -14900, "xp_delta": 3, "needs_delta": {"health": 12, "comfort": 5, "status": 2}}'
FROM event_definitions ed
WHERE ed.id = ec.definition_id
  AND ed.key = 'mq11_gym_membership'
  AND ec.title = 'Продлить на год';

UPDATE event_choices ec
SET effects_json = '{"cash_delta": -4500, "xp_delta": 2, "needs_delta": {"health": 6, "comfort": 2}}'
FROM event_definitions ed
WHERE ed.id = ec.definition_id
  AND ed.key = 'mq11_gym_membership'
  AND ec.title = 'Продлить на квартал';

UPDATE event_choices ec
SET effects_json = '{"cash_delta": 0, "xp_delta": 1, "needs_delta": {"health": -3}}'
FROM event_definitions ed
WHERE ed.id = ec.definition_id
  AND ed.key = 'mq11_gym_membership'
  AND ec.title = 'Не продлевать';

UPDATE event_choices ec
SET effects_json = '{"cash_delta": -15000, "xp_delta": 5, "needs_delta": {"social": 14, "comfort": -3}}'
FROM event_definitions ed
WHERE ed.id = ec.definition_id
  AND ed.key = 'mq11_family_money_request'
  AND ec.title = 'Помочь полностью';

UPDATE event_choices ec
SET effects_json = '{"cash_delta": -7000, "xp_delta": 4, "needs_delta": {"social": 8, "health": 2}}'
FROM event_definitions ed
WHERE ed.id = ec.definition_id
  AND ed.key = 'mq11_family_money_request'
  AND ec.title = 'Помочь частично';

UPDATE event_choices ec
SET effects_json = '{"cash_delta": 0, "xp_delta": 1, "needs_delta": {"social": -6, "comfort": -2}, "enqueue_event": {"chain_key": "family_money_refusal", "followup_definition_key": "mq11_family_money_callback", "after_periods": 1, "context": {"branch": "refused_once"}}}'
FROM event_definitions ed
WHERE ed.id = ec.definition_id
  AND ed.key = 'mq11_family_money_request'
  AND ec.title = 'Отказаться вежливо';

-- >>> 0041_event_taxonomy_v2_columns.sql
-- EVT1-020: content_class, event_slot, audience_template_keys на event_definitions

ALTER TABLE event_definitions
    ADD COLUMN IF NOT EXISTS content_class VARCHAR(32) NOT NULL DEFAULT 'universal';

ALTER TABLE event_definitions
    ADD COLUMN IF NOT EXISTS event_slot VARCHAR(32) NOT NULL DEFAULT 'period_choice';

ALTER TABLE event_definitions
    ADD COLUMN IF NOT EXISTS audience_template_keys TEXT NOT NULL DEFAULT '["all"]';

UPDATE event_definitions
SET content_class = COALESCE(NULLIF(content_class, ''), 'universal'),
    event_slot = COALESCE(NULLIF(event_slot, ''), 'period_choice'),
    audience_template_keys = COALESCE(NULLIF(audience_template_keys, ''), '["all"]')
WHERE content_class IS NULL
   OR event_slot IS NULL
   OR audience_template_keys IS NULL
   OR audience_template_keys = '';

-- >>> 0042_victory_drop_min_period_gate.sql
-- Victory v2: снять min_period_index_for_victory из конфигов шаблонов (ворота по периоду — только в chain-целях).
UPDATE game_starter_templates
SET victory_config_json = (victory_config_json::jsonb - 'min_period_index_for_victory')::text
WHERE victory_config_json IS NOT NULL
  AND trim(victory_config_json) <> ''
  AND trim(victory_config_json) <> '{}'
  AND victory_config_json::jsonb ? 'min_period_index_for_victory';

-- >>> 0043_users_guidance_o2.sql
-- O2 Progressive Guidance: user-level completion + profile nudge streaks

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS guidance_completed INTEGER NOT NULL DEFAULT 0;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS guidance_progress_json TEXT NOT NULL DEFAULT '{}';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS guidance_completed_at TIMESTAMP NULL;

ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS salary_miss_streak INTEGER NOT NULL DEFAULT 0;

ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS negative_close_streak INTEGER NOT NULL DEFAULT 0;

-- Backfill: уже прошли O1
UPDATE users
SET guidance_completed = 1
WHERE guidance_completed = 0
  AND id IN (
    SELECT DISTINCT user_id
    FROM game_profiles
    WHERE onboarding_state = 'brief_done'
  );
