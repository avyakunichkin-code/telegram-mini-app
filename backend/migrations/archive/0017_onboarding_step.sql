-- Guided onboarding: шаг coach на профиле
ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS onboarding_step VARCHAR(40) NOT NULL DEFAULT 'period_timer';

UPDATE game_profiles
SET onboarding_state = 'draft'
WHERE onboarding_state = 'started';
