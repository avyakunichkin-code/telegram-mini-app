import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { finaleDecisions, finaleDefeatFact, finaleWinStats, isFinaleWin } from '../runFinaleDisplay.js';

describe('runFinaleDisplay (★ BG-2 финал)', () => {
  it('решения: порядок API, знак, оценка и месяцы расходов', () => {
    const result = finaleDecisions({ monthly_burn: 42000, decisions: [
      { direction: 'cost', title: 'Зарплата', amount: 150000, is_estimate: true },
      { direction: 'gain', title: 'Вложения', amount: 86000 },
    ] });
    assert.equal(result[0].sign, '−');
    assert.equal(result[0].is_estimate, true);
    assert.equal(result[0].expenseMonths, '3,6 мес. расходов');
    assert.equal(result[1].sign, '+');
    assert.equal(result[1].expenseMonths, '2 мес. расходов');
  });

  it('пустой/старый payload и некорректные суммы не создают карточки', () => {
    assert.deepEqual(finaleDecisions({}), []);
    assert.deepEqual(finaleDecisions({ decisions: [] }), []);
    assert.deepEqual(finaleDecisions({ decisions: [null, { direction: 'gain', title: 'x', amount: Infinity },
      { direction: 'cost', title: 'x', amount: -1 }, { direction: 'unknown', title: 'x', amount: 1 }] }), []);
    for (const monthly_burn of [0, null, undefined, -1]) {
      assert.equal(finaleDecisions({ monthly_burn, decisions: [{ direction: 'gain', title: 'x', amount: 1 }] })[0].expenseMonths, null);
    }
  });
  it('победа: три показателя из payload', () => {
    const stats = finaleWinStats({
      outcome: 'victory',
      period_index: 39,
      turns_completed: 38,
      cash_balance: 412000,
      cushion_turns: 6.1,
    });
    assert.deepEqual(
      stats.map((s) => s.key),
      ['turns', 'cash', 'cushion'],
    );
    assert.equal(stats[0].value, '38');
    assert.equal(stats[0].label, 'ходов');
    assert.equal(stats[1].value, '412 000 ₽');
    assert.equal(stats[2].value, '6,1');
  });

  it('склонение «ход» и пустые данные', () => {
    const stats = finaleWinStats({ turns_completed: 21, cash_balance: null, cushion_turns: 0 });
    assert.equal(stats[0].label, 'ход');
    assert.equal(stats[1].value, '—');
    assert.equal(stats[2].value, '—');
  });

  it('отрицательный счёт — с минусом', () => {
    assert.equal(finaleWinStats({ cash_balance: -8200 })[1].value, '−8 200 ₽');
  });

  it('поражение: не больше двух советов', () => {
    const fact = finaleDefeatFact({
      outcome: 'defeat',
      fact: { title: 'Три хода подряд счёт был в минусе.', text: 'x', tips: ['a', 'b', 'c'] },
    });
    assert.deepEqual(fact.tips, ['a', 'b']);
    assert.equal(finaleDefeatFact({ outcome: 'defeat' }), null);
    assert.equal(isFinaleWin({ outcome: 'defeat' }), false);
  });
});
