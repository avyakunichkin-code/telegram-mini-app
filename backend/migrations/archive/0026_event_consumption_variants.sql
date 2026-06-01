-- Доп. consumption-события (отдельные key, тот же домен) — идемпотентно

INSERT INTO event_definitions (
  key, mode, title, description, weight, is_active, event_tier, repeat_policy,
  cooldown_periods, mandatory_gate, prerequisites_json, metadata_json
)
SELECT
  'mq11_coffee_takeaway',
  'any',
  'Кофе каждый день',
  'Кофейня у офиса предлагает абонемент на месяц — иначе платите по чашке.',
  82,
  1,
  1,
  'repeatable',
  3,
  'none',
  '{}',
  '{"event_domain":"consumption","interaction_kind":"choice","scenario_shape":"soft_offer"}'
WHERE NOT EXISTS (SELECT 1 FROM event_definitions WHERE key = 'mq11_coffee_takeaway');

INSERT INTO event_definitions (
  key, mode, title, description, weight, is_active, event_tier, repeat_policy,
  cooldown_periods, mandatory_gate, prerequisites_json, metadata_json
)
SELECT
  'mq11_clothing_clearance',
  'any',
  'Распродажа одежды',
  'Магазин закрывает сезон — скидки на базовый гардероб и «полный апгрейд».',
  76,
  1,
  1,
  'repeatable',
  3,
  'none',
  '{}',
  '{"event_domain":"consumption","interaction_kind":"choice","scenario_shape":"soft_offer"}'
WHERE NOT EXISTS (SELECT 1 FROM event_definitions WHERE key = 'mq11_clothing_clearance');

INSERT INTO event_definitions (
  key, mode, title, description, weight, is_active, event_tier, repeat_policy,
  cooldown_periods, mandatory_gate, prerequisites_json, metadata_json
)
SELECT
  'mq11_food_delivery_promo',
  'any',
  'Акция доставки еды',
  'Сервис доставки даёт скидку на неделю заказов — удобно, но дороже готовки дома.',
  88,
  1,
  1,
  'repeatable',
  3,
  'none',
  '{}',
  '{"event_domain":"consumption","interaction_kind":"choice","scenario_shape":"soft_offer"}'
WHERE NOT EXISTS (SELECT 1 FROM event_definitions WHERE key = 'mq11_food_delivery_promo');

INSERT INTO event_definitions (
  key, mode, title, description, weight, is_active, event_tier, repeat_policy,
  cooldown_periods, mandatory_gate, prerequisites_json, metadata_json
)
SELECT
  'mq11_appliance_sale',
  'any',
  'Скидка на бытовую технику',
  'Ритейлер распродаёт мелкую технику — можно заменить износившуюся или отложить.',
  74,
  1,
  1,
  'repeatable',
  3,
  'none',
  '{}',
  '{"event_domain":"consumption","interaction_kind":"choice","scenario_shape":"soft_offer"}'
WHERE NOT EXISTS (SELECT 1 FROM event_definitions WHERE key = 'mq11_appliance_sale');
