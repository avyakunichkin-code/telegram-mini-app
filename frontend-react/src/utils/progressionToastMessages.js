/**
 * Чистые форматтеры сообщений (без UI), удобны для unit-тестов.
 */

/** Пока guided coach активен — достижения не всплывают поверх затемнения. */
const GUIDED_ONBOARDING_STATES = new Set(['draft', 'started']);

export function isGuidedOnboardingActive(onboardingState) {
  return GUIDED_ONBOARDING_STATES.has(String(onboardingState ?? '').trim());
}

export function formatAchievementUnlockMessage(unlock) {
  const title = String(unlock?.title || 'Достижение').trim();
  return `Достижение: ${title}`;
}
