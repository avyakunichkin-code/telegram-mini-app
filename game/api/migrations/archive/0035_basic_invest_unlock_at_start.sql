-- Студент (mq_game_basic_v1): депозиты/облигации с первого периода (см. mechanics_progression.DEFAULT_BASIC_UNLOCK)

UPDATE game_starter_templates
SET blueprint_json = jsonb_set(
  COALESCE(blueprint_json::jsonb, '{}'::jsonb),
  '{mechanics_unlock}',
  '[{"after_goal": null, "grant": ["capital_flows", "capital_invest"]}]'::jsonb,
  true
)::text
WHERE template_key = 'mq_game_basic_v1';
