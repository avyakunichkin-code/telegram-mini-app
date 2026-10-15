import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildImpactChips, buildNeedsChips, impactChipTone } from '../eventImpactChips.js';

const NBSP = ' ';
const MINUS = '−';

describe('eventImpactChips — ★ BG-2 money chips', () => {
  it('cash: red minus, emerald plus', () => {
    const [loss, gain] = buildImpactChips([
      { kind: 'cash', delta: -12000 },
      { kind: 'cash', delta: 3000 },
    ]);
    assert.equal(loss.tone, 'risk');
    assert.equal(loss.text, `${MINUS}12${NBSP}000${NBSP}₽`);
    assert.equal(gain.tone, 'gain');
    assert.equal(gain.text, `+3${NBSP}000${NBSP}₽`);
  });

  it('burn: growing expenses are risk, falling are gain', () => {
    assert.equal(impactChipTone('burn', 500), 'risk');
    assert.equal(impactChipTone('burn', -500), 'gain');
    const [chip] = buildImpactChips([{ kind: 'burn', delta: 1500, tip: 'x' }]);
    assert.equal(chip.text, `Расходы +1${NBSP}500${NBSP}₽/ход`);
    assert.equal(chip.tip, 'x');
  });

  it('insurance payout is gain, asset price is coin, term is neutral text from tip', () => {
    const chips = buildImpactChips([
      { kind: 'insurance_payout', delta: 20000 },
      { kind: 'coin', delta: 450000 },
      { kind: 'term', delta: 2, tip: 'Продолжение сюжета через 2 пер.' },
    ]);
    assert.deepEqual(chips.map((c) => c.tone), ['gain', 'coin', 'neutral']);
    assert.equal(chips[2].text, 'Продолжение сюжета через 2 пер.');
    assert.equal(chips[2].money, false);
  });

  it('never emits XP chips and tolerates bad input', () => {
    assert.deepEqual(buildImpactChips(null), []);
    const texts = buildImpactChips([{ kind: 'cash', delta: -1 }]).map((c) => c.text).join(' ');
    assert.doesNotMatch(texts, /XP|опыт/i);
  });
});

describe('eventImpactChips — needs chips', () => {
  it('growth is emerald, drop is neutral, zero axes hidden', () => {
    const chips = buildNeedsChips({ comfort: -8, status: 5, social: 0, xp: 10 });
    assert.deepEqual(
      chips.map((c) => [c.text, c.tone]),
      [
        [`Комфорт ${MINUS}8`, 'neutral'],
        ['Статус +5', 'gain'],
      ],
    );
  });

  it('empty for missing delta', () => {
    assert.deepEqual(buildNeedsChips(undefined), []);
  });
});
