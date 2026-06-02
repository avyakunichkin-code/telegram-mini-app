-- Schema baseline: ТВОЙ ХОД (PostgreSQL)
-- Generated: 2026-06-02 12:32:37 UTC
-- Source: SQLAlchemy models (DDL only)
-- Regenerate: python scripts/dump_schema_baseline.py
-- Apply empty DB: bash backend/scripts/db.sh migrate --baseline-only
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
	PRIMARY KEY (id), 
	UNIQUE (chain_key)
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
	PRIMARY KEY (id), 
	UNIQUE (template_key)
)

;

CREATE TABLE liability_templates (
	id SERIAL NOT NULL, 
	template_key VARCHAR(80) NOT NULL, 
	title VARCHAR(160) NOT NULL, 
	total_debt FLOAT NOT NULL, 
	annual_rate_percent FLOAT NOT NULL, 
	liability_kind VARCHAR(32) NOT NULL, 
	term_periods INTEGER, 
	disbursement_mode VARCHAR(32) NOT NULL, 
	linked_asset_template_key VARCHAR(80), 
	down_payment_amount FLOAT NOT NULL, 
	requires_asset_kind VARCHAR(50), 
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
	run_outcome VARCHAR(16), 
	victory_finale_shown_at TIMESTAMP WITHOUT TIME ZONE, 
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
	acquisition_mode VARCHAR(16) NOT NULL, 
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

CREATE TABLE player_run_feedback (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	game_profile_id INTEGER NOT NULL, 
	outcome VARCHAR(16) NOT NULL, 
	template_key VARCHAR(80), 
	period_index INTEGER NOT NULL, 
	defeat_reason VARCHAR(40), 
	comment TEXT NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
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

CREATE TABLE finance_liabilities (
	id SERIAL NOT NULL, 
	game_profile_id INTEGER NOT NULL, 
	title VARCHAR(120) NOT NULL, 
	total_debt FLOAT NOT NULL, 
	annual_rate_percent FLOAT NOT NULL, 
	monthly_payment FLOAT NOT NULL, 
	overdue_amount FLOAT NOT NULL, 
	overdue_periods INTEGER NOT NULL, 
	liability_kind VARCHAR(32) NOT NULL, 
	secured_asset_id INTEGER, 
	term_periods INTEGER, 
	periods_paid INTEGER NOT NULL, 
	original_principal FLOAT, 
	payment_mode VARCHAR(32) NOT NULL, 
	is_active INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(game_profile_id) REFERENCES game_profiles (id), 
	FOREIGN KEY(secured_asset_id) REFERENCES finance_assets (id)
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
	insured_asset_id INTEGER, 
	is_active INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(game_profile_id) REFERENCES game_profiles (id), 
	FOREIGN KEY(insured_asset_id) REFERENCES finance_assets (id)
)

;

CREATE TABLE victory_goals (
	id SERIAL NOT NULL,
	template_key VARCHAR(80) NOT NULL,
	goal_key VARCHAR(80) NOT NULL,
	goal_type VARCHAR(60) NOT NULL,
	title TEXT NOT NULL,
	order_index INTEGER NOT NULL,
	enabled BOOLEAN NOT NULL,
	required BOOLEAN NOT NULL,
	requires_mechanics JSONB NOT NULL,
	params JSONB NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	PRIMARY KEY (id)
)

;

CREATE UNIQUE INDEX ix_victory_goals_template_goal_key ON victory_goals (template_key, goal_key);
CREATE INDEX ix_victory_goals_template_order ON victory_goals (template_key, order_index);
CREATE UNIQUE INDEX ix_achievement_chains_chain_key ON achievement_chains (chain_key);
CREATE INDEX ix_achievement_chains_id ON achievement_chains (id);
CREATE UNIQUE INDEX ix_asset_templates_template_key ON asset_templates (template_key);
CREATE INDEX ix_asset_templates_id ON asset_templates (id);
CREATE INDEX ix_event_definitions_id ON event_definitions (id);
CREATE UNIQUE INDEX ix_event_definitions_key ON event_definitions (key);
CREATE UNIQUE INDEX ix_game_starter_templates_template_key ON game_starter_templates (template_key);
CREATE INDEX ix_game_starter_templates_id ON game_starter_templates (id);
CREATE INDEX ix_liability_templates_id ON liability_templates (id);
CREATE UNIQUE INDEX ix_liability_templates_template_key ON liability_templates (template_key);
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE UNIQUE INDEX ix_users_username ON users (username);
CREATE INDEX ix_users_id ON users (id);
CREATE INDEX ix_achievement_tier_definitions_id ON achievement_tier_definitions (id);
CREATE INDEX ix_achievement_tier_definitions_chain_key ON achievement_tier_definitions (chain_key);
CREATE UNIQUE INDEX ix_achievement_tier_definitions_tier_key ON achievement_tier_definitions (tier_key);
CREATE INDEX ix_api_idempotency_records_id ON api_idempotency_records (id);
CREATE INDEX ix_api_idempotency_records_user_id ON api_idempotency_records (user_id);
CREATE INDEX ix_event_choices_id ON event_choices (id);
CREATE INDEX ix_event_choices_definition_id ON event_choices (definition_id);
CREATE INDEX ix_game_profiles_user_id ON game_profiles (user_id);
CREATE INDEX ix_game_profiles_id ON game_profiles (id);
CREATE INDEX ix_game_starter_template_expense_allocations_template_key ON game_starter_template_expense_allocations (template_key);
CREATE INDEX ix_game_starter_template_expense_allocations_id ON game_starter_template_expense_allocations (id);
CREATE INDEX ix_event_instances_id ON event_instances (id);
CREATE INDEX ix_event_instances_period_index ON event_instances (period_index);
CREATE INDEX ix_event_instances_definition_id ON event_instances (definition_id);
CREATE INDEX ix_event_instances_game_profile_id ON event_instances (game_profile_id);
CREATE INDEX ix_finance_assets_game_profile_id ON finance_assets (game_profile_id);
CREATE INDEX ix_finance_assets_id ON finance_assets (id);
CREATE UNIQUE INDEX ix_finance_salaries_game_profile_id ON finance_salaries (game_profile_id);
CREATE INDEX ix_finance_salaries_id ON finance_salaries (id);
CREATE INDEX ix_investment_positions_id ON investment_positions (id);
CREATE INDEX ix_investment_positions_game_profile_id ON investment_positions (game_profile_id);
CREATE INDEX ix_notification_log_game_profile_id ON notification_log (game_profile_id);
CREATE INDEX ix_notification_log_id ON notification_log (id);
CREATE INDEX ix_notification_log_created_at ON notification_log (created_at);
CREATE UNIQUE INDEX ix_notification_log_dedupe_key ON notification_log (dedupe_key);
CREATE INDEX ix_notification_log_user_id ON notification_log (user_id);
CREATE INDEX ix_notification_log_audience ON notification_log (audience);
CREATE INDEX ix_notification_log_kind ON notification_log (kind);
CREATE INDEX ix_period_economy_closings_game_profile_id ON period_economy_closings (game_profile_id);
CREATE INDEX ix_period_economy_closings_id ON period_economy_closings (id);
CREATE INDEX ix_period_snapshots_id ON period_snapshots (id);
CREATE INDEX ix_period_snapshots_game_profile_id ON period_snapshots (game_profile_id);
CREATE INDEX ix_player_run_feedback_user_id ON player_run_feedback (user_id);
CREATE INDEX ix_player_run_feedback_id ON player_run_feedback (id);
CREATE INDEX ix_player_run_feedback_game_profile_id ON player_run_feedback (game_profile_id);
CREATE INDEX ix_profile_expense_lines_id ON profile_expense_lines (id);
CREATE INDEX ix_profile_expense_lines_game_profile_id ON profile_expense_lines (game_profile_id);
CREATE INDEX ix_transactions_game_profile_id ON transactions (game_profile_id);
CREATE INDEX ix_transactions_id ON transactions (id);
CREATE INDEX ix_event_profile_chains_game_profile_id ON event_profile_chains (game_profile_id);
CREATE INDEX ix_event_profile_chains_due_period_index ON event_profile_chains (due_period_index);
CREATE INDEX ix_event_profile_chains_id ON event_profile_chains (id);
CREATE INDEX ix_event_profile_chains_chain_key ON event_profile_chains (chain_key);
CREATE INDEX ix_finance_liabilities_id ON finance_liabilities (id);
CREATE INDEX ix_finance_liabilities_secured_asset_id ON finance_liabilities (secured_asset_id);
CREATE INDEX ix_finance_liabilities_game_profile_id ON finance_liabilities (game_profile_id);
CREATE INDEX ix_insurance_policies_id ON insurance_policies (id);
CREATE INDEX ix_insurance_policies_insured_asset_id ON insurance_policies (insured_asset_id);
CREATE INDEX ix_insurance_policies_game_profile_id ON insurance_policies (game_profile_id);
