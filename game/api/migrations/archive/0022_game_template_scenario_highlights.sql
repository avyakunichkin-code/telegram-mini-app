-- UI сценариев: bullets + иконка + compare_note в blueprint_json (идемпотентно перезаписывает поля презентации)

UPDATE game_starter_templates SET blueprint_json = $json$
{"description":"Без долгов и обслуживания активов — чтобы освоить цикл периода без давления платежей.","scenario_icon":"fresh_start","compare_note":"Самый мягкий вход — освоить период без давления обязательств.","highlights":["Скромная зарплата (~50 000 ₽/мес)","Небольшие расходы на жизнь","Нет имущества и долгов на старте","На счёте ~15 000 ₽"],"period_duration_seconds":300,"cash_balance":15000,"monthly_salary":50000,"assets":[],"liabilities":[]}
$json$
WHERE template_key = 'mq_game_basic_v1';

UPDATE game_starter_templates SET blueprint_json = $json$
{"description":"Мало наличных на старте, потребительский кредит и авто с обслуживанием.","scenario_icon":"car_loan","compare_note":"Сложнее «Базового старта»: появились кредит и авто.","highlights":["Средняя зарплата (~45 000 ₽/мес)","Потребительский кредит","Авто: обслуживание каждый период","На счёте ~9 000 ₽"],"period_duration_seconds":300,"cash_balance":9000,"monthly_salary":45000,"assets":[{"title":"Авто","kind":"vehicle","asset_value":210000,"monthly_maintenance_cost":3000,"monthly_income":0}],"liabilities":[{"title":"Потребительский кредит","total_debt":240000,"annual_rate_percent":19}]}
$json$
WHERE template_key = 'mq_game_tight_budget_v1';

UPDATE game_starter_templates SET blueprint_json = $json$
{"description":"Высокий ипотечный платёж и машина: ошибки по кэшу быстро ощущаются.","scenario_icon":"home_mortgage","compare_note":"После «Зарплаты до зарплаты»: ипотека давит сильнее.","highlights":["Зарплата ~46 500 ₽/мес, но платёж по ипотеке высокий","Ипотека с первого периода","Авто + обслуживание","На счёте ~6 500 ₽"],"period_duration_seconds":300,"cash_balance":6500,"monthly_salary":46500,"assets":[{"title":"Авто","kind":"vehicle","asset_value":260000,"monthly_maintenance_cost":4000,"monthly_income":0}],"liabilities":[{"title":"Ипотека","total_debt":690000,"annual_rate_percent":13.5}]}
$json$
WHERE template_key = 'mq_game_mortgage_stress_v1';

UPDATE game_starter_templates SET blueprint_json = $json$
{"description":"Два долга, «жизнь» дороже и почти пустой счёт — для опытных игроков.","scenario_icon":"debt_stack","compare_note":"Максимум давления: два долга и почти пустой счёт.","highlights":["Зарплата ~43 500 ₽/мес, расходы высокие","Ипотека + кредитная карта","Подержанное авто","На счёте ~4 500 ₽"],"period_duration_seconds":300,"cash_balance":4500,"monthly_salary":43500,"assets":[{"title":"Подержанное авто","kind":"vehicle","asset_value":145000,"monthly_maintenance_cost":2900,"monthly_income":0}],"liabilities":[{"title":"Ипотека","total_debt":520000,"annual_rate_percent":14},{"title":"Кредитная карта","total_debt":110000,"annual_rate_percent":24}]}
$json$::text
WHERE template_key = 'mq_game_debt_stack_v1';
