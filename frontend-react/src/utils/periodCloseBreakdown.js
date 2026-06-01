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

/** @returns {PeriodCloseDetailLine[]} */
export function periodCloseDetailLines(summary) {
  const breakdown = summary?.breakdown || [];
  if (!breakdown.length) return [];

  const skipLifestyleTotal = hasCategoryBreakdown(breakdown);

  return breakdown
    .filter((item) => {
      if (!item?.title) return false;
      if (item.type === 'lifestyle' && skipLifestyleTotal) return false;
      const paid = lineAmount(item);
      const unpaid = item.type === 'liability' ? Number(item.unpaid) || 0 : 0;
      if (paid <= 0 && unpaid <= 0) return false;
      return true;
    })
    .map((item, idx) => {
      const isIncome = item.type === 'asset_income' || item.type === 'invest' || item.type === 'salary';
      const amount = lineAmount(item);
      const unpaid = item.type === 'liability' ? Number(item.unpaid) || 0 : 0;
      return {
        id: `${item.type}-${item.title}-${idx}`,
        type: item.type,
        title: item.title,
        amount,
        tone: isIncome ? 'income' : 'expense',
        note:
          unpaid > 0
            ? `не оплачено ${formatPeriodMoney(unpaid)} ₽`
            : undefined,
      };
    })
    .sort((a, b) => {
      const ta = TYPE_ORDER[a.type] ?? 50;
      const tb = TYPE_ORDER[b.type] ?? 50;
      if (ta !== tb) return ta - tb;
      return a.title.localeCompare(b.title, 'ru');
    });
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
