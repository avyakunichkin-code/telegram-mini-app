/**
 * Подсказка «до следующего уровня» и ближайшая разблокировка (overview.character_unlocks).
 */
export function buildLevelProgressHint(overview) {
  const level = Math.max(1, Number(overview?.character_level) || 1);
  const xp = Math.max(0, Number(overview?.character_xp) || 0);
  const needRaw = overview?.character_xp_need_for_next;
  const need = Number.isFinite(Number(needRaw)) ? Number(needRaw) : 0;

  if (need <= 0) {
    return {
      variant: 'max',
      text: 'Максимальный уровень персонажа',
      remaining: 0,
      nextLevel: level,
      nextUnlock: null,
    };
  }

  const remaining = Math.max(0, need - xp);
  const nextLevel = level + 1;
  const unlocks = Array.isArray(overview?.character_unlocks) ? overview.character_unlocks : [];
  const nextUnlock = unlocks
    .filter((u) => !u.unlocked)
    .sort((a, b) => (Number(a.min_level) || 0) - (Number(b.min_level) || 0))[0] || null;

  let text = `Ещё ${remaining} XP до ${nextLevel} уровня`;
  if (nextUnlock?.label) {
    const unlockLevel = Number(nextUnlock.min_level) || 0;
    if (unlockLevel === nextLevel) {
      text += ` · откроется «${nextUnlock.label}»`;
    } else if (unlockLevel > 0) {
      text += ` · на ${unlockLevel} уровне — «${nextUnlock.label}»`;
    }
  }

  return {
    variant: 'progress',
    text,
    remaining,
    nextLevel,
    nextUnlock,
  };
}
