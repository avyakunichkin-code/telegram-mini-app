/** Burn rate из overview (E1): monthly_burn_total с fallback на legacy поле. */
export function getMonthlyBurn(overview) {
  const burn = Number(overview?.monthly_burn_total);
  if (Number.isFinite(burn) && burn > 0) return burn;
  return Number(overview?.monthly_lifestyle_expense) || 0;
}

/** Топ категорий по сумме из monthly_burn_breakdown.by_category. */
export function getTopExpenseCategories(overview, limit = 5) {
  const rows = overview?.monthly_burn_breakdown?.by_category;
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return [...rows]
    .filter((r) => Number(r?.amount) > 0)
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, limit);
}

/** Все статьи бюджета из breakdown.lines. */
export function getExpenseLines(overview) {
  const lines = overview?.monthly_burn_breakdown?.lines;
  return Array.isArray(lines) ? lines : [];
}

export function formatExpenseRatio(ratio) {
  const r = Number(ratio);
  if (!Number.isFinite(r) || r <= 0) return '0%';
  return `${Math.round(r * 1000) / 10}%`;
}
