-- EVT1-020: content_class, event_slot, audience_template_keys на event_definitions

ALTER TABLE event_definitions
    ADD COLUMN IF NOT EXISTS content_class VARCHAR(32) NOT NULL DEFAULT 'universal';

ALTER TABLE event_definitions
    ADD COLUMN IF NOT EXISTS event_slot VARCHAR(32) NOT NULL DEFAULT 'period_choice';

ALTER TABLE event_definitions
    ADD COLUMN IF NOT EXISTS audience_template_keys TEXT NOT NULL DEFAULT '["all"]';

UPDATE event_definitions
SET content_class = COALESCE(NULLIF(content_class, ''), 'universal'),
    event_slot = COALESCE(NULLIF(event_slot, ''), 'period_choice'),
    audience_template_keys = COALESCE(NULLIF(audience_template_keys, ''), '["all"]')
WHERE content_class IS NULL
   OR event_slot IS NULL
   OR audience_template_keys IS NULL
   OR audience_template_keys = '';
