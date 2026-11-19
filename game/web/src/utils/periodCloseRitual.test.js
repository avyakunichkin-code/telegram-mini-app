import assert from 'node:assert/strict';

import { periodCloseMonetkaReaction, periodCloseRitualPeriodLabel } from './periodCloseRitual.js';

const base = { closed_period_index: 3, new_balance: 21000, cash_delta: 0, safety_fund_delta: 0 };

// Реплика Монетки под чеком Квити: просрочка важнее похвалы, похвала подушке важнее итога хода.
const overdue = periodCloseMonetkaReaction({ ...base, cash_delta: 6000, safety_fund_delta: 19000, overdue_added: 1200 });
assert.equal(periodCloseMonetkaReaction(null), null);
assert.equal(overdue.pose, 'worried');
assert.match(overdue.text, /просрочка/);
assert.deepEqual(periodCloseMonetkaReaction({ ...base, cash_delta: -500, safety_fund_delta: 19000 }), {
  pose: 'joy',
  text: 'Подушка выросла на 19 000 ₽ — так держать!',
});
assert.equal(periodCloseMonetkaReaction({ ...base, cash_delta: 6000 }).pose, 'joy');
assert.equal(periodCloseMonetkaReaction({ ...base, cash_delta: -500 }).pose, 'support');
assert.equal(periodCloseMonetkaReaction(base).pose, 'think');

assert.equal(periodCloseRitualPeriodLabel(base), 'Ход №3 завершён');
