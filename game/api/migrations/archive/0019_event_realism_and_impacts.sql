-- Реалистичные исходы событий, релокация +28% burn, травма ноги (PostgreSQL, идемпотентно)

INSERT INTO event_definitions (
  key, mode, title, description, weight, is_active, event_tier, repeat_policy, cooldown_periods, mandatory_gate, prerequisites_json
)
SELECT
  'mq11_sprain_leg',
  'any',
  'Травма: ушибили ногу',
  'Сильный ушиб после падения. Без лечения ходить больно — отложить визит к врачу нельзя.',
  72,
  1,
  2,
  'repeatable',
  4,
  'blocks_period_end',
  '{}'
WHERE NOT EXISTS (SELECT 1 FROM event_definitions WHERE key = 'mq11_sprain_leg');

UPDATE event_definitions
SET mandatory_gate = 'blocks_period_end',
    description = 'Телефон не включается — без связи сложно работать и оплачивать счета.'
WHERE key = 'broken_phone';

UPDATE event_definitions
SET description = 'Работодатель предлагает релокацию: бонус на переезд и заметно более дорогая жизнь в новом городе.'
WHERE key = 'mq11_relocation_bonus';

DELETE FROM event_choices ec
USING event_definitions ed
WHERE ec.definition_id = ed.id
  AND ed.key = 'broken_phone'
  AND ec.title LIKE '%Отложить%';

DELETE FROM event_choices ec
USING event_definitions ed
WHERE ec.definition_id = ed.id
  AND ed.key = 'mq11_pharmacy_stock'
  AND ec.title = 'Отложить';
