-- MVP: cooldown, repeat_max, mandatory_gate, счётчики событий на профиль (PostgreSQL, идемпотентно)

-- ---- event_definitions: поля отбора и гейтов ----
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS cooldown_periods INTEGER NOT NULL DEFAULT 0;
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS repeat_max INTEGER NULL;
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS mandatory_gate VARCHAR(32) NOT NULL DEFAULT 'none';
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS prerequisites_json TEXT NOT NULL DEFAULT '{}';

-- legacy mandatory (0/1) → mandatory_gate при первом прогоне
UPDATE event_definitions
SET mandatory_gate = 'blocks_period_end'
WHERE mandatory = 1 AND mandatory_gate = 'none';

CREATE INDEX IF NOT EXISTS ix_event_definitions_mode_active_tier
  ON event_definitions (mode, is_active, event_tier);

-- ---- счётчики выбора событий по профилю ----
CREATE TABLE IF NOT EXISTS event_profile_counters (
  game_profile_id INTEGER NOT NULL REFERENCES game_profiles(id) ON DELETE CASCADE,
  definition_id INTEGER NOT NULL REFERENCES event_definitions(id) ON DELETE CASCADE,
  times_selected INTEGER NOT NULL DEFAULT 0,
  last_selected_period_index INTEGER NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
  PRIMARY KEY (game_profile_id, definition_id)
);

CREATE INDEX IF NOT EXISTS ix_event_profile_counters_profile
  ON event_profile_counters (game_profile_id);

-- бэкфилл из уже выбранных инстансов
INSERT INTO event_profile_counters (game_profile_id, definition_id, times_selected, last_selected_period_index)
SELECT
  ei.game_profile_id,
  ei.definition_id,
  COUNT(*)::INTEGER,
  MAX(ei.period_index)::INTEGER
FROM event_instances ei
WHERE ei.status = 'selected'
GROUP BY ei.game_profile_id, ei.definition_id
ON CONFLICT (game_profile_id, definition_id) DO UPDATE SET
  times_selected = GREATEST(event_profile_counters.times_selected, EXCLUDED.times_selected),
  last_selected_period_index = GREATEST(
    COALESCE(event_profile_counters.last_selected_period_index, 0),
    COALESCE(EXCLUDED.last_selected_period_index, 0)
  );
