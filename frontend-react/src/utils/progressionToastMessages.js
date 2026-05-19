/**
 * Чистые форматтеры сообщений (без UI), удобны для unit-тестов.
 */
export function formatAchievementUnlockMessage(unlock) {
  const title = String(unlock?.title || 'Достижение').trim();
  const xp = Number(unlock?.xp_reward ?? unlock?.xp_gained) || 0;
  let message = `Достижение: ${title}`;
  if (xp > 0) {
    message += ` · +${xp} XP`;
  }
  if (unlock?.level_up && unlock?.new_level) {
    message += ` · уровень ${unlock.new_level}`;
  }
  return message;
}
