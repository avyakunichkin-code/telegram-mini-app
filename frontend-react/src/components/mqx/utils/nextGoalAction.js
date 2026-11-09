export function nextGoalAction(goal, cash, outflow) {
  if (!goal || goal.met || goal.enabled === false || goal.available === false) return null;
  const detail = goal.detail || {};
  if (goal.type === 'safety_fund_months') {
    const target = Number(detail.target), current = Number(detail.current);
    if (!Number.isFinite(target) || target <= 0 || !Number.isFinite(current)) return null;
    const remaining = Math.max(0, target - current);
    const free = Math.max(0, (Number(cash) || 0) - Math.max(0, Number(outflow) || 0));
    const amount = Math.floor(Math.min(remaining, free) * 100) / 100;
    return { remaining, current, target, amount, after: (Number(cash) || 0) - amount, kind: 'safety' };
  }
  if (['passive_income_monthly_min', 'passive_income_net_monthly_min'].includes(goal.type)) {
    const current = Number(detail.monthly_passive_income), target = Number(detail.min_monthly);
    if (Number.isFinite(current) && Number.isFinite(target)) return { remaining: Math.max(0, target - current), current, target, kind: 'income' };
  }
  return null;
}
