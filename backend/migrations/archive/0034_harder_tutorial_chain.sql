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
