import { showNotification } from '../components/notifications';
import { formatAchievementUnlockMessage } from './progressionToastMessages.js';

export { formatAchievementUnlockMessage } from './progressionToastMessages.js';

const UNLOCK_STAGGER_MS = 480;
const TOAST_TTL_UNLOCK_MS = 3200;

/**
 * Серия тостов по списку unlock (с задержкой, чтобы не сливались).
 */
export function notifyAchievementUnlocks(unlocks, { startDelayMs = 0 } = {}) {
  if (!Array.isArray(unlocks) || unlocks.length === 0) return;

  unlocks.forEach((item, index) => {
    window.setTimeout(() => {
      showNotification(formatAchievementUnlockMessage(item), 'success', {
        ttlMs: TOAST_TTL_UNLOCK_MS,
      });
    }, startDelayMs + index * UNLOCK_STAGGER_MS);
  });
}

/** Тосты после закрытия периода: достижения. */
export function notifyPeriodCloseRewards(periodClose) {
  if (!periodClose) return;

  const achievements = Array.isArray(periodClose.achievement_unlocks)
    ? periodClose.achievement_unlocks
    : [];

  notifyAchievementUnlocks(achievements);
}
