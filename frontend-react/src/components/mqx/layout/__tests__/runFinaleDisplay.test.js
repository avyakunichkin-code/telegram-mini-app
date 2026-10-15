import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { finaleDefeatFact, finaleWinStats, isFinaleWin } from '../runFinaleDisplay.js';

describe('runFinaleDisplay (★ BG-2 финал)', () => {
  it('победа: три показателя из payload', () => {
    const stats = finaleWinStats({
      outcome: 'victory',
      period_index: 38,
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
    const stats = finaleWinStats({ period_index: 21, cash_balance: null, cushion_turns: 0 });
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
