-- Инвестиции после «Внести в подушку», в одной линии с цепочкой целей (invest перед safety_6x)

UPDATE game_starter_templates
SET blueprint_json = jsonb_set(
  COALESCE(blueprint_json::jsonb, '{}'::jsonb),
  '{mechanics_unlock}',
  '[{"after_goal": null, "grant": ["capital_flows"]}, {"after_goal": "tutorial_cushion", "grant": ["capital_liabilities", "capital_invest"]}, {"after_goal": "tutorial_invest", "grant": ["capital_insurance"]}, {"after_goal": "tutorial_insurance", "grant": ["capital_property"]}]'::jsonb,
  true
)::text
WHERE template_key IN (
  'mq_game_tight_budget_v1',
  'mq_game_mortgage_stress_v1',
  'mq_game_debt_stack_v1'
);
