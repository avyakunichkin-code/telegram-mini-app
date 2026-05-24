-- Удаление character_level / character_xp и целей победы character_level.

ALTER TABLE game_profiles DROP COLUMN IF EXISTS level;
ALTER TABLE game_profiles DROP COLUMN IF EXISTS xp;

-- Убрать character_level из victory_config_json шаблонов (если JSON валиден).
UPDATE game_starter_templates
SET victory_config_json = (
    SELECT jsonb_set(
        COALESCE(victory_config_json::jsonb, '{}'::jsonb),
        '{goals}',
        COALESCE(
            (
                SELECT jsonb_agg(g)
                FROM jsonb_array_elements(COALESCE(victory_config_json::jsonb->'goals', '[]'::jsonb)) AS g
                WHERE g->>'type' IS DISTINCT FROM 'character_level'
            ),
            '[]'::jsonb
        )
    )::text
)
WHERE victory_config_json IS NOT NULL
  AND victory_config_json <> ''
  AND victory_config_json <> '{}';
