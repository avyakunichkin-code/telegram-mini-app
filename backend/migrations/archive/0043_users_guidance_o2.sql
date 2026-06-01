-- O2 Progressive Guidance: user-level completion + profile nudge streaks

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS guidance_completed INTEGER NOT NULL DEFAULT 0;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS guidance_progress_json TEXT NOT NULL DEFAULT '{}';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS guidance_completed_at TIMESTAMP NULL;

ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS salary_miss_streak INTEGER NOT NULL DEFAULT 0;

ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS negative_close_streak INTEGER NOT NULL DEFAULT 0;

-- Backfill: уже прошли O1
UPDATE users
SET guidance_completed = 1
WHERE guidance_completed = 0
  AND id IN (
    SELECT DISTINCT user_id
    FROM game_profiles
    WHERE onboarding_state = 'brief_done'
  );
