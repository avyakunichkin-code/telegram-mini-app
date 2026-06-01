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
