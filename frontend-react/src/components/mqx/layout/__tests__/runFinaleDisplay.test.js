import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { finaleDefeatFact, finaleRecap, finaleWinStats, isFinaleWin } from '../runFinaleDisplay.js';

describe('runFinaleDisplay (★ BG-2 финал)', () => {
  it('лента решений: нет данных — нет блока', () => {
    assert.equal(finaleRecap({ outcome: 'victory' }), null);
    assert.equal(finaleRecap({ recap: null }), null);
    assert.equal(finaleRecap({ recap: { decisions_label: 'x', decisions: [] } }), null);
  });

  it('лента решений: сумма со знаком и подпись из payload', () => {
    const recap = finaleRecap({
      recap: {
        decisions_label: 'Самые крупные решения по счёту',
        decisions: [
          { period_index: 5, event_title: 'Подработка', choice_title: 'С авансом', cash_delta: 8000 },
          { period_index: 13, event_title: 'Ноутбук', choice_title: 'В рассрочку', cash_delta: -48000 },
        ],
      },
    });
    assert.equal(recap.label, 'Самые крупные решения по счёту');
    assert.equal(recap.items[0].turn, 'Ход 5');
    assert.match(recap.items[0].amount, /^\+8\s000\s₽$/);
    assert.equal(recap.items[0].gain, true);
    assert.match(recap.items[1].amount, /^−48\s000\s₽$/);
    assert.equal(recap.items[1].gain, false);
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
