-- Учебная цепочка целей + mechanics_unlock для mq_game_basic_v1 (см. victory_seeds.py)

UPDATE game_starter_templates
SET victory_config_json = '{"schema_version": 1, "min_period_index_for_victory": 7, "required_goals_met": 6, "progression_mode": "chain", "goals": [{"key": "tutorial_salary", "type": "action_once", "title": "Забрать зарплату", "action": "salary_claimed", "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "tutorial_cushion", "type": "action_once", "title": "Внести в подушку", "action": "safety_contributed", "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "flow_nonneg", "type": "net_monthly_cashflow_nonneg", "title": "Стабильный денежный поток", "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "safety_3x", "type": "safety_fund_months", "title": "Подушка ≥ 3× обязательств", "months_multiplier": 3, "requires_mechanics": ["dashboard_core"], "required": false, "enabled": true}, {"key": "tutorial_invest", "type": "action_once", "title": "Открыть депозит или облигацию", "action": "invest_opened", "requires_mechanics": ["capital_invest"], "required": false, "enabled": true}, {"key": "invest_income_15k", "type": "passive_income_monthly_min", "title": "Доход с инвестиций ≥ 15 000 ₽/мес", "min_monthly": 15000, "requires_mechanics": ["capital_invest"], "required": false, "enabled": true}], "playtest_mode": "tutorial"}'
WHERE template_key = 'mq_game_basic_v1';

UPDATE game_starter_templates
SET blueprint_json = jsonb_set(
  COALESCE(blueprint_json::jsonb, '{}'::jsonb),
  '{mechanics_unlock}',
  '[{"after_goal": null, "grant": ["capital_flows"]}, {"after_goal": "tutorial_cushion", "grant": ["capital_invest"]}]'::jsonb,
  true
)::text
WHERE template_key = 'mq_game_basic_v1';
