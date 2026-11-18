-- Native first-turns questionnaire: no event or questionnaire content in SQL.
CREATE TABLE IF NOT EXISTS player_playtest_surveys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    survey_key VARCHAR(40) NOT NULL,
    state VARCHAR(16) NOT NULL,
    game_profile_id INTEGER NOT NULL REFERENCES game_profiles(id),
    template_key VARCHAR(80),
    period_index INTEGER NOT NULL DEFAULT 0,
    closed_turns INTEGER NOT NULL DEFAULT 0,
    answers_json TEXT,
    comment TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dismissed_at TIMESTAMP WITHOUT TIME ZONE,
    submitted_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT uq_playtest_survey_user_version UNIQUE (user_id, survey_key),
    CONSTRAINT ck_playtest_survey_state CHECK (state IN ('dismissed', 'submitted'))
);
CREATE INDEX IF NOT EXISTS ix_player_playtest_surveys_id ON player_playtest_surveys(id);
