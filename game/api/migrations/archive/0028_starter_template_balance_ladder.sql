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
