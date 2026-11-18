-- Victory v2: снять min_period_index_for_victory из конфигов шаблонов (ворота по периоду — только в chain-целях).
UPDATE game_starter_templates
SET victory_config_json = (victory_config_json::jsonb - 'min_period_index_for_victory')::text
WHERE victory_config_json IS NOT NULL
  AND trim(victory_config_json) <> ''
  AND trim(victory_config_json) <> '{}'
  AND victory_config_json::jsonb ? 'min_period_index_for_victory';
