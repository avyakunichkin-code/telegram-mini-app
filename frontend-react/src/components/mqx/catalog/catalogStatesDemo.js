/** S4 ritual — #/dev/mqx / design-lab/ui-states-unified. */
export const CATALOG_PERIOD_CLOSE_RITUAL = {
  closed_period_index: 3,
  cash_delta: 3500,
  income_delta: 12_400,
  expense_delta: 8900,
  safety_fund_delta: 0,
  new_balance: 42_150,
  overdue_added: 0,
  breakdown: [
    { type: 'asset_income', title: 'Доход от активов', amount: 2400 },
    { type: 'expense_category', title: 'Еда', amount: 9600 },
    { type: 'expense_category', title: 'Транспорт', amount: 4200 },
    { type: 'lifestyle', title: 'Итого расходы на жизнь', amount: 13_800 },
    { type: 'liability', title: 'Автокредит', amount: 12_000, paid: 12_000, unpaid: 0 },
    { type: 'insurance', title: 'Премии', amount: 1800 },
  ],
};

/** MqxPeriodCloseSheet — 6 строк Δ + детализация, lab: design-lab/period-close/. */
export const CATALOG_PERIOD_CLOSE_SHEET = {
  closed_period_index: 3,
  cash_delta: 1500,
  income_delta: 5000,
  expense_delta: 1200,
  safety_fund_delta: 10000,
  invest_capital_delta: 0,
  debt_delta: -8000,
  new_balance: 55_400,
  overdue_added: 5000,
  breakdown: [
    { type: 'expense_category', title: 'Жильё', amount: 18_000 },
    { type: 'expense_category', title: 'Еда', amount: 12_000 },
    { type: 'lifestyle', title: 'Итого расходы на жизнь', amount: 30_000 },
    { type: 'liability', title: 'Ипотека', paid: 20_000, unpaid: 5000 },
    { type: 'insurance', title: 'Премии', amount: 2000 },
  ],
};
