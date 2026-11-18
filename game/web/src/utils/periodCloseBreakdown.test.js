import assert from 'node:assert/strict';

import {
  periodCloseBalanceHeadline,
  periodCloseDetailLines,
  periodCloseHighlightLines,
} from './periodCloseBreakdown.js';

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
    { type: 'deposit_interest', title: 'Вклад', amount: 300 },
  ],
};

// Без period_highlights — только доходные строки (детализация расходов в UI не показывается).
const lines = periodCloseDetailLines(sample);
assert.deepEqual(
  lines.map((l) => l.title),
  ['Доход от активов', 'Вклад'],
);
assert.equal(lines.every((l) => l.tone === 'income'), true);
assert.equal(lines.find((l) => l.title === 'Вклад')?.note, 'капитализированы');

// С period_highlights — они в приоритете и отсортированы: расходы, купоны, проценты.
const withHighlights = {
  ...sample,
  period_highlights: [
    { key: 'deposit_interest', label: 'Проценты по вкладам', amount: 300 },
    { key: 'expenses', label: 'Расходы', amount: 50_000 },
    { key: 'bond_coupons', label: 'Купоны', amount: 0 },
  ],
};
const highlights = periodCloseHighlightLines(withHighlights);
assert.deepEqual(
  highlights.map((l) => [l.type, l.tone]),
  [
    ['expenses', 'expense'],
    ['deposit_interest', 'income'],
  ],
);
assert.deepEqual(periodCloseDetailLines(withHighlights), highlights);

const headline = periodCloseBalanceHeadline(sample);
assert.equal(headline.balance, 42_150);
assert.equal(headline.delta, 1500);
assert.equal(headline.overdueAdded, 5000);

console.log('periodCloseBreakdown.test.js OK');
