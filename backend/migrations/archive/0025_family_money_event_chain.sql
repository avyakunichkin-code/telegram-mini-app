-- Цепочка «родственник»: callback после отказа (идемпотентно)

INSERT INTO event_definitions (
  key, mode, title, description, weight, is_active, event_tier, repeat_policy,
  cooldown_periods, mandatory_gate, prerequisites_json, metadata_json
)
SELECT
  'mq11_family_money_callback',
  'any',
  'Родственник снова просит о помощи',
  'После вашего отказа ситуация не улучшилась — просят уже больше. Можно помочь снова или твёрдо отказать.',
  1,
  1,
  2,
  'once_per_profile',
  0,
  'none',
  '{}',
  '{"event_domain":"social_family","interaction_kind":"chain_followup","scenario_shape":"chain"}'
WHERE NOT EXISTS (SELECT 1 FROM event_definitions WHERE key = 'mq11_family_money_callback');

UPDATE event_definitions
SET description = 'Близкий человек просит небольшую сумму. Помощь разовая; при отказе может снова обратиться через период.',
    metadata_json = '{"event_domain":"social_family","interaction_kind":"choice","scenario_shape":"chain"}',
    cooldown_periods = 4
WHERE key = 'mq11_family_money_request';

UPDATE event_definitions SET is_active = 0 WHERE key = 'mq11_refinance_bank';
