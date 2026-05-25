/** Форматирование целей победы v2 для UI (без React). */

export function pctClamp01(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

export function goalStatusLabel(goal) {
  if (!goal?.enabled) return 'Выкл';
  if (goal.met) return 'Выполнено';
  return 'В работе';
}

/**
 * @returns {import('react').ReactNode | string} — строка или разметка MoneyText снаружи
 */
export function goalProgressHintText(goal) {
  const d = goal?.detail || {};
  const type = goal?.type;

  if (type === 'safety_fund_months' && d.target != null) {
    return { kind: 'money_pair', current: d.current ?? 0, target: d.target };
  }
  if (type === 'no_overdue') {
    const overdue = Number(d.total_overdue_amount) || 0;
    return overdue <= 0 ? 'Без просрочек' : `Просрочка: ${overdue}`;
  }
  if (type === 'net_monthly_cashflow_nonneg') {
    const flow = Number(d.net_monthly_cashflow) || 0;
    return flow >= 0 ? 'Доходы ≥ 0' : `Доходы: ${flow}`;
  }
  if (type === 'avg_liquid_delta_6p') {
    const n = Number(d.samples) || 0;
    const avg = Number(d.avg_net_cashflow_6p) || 0;
    const thr = d.threshold;
    if (thr != null) {
      return { kind: 'avg_threshold', avg: Math.round(avg), threshold: Math.round(thr), samples: n };
    }
    return n > 0 ? `Среднее: ${Math.round(avg)}` : 'Нужно больше периодов';
  }
  if (type === 'cash_balance_min') {
    return { kind: 'money_pair', current: d.cash_balance ?? 0, target: d.min_cash ?? 0 };
  }
  if (type === 'expense_to_income_ratio') {
    const ratio = Number(d.ratio);
    const maxRatio = Number(d.max_ratio);
    if (Number.isFinite(ratio) && Number.isFinite(maxRatio) && maxRatio > 0) {
      return `${Math.round(ratio * 1000) / 10}% / ${Math.round(maxRatio * 100)}% дохода`;
    }
    return 'Доля расходов на жизнь';
  }
  return `${Math.round(pctClamp01(goal.progress) * 100)}%`;
}

export function buildVictorySummary(victory, legacyGoal) {
  if (!victory?.goals?.length) {
    const win = !!legacyGoal?.win;
    const ready = !!legacyGoal?.ready;
    return {
      badge: win ? 'Победа' : ready ? 'Почти' : 'В работе',
      title: 'Финансовая свобода',
      subtitle: null,
      goals: legacyGoal?.target > 0
        ? [
            {
              key: 'legacy_safety',
              title: 'Подушка к цели',
              met: win,
              enabled: true,
              progress: legacyGoal.frac,
              detail: { current: legacyGoal.current, target: legacyGoal.target },
              type: 'safety_fund_months',
            },
          ]
        : [],
      gateOpen: true,
      minPeriod: null,
    };
  }

  const met = Number(victory.goals_met) || 0;
  const required = Number(victory.goals_required) || 0;
  const win = !!victory.win_reached;
  const gateOpen = victory.period_gate_open !== false;
  const isChain = victory.progression_mode === 'chain';

  let badge = 'В работе';
  if (win) badge = 'Победа';
  else if (met >= required && required > 0) badge = 'Почти';

  let subtitle = null;
  if (required > 0) {
    subtitle = isChain ? `Шаг ${Math.min(met + 1, required)} из ${required}` : `${met} из ${required} целей`;
    if (isChain && met >= required) subtitle = `Шаг ${required} из ${required}`;
  }

  return {
    badge,
    title: 'Победа в сценарии',
    subtitle,
    goals: (victory.goals || []).filter((g) => g.enabled !== false),
    gateOpen,
    minPeriod: victory.min_period_index,
  };
}

/** Средний прогресс по включённым целям (0–1) для свёрнутой шкалы уровня. */
export function goalsAggregateFrac(victory, legacyGoal) {
  const summary = buildVictorySummary(victory, legacyGoal);
  const goals = summary.goals.filter((g) => g.enabled !== false);
  if (!goals.length) return 0;
  const sum = goals.reduce((acc, g) => acc + (g.met ? 1 : pctClamp01(g.progress)), 0);
  return sum / goals.length;
}

/** Подпись «M из N» для свёрнутого блока уровня. */
export function goalsAggregateLabel(victory, legacyGoal) {
  const summary = buildVictorySummary(victory, legacyGoal);
  const goals = summary.goals.filter((g) => g.enabled !== false);
  const met = goals.filter((g) => g.met).length;
  const total = goals.length;
  if (total === 0) return null;
  return { met, total, line: `Цели: ${met} из ${total}` };
}
