import assert from 'node:assert/strict';

import { periodCloseBalanceHeadline, periodCloseDetailLines } from './periodCloseBreakdown.js';

const sample = {
  new_balance: 42_150,
  cash_delta: 1500,
  overdue_added: 5000,
  breakdown: [
    { type: 'asset_income', title: 'Доход от активов', amount: 5000 },
    { type: 'expense_category', title: 'Еда', amount: 12_000 },
    { type: 'expense_category', title: 'Жильё', amount: 18_000 },
    { type: 'lifestyle', title: 'Итого расходы на жизнь', amount: 30_000 },
    { type: 'liability', title: 'Ипотека', paid: 20_000, unpaid: 5000, due: 25_000 },
    { type: 'insurance', title: 'Премии', amount: 2000 },
  ],
};

const lines = periodCloseDetailLines(sample);
assert.equal(lines.some((l) => l.title === 'Итого расходы на жизнь'), false);
assert.equal(lines.find((l) => l.title === 'Еда')?.amount, 12_000);
assert.equal(lines.find((l) => l.title === 'Ипотека')?.note?.includes('5'), true);
assert.equal(lines.find((l) => l.title === 'Ипотека')?.note?.includes('000'), true);

const headline = periodCloseBalanceHeadline(sample);
assert.equal(headline.balance, 42_150);
assert.equal(headline.delta, 1500);
assert.equal(headline.overdueAdded, 5000);

console.log('periodCloseBreakdown.test.js OK');
