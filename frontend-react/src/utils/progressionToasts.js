import { showNotification } from '../components/notifications';
import { formatAchievementUnlockMessage } from './progressionToastMessages.js';

export { formatAchievementUnlockMessage } from './progressionToastMessages.js';

const UNLOCK_STAGGER_MS = 480;
const TOAST_TTL_UNLOCK_MS = 3200;
const TOAST_TTL_LEVEL_MS = 3800;
const TOAST_TTL_MILESTONE_MS = 3000;

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

/**
 * Тосты после закрытия периода: достижения → веха → уровень.
 */
export function notifyPeriodCloseRewards(periodClose) {
  if (!periodClose) return;

  const achievements = Array.isArray(periodClose.achievement_unlocks)
    ? periodClose.achievement_unlocks
    : [];

  let offset = 0;
  notifyAchievementUnlocks(achievements, { startDelayMs: offset });
  offset += achievements.length * UNLOCK_STAGGER_MS;

  const milestoneXp = Number(periodClose.xp_milestone) || 0;
  if (milestoneXp > 0) {
    const label = periodClose.milestone_title || 'Веха пути';
    window.setTimeout(() => {
      showNotification(`Веха: ${label} · +${milestoneXp} XP`, 'success', {
        ttlMs: TOAST_TTL_MILESTONE_MS,
      });
    }, offset);
    offset += UNLOCK_STAGGER_MS;
  }

  if (periodClose.level_up && periodClose.new_level) {
    window.setTimeout(() => {
      showNotification(`Уровень ${periodClose.new_level}!`, 'success', {
        ttlMs: TOAST_TTL_LEVEL_MS,
      });
    }, offset);
  }
}
