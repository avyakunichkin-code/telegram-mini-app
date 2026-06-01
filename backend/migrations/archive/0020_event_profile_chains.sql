-- Цепочки событий: отложенный follow-up через N периодов (PostgreSQL, идемпотентно)

CREATE TABLE IF NOT EXISTS event_profile_chains (
  id SERIAL PRIMARY KEY,
  game_profile_id INTEGER NOT NULL REFERENCES game_profiles(id) ON DELETE CASCADE,
  chain_key VARCHAR(80) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'scheduled',
  followup_definition_key VARCHAR(80) NOT NULL,
  after_periods INTEGER NOT NULL DEFAULT 2,
  due_period_index INTEGER NOT NULL,
  context_json TEXT NOT NULL DEFAULT '{}',
  surfaced_instance_id INTEGER NULL REFERENCES event_instances(id) ON DELETE SET NULL,
  created_period_index INTEGER NOT NULL,
  completed_period_index INTEGER NULL,
  created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'utc'),
  updated_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS ix_event_profile_chains_profile_status
  ON event_profile_chains (game_profile_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_event_profile_chains_active_key
  ON event_profile_chains (game_profile_id, chain_key)
  WHERE status IN ('scheduled', 'surfaced');
