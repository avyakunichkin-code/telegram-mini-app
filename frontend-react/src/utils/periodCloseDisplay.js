/**
 * Строки компактного итога периода (иконка + подпись + Δ со стрелкой).
 * @typedef {{ key: string, label: string, glyph: 'coin'|'up'|'down'|'percent', delta: number }} PeriodCloseRow
 */

function sumBreakdown(breakdown, types, field = 'amount') {
  return (breakdown || []).reduce((acc, item) => {
    if (!item || !types.includes(item.type)) return acc;
    if (item.type === 'liability') return acc + Number(item.paid || 0);
    return acc + Math.abs(Number(item[field] || 0));
  }, 0);
}

/** Fallback, если бэкенд ещё без полей v2. */
export function derivePeriodCloseMetrics(summary) {
  if (!summary) return null;
  const hasV2 = summary.cash_delta != null && summary.closed_period_index != null;
  if (hasV2) {
    return {
      periodIndex: Number(summary.closed_period_index) || 0,
      cashDelta: Number(summary.cash_delta) || 0,
      incomeTotal: Number(summary.income_total) || 0,
      expenseTotal: Number(summary.expense_total) || 0,
      safetyDelta: Number(summary.safety_fund_delta) || 0,
      investDelta: Number(summary.invest_capital_delta) || 0,
    };
  }

  const breakdown = summary.breakdown || [];
  const income =
    sumBreakdown(breakdown, ['asset_income', 'invest', 'salary']) ||
    Math.max(0, Number(summary.new_balance) - Number(summary.total_spent));
  const expense =
    sumBreakdown(breakdown, ['lifestyle', 'expense_category', 'insurance', 'asset']) +
    sumBreakdown(breakdown, ['liability'], 'paid');

  return {
    periodIndex: 0,
    cashDelta: 0,
    incomeTotal: income,
    expenseTotal: expense || Number(summary.total_spent) || 0,
    safetyDelta: 0,
    investDelta: sumBreakdown(breakdown, ['invest']),
  };
}

/** @returns {PeriodCloseRow[]} */
export function periodCloseRows(summary) {
  const m = derivePeriodCloseMetrics(summary);
  if (!m) return [];

  return [
    { key: 'balance', label: 'Баланс', glyph: 'coin', delta: m.cashDelta },
    { key: 'income', label: 'Доходы', glyph: 'up', delta: m.incomeTotal },
    { key: 'expense', label: 'Расходы', glyph: 'down', delta: -Math.abs(m.expenseTotal) },
    { key: 'safety', label: 'Подушка', glyph: 'coin', delta: m.safetyDelta },
    { key: 'invest', label: 'Инвестиции', glyph: 'percent', delta: m.investDelta },
  ];
}

export function periodCloseTitle(summary) {
  const m = derivePeriodCloseMetrics(summary);
  const n = m?.periodIndex || 0;
  return n > 0 ? `Итоги периода #${n}` : 'Итоги периода';
}

export function shouldAutoOpenPeriodClose(summary, autoMax = 3) {
  const m = derivePeriodCloseMetrics(summary);
  const n = m?.periodIndex || 0;
  return n > 0 && n <= autoMax;
}
