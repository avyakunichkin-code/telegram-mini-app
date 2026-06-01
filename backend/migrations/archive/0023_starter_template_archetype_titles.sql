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
