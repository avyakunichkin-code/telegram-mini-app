-- Предприниматель: иконка factory вместо debt_stack
UPDATE game_starter_templates
SET blueprint_json = REPLACE(blueprint_json::text, '"scenario_icon":"debt_stack"', '"scenario_icon":"factory"')::jsonb
WHERE template_key = 'mq_game_debt_stack_v1'
  AND blueprint_json::text LIKE '%"scenario_icon":"debt_stack"%';
