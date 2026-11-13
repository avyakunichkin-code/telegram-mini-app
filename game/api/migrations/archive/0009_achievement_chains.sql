-- Достижения: цепочки (chain) + ступени (tier) + разблокировки на game_profile.

CREATE TABLE IF NOT EXISTS achievement_chains (
  id SERIAL PRIMARY KEY,
  chain_key VARCHAR(80) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  max_tier INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_achievement_chains_active
  ON achievement_chains (is_active, sort_order);

CREATE TABLE IF NOT EXISTS achievement_tier_definitions (
  id SERIAL PRIMARY KEY,
  chain_key VARCHAR(80) NOT NULL REFERENCES achievement_chains(chain_key) ON DELETE CASCADE,
  tier_index INTEGER NOT NULL,
  tier_key VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  criteria_json TEXT NOT NULL DEFAULT '{}',
  xp_reward INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 100,
  CONSTRAINT uq_achievement_tier_chain_index UNIQUE (chain_key, tier_index)
);

CREATE INDEX IF NOT EXISTS ix_achievement_tier_chain
  ON achievement_tier_definitions (chain_key, tier_index);

CREATE TABLE IF NOT EXISTS profile_achievement_unlocks (
  game_profile_id INTEGER NOT NULL REFERENCES game_profiles(id) ON DELETE CASCADE,
  tier_definition_id INTEGER NOT NULL REFERENCES achievement_tier_definitions(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
  period_index INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (game_profile_id, tier_definition_id)
);

CREATE INDEX IF NOT EXISTS ix_profile_achievement_unlocks_profile
  ON profile_achievement_unlocks (game_profile_id);
