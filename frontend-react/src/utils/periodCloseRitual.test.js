import assert from 'node:assert/strict';

import { periodCloseMonetkaLine, periodCloseRitualPeriodLabel } from './periodCloseRitual.js';

const base = { closed_period_index: 3, new_balance: 21000, cash_delta: 0, safety_fund_delta: 0 };

// Реплика Монетки под чеком Квити: просрочка важнее похвалы, похвала подушке важнее итога хода.
assert.equal(periodCloseMonetkaLine(null), null);
assert.match(periodCloseMonetkaLine({ ...base, cash_delta: 6000, overdue_added: 1200 }), /просрочка/);
assert.equal(
  periodCloseMonetkaLine({ ...base, cash_delta: 6000, safety_fund_delta: 19000 }),
  'Подушка выросла на 19 000 ₽ — так держать!',
);
assert.match(periodCloseMonetkaLine({ ...base, cash_delta: 6000 }), /^Ход в плюс/);
assert.match(periodCloseMonetkaLine({ ...base, cash_delta: -500 }), /^Ход в минус/);
assert.match(periodCloseMonetkaLine(base), /^Ход в ноль/);

assert.equal(periodCloseRitualPeriodLabel(base), 'Ход №3 завершён');
