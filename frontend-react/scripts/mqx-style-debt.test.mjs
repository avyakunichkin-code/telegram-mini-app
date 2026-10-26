import assert from 'node:assert/strict';
import { colorLiterals, countDebt, fontUnder12 } from './mqx-style-debt.mjs';

// Цвета: голые HEX и rgb/rgba — долг; запасной цвет темы Telegram и токены — нет.
assert.equal(colorLiterals('  color: #6d28d9;').length, 1);
assert.equal(colorLiterals('  background: rgba(0, 0, 0, 0.2);').length, 1);
assert.equal(colorLiterals('  border: 1px solid var(--mq-sky, #0ea5e9);').length, 1);
assert.equal(colorLiterals('  color: var(--tg-theme-hint-color, #8e8e93);').length, 0);
assert.equal(colorLiterals('  color: var(--mq-turn);').length, 0);
assert.equal(colorLiterals('  /* было #fff */ color: var(--mq-turn-on);').length, 0);

// Шрифт < 12 px: литералы и токены micro/small; caption (12) и больше — нет.
assert.equal(fontUnder12('  font-size: 11px;'), true);
assert.equal(fontUnder12('  font-size: 10.5px;'), true);
assert.equal(fontUnder12('  font-size: var(--mq-fs-micro);'), true);
assert.equal(fontUnder12('  font-size: var(--mq-fs-small, 11px);'), true);
assert.equal(fontUnder12('  font-size: 12px;'), false);
assert.equal(fontUnder12('  font-size: var(--mq-fs-caption);'), false);
assert.equal(fontUnder12('  line-height: 10px;'), false);

assert.deepEqual(countDebt('a{color:#fff;font-size:10px}\nb{color:var(--mq-gain)}'), { colors: 1, fontUnder12: 1 });

console.log('mqx-style-debt: ok');
