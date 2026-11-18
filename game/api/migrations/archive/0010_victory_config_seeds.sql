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
