/**
 * Цветовой уровень сценария (без текстовых бейджей): зелёный → красный.
 * rank 1 — мягкий вход, 4 — максимум решений за период.
 */
export function tierFromRank(rank) {
  const r = Number(rank);
  if (r <= 1) return { slug: 'green' };
  if (r === 2) return { slug: 'amber' };
  if (r === 3) return { slug: 'orange' };
  return { slug: 'red' };
}
