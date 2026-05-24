/**
 * Чистые форматтеры сообщений (без UI), удобны для unit-тестов.
 */
export function formatAchievementUnlockMessage(unlock) {
  const title = String(unlock?.title || 'Достижение').trim();
  return `Достижение: ${title}`;
}
