-- Привязка событий к активам/долгам; ужесточение сценариев ДТП и затопления (PostgreSQL, идемпотентно)

UPDATE event_definitions
SET prerequisites_json = '{"active_asset_kinds_any":["car_personal","car_taxi"]}',
    mandatory_gate = 'blocks_period_end',
    description = 'Столкновение на вашей машине. Нужно решить, как закрыть ущерб: через ОСАГО или за свой счёт — уйти без последствий не получится.'
WHERE key = 'mq11_car_accident';

UPDATE event_definitions
SET prerequisites_json = '{"active_asset_kinds_any":["home","rental_home"]}',
    mandatory_gate = 'blocks_period_end',
    description = 'Прорвало трубу — пострадало ваше жильё. Нужно восстановить квартиру: через страховку имущества или полностью за свой счёт.'
WHERE key = 'mq11_home_water_damage';

UPDATE event_definitions
SET prerequisites_json = '{"min_active_liabilities":1}'
WHERE key = 'mq11_refinance_bank';

-- Удалить устаревший «бесплатный» третий выбор у ДТП и затопления (по заголовку)
DELETE FROM event_choices ec
USING event_definitions ed
WHERE ec.definition_id = ed.id
  AND ed.key = 'mq11_car_accident'
  AND ec.title = 'Договориться без оформления';

DELETE FROM event_choices ec
USING event_definitions ed
WHERE ec.definition_id = ed.id
  AND ed.key = 'mq11_home_water_damage'
  AND ec.title = 'Косметический ремонт (−25 000 ₽)';
