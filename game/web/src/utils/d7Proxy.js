/** Порог выборки для вывода по D7 (вход в P3 — PLAN_production-ready, «D7 ≥8% при n≥50»). */
export const D7_MIN_SAMPLE = 50;

/**
 * Плитка D7-прокси Watchtower: доля вернувшихся через 7+ дней среди закрывших ≥1 ход.
 * Пока выборка меньше D7_MIN_SAMPLE, подпись предупреждает, что процент не для выводов.
 */
export function d7ProxyTile(summary) {
  const eligible = Number(summary?.d7_eligible ?? 0);
  const returned = Number(summary?.d7_returned ?? 0);
  if (eligible <= 0) return { value: '—', sub: 'нет игроков старше 7 дней' };
  const pct = Math.round((returned / eligible) * 100);
  const sample = eligible < D7_MIN_SAMPLE ? ` · мало данных (n<${D7_MIN_SAMPLE})` : '';
  return { value: `${pct}%`, sub: `${returned} из ${eligible}${sample}` };
}
