-- Цепочка подержанного авто: part 1 + part 2 (идемпотентно)

INSERT INTO event_definitions (
  key, mode, title, description, weight, is_active, event_tier, repeat_policy,
  cooldown_periods, mandatory_gate, prerequisites_json
)
SELECT
  'mq11_used_car_deadline',
  'any',
  'Пора решить: подержанное авто',
  'Срок по сделке истекает. Завершите покупку по скидочной цене или откажитесь.',
  1,
  1,
  3,
  'once_per_profile',
  0,
  'blocks_period_end',
  '{}'
WHERE NOT EXISTS (SELECT 1 FROM event_definitions WHERE key = 'mq11_used_car_deadline');

UPDATE event_definitions
SET prerequisites_json = '{"forbid_active_asset_kinds_any":["car_personal","car_taxi"]}',
    description = 'Выгодная сделка на личный автомобиль. Финальное решение через 2 периода.'
WHERE key = 'mq11_used_car_offer';
