-- Заморозка доступных choice_id на момент появления pending-события (ДТП / страховка).

ALTER TABLE event_instances ADD COLUMN IF NOT EXISTS available_choice_ids_json TEXT NOT NULL DEFAULT '[]';
