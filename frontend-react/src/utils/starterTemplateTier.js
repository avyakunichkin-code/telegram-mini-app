/**
 * Уровень сценария для UI: цвет + короткий бейдж (без «сложно/экстрим»).
 * rank 1 — мягкий вход, 4 — максимум решений за период («драйв»).
 */
export function tierFromRank(rank) {
  const r = Number(rank);
  if (r <= 1) return { label: 'Старт', slug: 'easy' };
  if (r === 2) return { label: 'Ритм', slug: 'mid' };
  if (r === 3) return { label: 'Эксперт', slug: 'expert' };
  return { label: 'Драйв', slug: 'drive' };
}
