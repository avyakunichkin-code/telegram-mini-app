/**
 * Детализация period_close.breakdown для UI итога периода.
 * @typedef {{ id: string, title: string, amount: number, tone: 'income'|'expense', note?: string }} PeriodCloseDetailLine
 */

const TYPE_ORDER = {
  asset_income: 0,
  invest: 1,
  salary: 2,
  asset: 10,
  expense_category: 11,
  lifestyle: 12,
  insurance: 13,
  liability: 14,
};

export function formatPeriodMoney(n) {
  const v = Math.round(Math.abs(Number(n) || 0));
  return v.toLocaleString('ru-RU');
}

function hasCategoryBreakdown(breakdown) {
  return (breakdown || []).some((item) => item?.type === 'expense_category');
}

function lineAmount(item) {
  if (item?.type === 'liability') {
    return Number(item.paid ?? item.amount) || 0;
  }
  return Math.abs(Number(item.amount) || 0);
}

const HIGHLIGHT_ORDER = {
  expenses: 0,
  bond_coupons: 1,
  deposit_interest: 2,
};

/** Ключевые итоги периода (без детализации расходов). @returns {PeriodCloseDetailLine[]} */
export function periodCloseHighlightLines(summary) {
  const highlights = summary?.period_highlights || [];
  if (!highlights.length) return [];

  return highlights
    .filter((h) => h?.label && Number(h.amount) > 0)
    .map((h, idx) => ({
      id: `highlight-${h.key}-${idx}`,
      type: h.key,
      title: h.label,
      amount: Number(h.amount) || 0,
      tone: h.key === 'expenses' ? 'expense' : 'income',
      note: h.note || undefined,
    }))
    .sort((a, b) => (HIGHLIGHT_ORDER[a.type] ?? 99) - (HIGHLIGHT_ORDER[b.type] ?? 99));
}

/** @deprecated Используйте periodCloseHighlightLines — полная детализация расходов в UI не показывается. */
export function periodCloseDetailLines(summary) {
  const fromHighlights = periodCloseHighlightLines(summary);
  if (fromHighlights.length) return fromHighlights;

  const breakdown = summary?.breakdown || [];
  const investOnly = (breakdown || []).filter((item) =>
    ['bond_coupon', 'deposit_interest', 'asset_income', 'invest'].includes(item?.type),
  );
  if (!investOnly.length) return [];

  return investOnly
    .filter((item) => item?.title && Number(item.amount) > 0)
    .map((item, idx) => ({
      id: `${item.type}-${item.title}-${idx}`,
      type: item.type,
      title: item.title,
      amount: Math.abs(Number(item.amount) || 0),
      tone: 'income',
      note: item.type === 'deposit_interest' ? 'капитализированы' : undefined,
    }));
}

/** Заголовок баланса для ритуала / sheet. */
export function periodCloseBalanceHeadline(summary) {
  if (!summary) return null;
  const balance = Number(summary.new_balance);
  const delta = Number(summary.cash_delta);
  if (!Number.isFinite(balance)) return null;
  return {
    balance,
    delta: Number.isFinite(delta) ? delta : 0,
    overdueAdded: Number(summary.overdue_added) || 0,
  };
}
