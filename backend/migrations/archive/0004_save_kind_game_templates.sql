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
