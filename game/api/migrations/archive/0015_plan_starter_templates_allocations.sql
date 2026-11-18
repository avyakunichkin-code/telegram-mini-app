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
