-- XP v2: milestone на профиле, счётчики XP за действия подушки в снимке периода.

ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS progression_milestones_awarded TEXT NOT NULL DEFAULT '[]';

ALTER TABLE period_snapshots
  ADD COLUMN IF NOT EXISTS safety_contribute_xp_grants INTEGER NOT NULL DEFAULT 0;

ALTER TABLE period_snapshots
  ADD COLUMN IF NOT EXISTS safety_withdraw_xp_grants INTEGER NOT NULL DEFAULT 0;
