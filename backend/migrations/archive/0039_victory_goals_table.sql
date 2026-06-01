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

