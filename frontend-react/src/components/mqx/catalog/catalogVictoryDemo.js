/** Демо-данные victory v2 для #/dev/mqx (G1 / MqxGoalDash). */
export const CATALOG_VICTORY_DEMO = {
  goals_met: 2,
  goals_required: 3,
  period_gate_open: true,
  win_reached: false,
  min_period_index: 7,
  current_goal_key: 'cashflow',
  goals: [
    {
      key: 'safety_3x',
      type: 'safety_fund_months',
      title: 'Подушка ≥ 3× обязательств',
      met: true,
      enabled: true,
      progress: 1,
      detail: { current: 90000, target: 60000 },
    },
    {
      key: 'no_overdue',
      type: 'no_overdue',
      title: 'Без просрочек',
      met: true,
      enabled: true,
      progress: 1,
      detail: { total_overdue_amount: 0 },
    },
    {
      key: 'cashflow',
      type: 'net_monthly_cashflow_nonneg',
      title: 'Доходы ≥ 0',
      met: false,
      enabled: true,
      progress: 0.4,
      detail: { net_monthly_cashflow: -2000 },
    },
  ],
};

export const CATALOG_LEGACY_GOAL_DEMO = {
  target: 60000,
  current: 40000,
  frac: 0.67,
  win: false,
  ready: false,
};
